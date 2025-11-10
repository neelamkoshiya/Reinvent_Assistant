import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { dbQueries } from './database.js';
import axios from 'axios';

// Strands Agent using Bedrock LLM with MCP tools
class StrandsAgent {
    constructor() {
        // Initialize Bedrock client as the LLM
        this.bedrockClient = new BedrockRuntimeClient({
            region: process.env.AWS_REGION || 'us-east-1'
        });

        this.modelId = 'anthropic.claude-3-haiku-20240307-v1:0';

        // Define MCP tool strands - organized by capability
        this.strands = {
            conference: {
                name: 'AWS re:Invent Conference Planning',
                description: 'MCP tools for searching and managing AWS re:Invent 2025 conference sessions',
                mcpServer: 'reinvent-schedule-server',
                tools: ['search_sessions', 'get_session_details', 'recommend_sessions', 'create_personalized_schedule'],
                color: 'orange'
            },
            documentation: {
                name: 'AWS Documentation',
                description: 'MCP tools for accessing official AWS documentation via remote server',
                mcpServer: 'aws-documentation-server',
                tools: ['search_aws_docs'],
                color: 'yellow'
            },
            liveData: {
                name: 'Live Data Services',
                description: 'MCP tools for real-time weather, stock, and travel information',
                mcpServer: 'live-data-server',
                tools: ['get_weather', 'get_stock_price', 'search_flights'],
                color: 'blue'
            }
        };

        // MCP tool definitions
        this.mcpTools = {
            search_sessions: {
                strand: 'conference',
                description: 'Search AWS re:Invent conference sessions by keywords, topics, or speakers',
                parameters: { query: 'string', track: 'optional string', level: 'optional string', day: 'optional string' },
                execute: this.searchReInventSessions.bind(this)
            },
            get_session_details: {
                strand: 'conference',
                description: 'Get detailed information about a specific AWS re:Invent session',
                parameters: { sessionId: 'string' },
                execute: this.getSessionDetails.bind(this)
            },
            recommend_sessions: {
                strand: 'conference',
                description: 'Get personalized session recommendations based on interests and role',
                parameters: { interests: 'array of strings', role: 'optional string', experience_level: 'optional string' },
                execute: this.recommendSessions.bind(this)
            },
            create_personalized_schedule: {
                strand: 'conference',
                description: 'Create a personalized conference schedule based on role and learning interests',
                parameters: { role: 'string', learning_topics: 'array of strings', experience_level: 'optional string' },
                execute: this.createPersonalizedSchedule.bind(this)
            },
            search_aws_docs: {
                strand: 'documentation',
                description: 'Search official AWS documentation for services, APIs, and best practices',
                parameters: { query: 'string', service: 'optional string' },
                execute: this.searchAWSDocs.bind(this)
            },
            get_weather: {
                strand: 'liveData',
                description: 'Get current weather information for any city',
                parameters: { location: 'string' },
                execute: this.getWeather.bind(this)
            },
            get_stock_price: {
                strand: 'liveData',
                description: 'Get real-time stock price and market data',
                parameters: { symbol: 'string' },
                execute: this.getStockPrice.bind(this)
            },
            search_flights: {
                strand: 'liveData',
                description: 'Search for flight options to Las Vegas for AWS re:Invent conference',
                parameters: { origin: 'string' },
                execute: this.searchFlights.bind(this)
            }
        };

        console.log('🧵 Strands Agent initialized with Bedrock LLM + MCP tools');
        console.log(`📊 Available strands: ${Object.keys(this.strands).join(', ')}`);
        console.log(`🔧 Available MCP tools: ${Object.keys(this.mcpTools).length}`);
    }

    // Main query processing with Strands architecture using Bedrock LLM + MCP tools
    async processQuery(userMessage, conversationHistory = []) {
        try {
            console.log(`🧵 Strands Agent processing: "${userMessage}"`);

            // Step 1: Use Bedrock LLM to analyze query and select appropriate MCP tools
            const toolPlan = await this.planMCPToolExecution(userMessage);
            console.log('📋 MCP tool execution plan:', toolPlan);

            // Step 2: Execute selected MCP tools across strands in parallel
            const toolResults = await this.executeMCPTools(toolPlan);
            console.log('🔧 MCP tool results:', toolResults.map(r => ({ tool: r.tool, strand: r.strand, success: !r.error })));

            // Step 3: Use Bedrock LLM to generate intelligent response from tool results
            const response = await this.generateResponseFromMCPResults(userMessage, toolResults);

            return {
                response: response,
                toolsUsed: toolResults.map(r => ({
                    tool: r.tool,
                    strand: r.strand,
                    mcpServer: this.strands[r.strand]?.mcpServer,
                    parameters: r.parameters,
                    success: !r.error
                })),
                strandsActivated: [...new Set(toolResults.map(r => r.strand).filter(Boolean))],
                model: 'strands-bedrock-claude-3-haiku',
                architecture: 'strands-mcp-orchestration',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Strands Agent processing error:', error);

            return {
                response: `I apologize, but I encountered an error processing your request with the Strands Agent. Please try rephrasing your question or ask about:
        
🎯 **AWS re:Invent Conference** (MCP): "Show me AI sessions"
📚 **AWS Documentation** (MCP): "How do I use Bedrock?"
🌤️ **Live Data** (MCP): "Weather in Las Vegas"`,
                toolsUsed: [],
                strandsActivated: [],
                model: 'strands-bedrock-error',
                architecture: 'strands-mcp-orchestration',
                error: error.message
            };
        }
    }

    // Intelligent MCP tool planning using Bedrock LLM and strands architecture
    async planMCPToolExecution(userQuery) {
        const toolDescriptions = Object.entries(this.mcpTools)
            .map(([name, tool]) => {
                const params = Object.entries(tool.parameters)
                    .map(([param, desc]) => `    ${param}: ${desc}`)
                    .join('\n');
                return `${name} (${tool.strand} strand): ${tool.description}\n  Parameters:\n${params}`;
            })
            .join('\n\n');

        const strandsInfo = Object.entries(this.strands)
            .map(([key, strand]) => `${key}: ${strand.description} (tools: ${strand.tools.join(', ')})`)
            .join('\n');

        const prompt = `You are a Strands Agent using Bedrock LLM to orchestrate MCP (Model Context Protocol) tools.

STRANDS ARCHITECTURE - MCP TOOL ORGANIZATION:
${strandsInfo}

AVAILABLE MCP TOOLS:
${toolDescriptions}

MCP TOOL SELECTION RULES:
- AWS/Bedrock/Lambda/cloud documentation → search_aws_docs (documentation strand, aws-documentation-server)
- AWS re:Invent sessions/conference/speakers → search_sessions, recommend_sessions, create_personalized_schedule (conference strand, reinvent-schedule-server)  
- Weather/stock/flight data → get_weather, get_stock_price, search_flights (liveData strand, live-data-server)
- Select multiple MCP tools from different strands for complex queries

USER QUERY: "${userQuery}"

Based on the query, which MCP tools should be executed across the strands? Respond with a JSON array:
[
  {
    "tool": "tool_name",
    "parameters": { "param1": "value1" },
    "strand": "strand_name",
    "reasoning": "why this MCP tool is needed"
  }
]

IMPORTANT: Always use MCP tools through their respective strands. No Bedrock agents - only Bedrock LLM + MCP tools.

Only respond with valid JSON, no other text.`;

        try {
            const command = new InvokeModelCommand({
                modelId: this.modelId,
                contentType: 'application/json',
                accept: 'application/json',
                body: JSON.stringify({
                    anthropic_version: 'bedrock-2023-05-31',
                    max_tokens: 1000,
                    messages: [{ role: 'user', content: prompt }]
                })
            });

            const response = await this.bedrockClient.send(command);
            const result = JSON.parse(new TextDecoder().decode(response.body));

            // Extract JSON from response
            const content = result.content[0].text;
            const jsonMatch = content.match(/\[[\s\S]*\]/);

            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            return [];
        } catch (error) {
            console.error('❌ MCP tool planning error:', error);
            // Fallback to simple MCP tool routing
            return this.fallbackMCPToolSelection(userQuery);
        }
    }

    // Execute multiple MCP tools across strands in parallel
    async executeMCPTools(toolPlan) {
        const toolPromises = toolPlan.map(async (toolCall) => {
            try {
                const tool = this.mcpTools[toolCall.tool];
                if (!tool) {
                    throw new Error(`Unknown tool: ${toolCall.tool}`);
                }

                console.log(`🔧 Executing MCP tool ${toolCall.tool} (${tool.strand} strand)`);
                const result = await tool.execute(toolCall.parameters);

                return {
                    tool: toolCall.tool,
                    strand: tool.strand,
                    parameters: toolCall.parameters,
                    result: result,
                    reasoning: toolCall.reasoning
                };
            } catch (error) {
                console.error(`❌ Tool execution error for ${toolCall.tool}:`, error);
                return {
                    tool: toolCall.tool,
                    strand: toolCall.strand,
                    parameters: toolCall.parameters,
                    error: error.message,
                    reasoning: toolCall.reasoning
                };
            }
        });

        return await Promise.all(toolPromises);
    }

    // Generate intelligent response using Bedrock LLM from MCP tool results
    async generateResponseFromMCPResults(userQuery, toolResults) {
        const toolResultsText = toolResults.map(tr => `
Strand: ${tr.strand}
Tool: ${tr.tool}
Parameters: ${JSON.stringify(tr.parameters)}
Reasoning: ${tr.reasoning}
Result: ${tr.error ? `Error: ${tr.error}` : JSON.stringify(tr.result, null, 2)}
`).join('\n');

        const prompt = `You are a Strands Agent using Bedrock LLM to orchestrate MCP tools and generate responses.

USER QUERY: "${userQuery}"

MCP TOOL RESULTS FROM STRANDS:
${toolResultsText}

Based on the user query and the MCP tool results from different strands above, provide a helpful, natural response:
- Format information clearly and conversationally
- Include relevant details from MCP tool results
- Cite sources when appropriate (URLs, data sources)
- If multiple strands were activated, organize the response logically
- Mention which MCP servers provided the data when relevant

Provide a comprehensive, well-formatted response using the MCP tool results.`;

        try {
            const command = new InvokeModelCommand({
                modelId: this.modelId,
                contentType: 'application/json',
                accept: 'application/json',
                body: JSON.stringify({
                    anthropic_version: 'bedrock-2023-05-31',
                    max_tokens: 2000,
                    messages: [{ role: 'user', content: prompt }]
                })
            });

            const response = await this.bedrockClient.send(command);
            const result = JSON.parse(new TextDecoder().decode(response.body));

            return result.content[0].text;
        } catch (error) {
            console.error('❌ Bedrock LLM response generation error:', error);
            return this.formatFallbackResponseFromMCPResults(toolResults);
        }
    }

    // Fallback MCP tool selection when Bedrock LLM planning fails
    fallbackMCPToolSelection(userQuery) {
        const lowerQuery = userQuery.toLowerCase();
        const tools = [];

        if (lowerQuery.includes('bedrock') || lowerQuery.includes('aws') || lowerQuery.includes('lambda') || lowerQuery.includes('documentation')) {
            tools.push({
                tool: 'search_aws_docs',
                parameters: { query: userQuery },
                strand: 'documentation',
                reasoning: 'AWS/technical query detected'
            });
        }

        if (lowerQuery.includes('session') || lowerQuery.includes('reinvent') || lowerQuery.includes('re:invent') || lowerQuery.includes('conference')) {
            // Check if it's a personalized schedule request
            if ((lowerQuery.includes('schedule') || lowerQuery.includes('create') || lowerQuery.includes('personalized')) && 
                (lowerQuery.includes('product manager') || lowerQuery.includes('developer') || lowerQuery.includes('architect'))) {
                tools.push({
                    tool: 'create_personalized_schedule',
                    parameters: { 
                        role: this.extractRole(userQuery) || 'attendee',
                        learning_topics: this.extractTopics(userQuery) || ['AI']
                    },
                    strand: 'conference',
                    reasoning: 'Personalized schedule request detected'
                });
            } else {
                tools.push({
                    tool: 'search_sessions',
                    parameters: { query: userQuery },
                    strand: 'conference',
                    reasoning: 'Conference query detected'
                });
            }
        }

        if (lowerQuery.includes('weather')) {
            const location = this.extractLocation(userQuery) || 'Las Vegas';
            tools.push({
                tool: 'get_weather',
                parameters: { location: location },
                strand: 'liveData',
                reasoning: 'Weather query detected'
            });
        }

        return tools;
    }

    // Helper method to extract role from query
    extractRole(query) {
        const lowerQuery = query.toLowerCase();
        if (lowerQuery.includes('product manager') || lowerQuery.includes('pm')) return 'product manager';
        if (lowerQuery.includes('developer') || lowerQuery.includes('engineer')) return 'developer';
        if (lowerQuery.includes('architect')) return 'architect';
        if (lowerQuery.includes('data scientist')) return 'data scientist';
        if (lowerQuery.includes('devops')) return 'devops';
        if (lowerQuery.includes('security')) return 'security';
        if (lowerQuery.includes('executive') || lowerQuery.includes('manager')) return 'executive';
        return 'attendee';
    }

    // Helper method to extract topics from query
    extractTopics(query) {
        const lowerQuery = query.toLowerCase();
        const topics = [];
        
        if (lowerQuery.includes('agent') || lowerQuery.includes('agentic')) topics.push('agents');
        if (lowerQuery.includes('ai') || lowerQuery.includes('artificial intelligence')) topics.push('ai');
        if (lowerQuery.includes('machine learning') || lowerQuery.includes('ml')) topics.push('machine learning');
        if (lowerQuery.includes('bedrock')) topics.push('bedrock');
        if (lowerQuery.includes('lambda')) topics.push('lambda');
        if (lowerQuery.includes('security')) topics.push('security');
        if (lowerQuery.includes('data')) topics.push('data');
        if (lowerQuery.includes('leadership')) topics.push('leadership');
        
        return topics.length > 0 ? topics : ['AI'];
    }

    // Call MCP Server method
    async callMCPServer(serverName, toolName, parameters) {
        try {
            // For now, we'll use direct database calls since we're in the same process
            // In a real MCP setup, this would make HTTP/stdio calls to the server
            if (serverName === 'reinvent-schedule-server') {
                const { dbQueries } = await import('./database.js');
                
                switch (toolName) {
                    case 'search_sessions':
                        const results = await dbQueries.searchSessions(
                            parameters.query, 
                            parameters.track, 
                            parameters.level, 
                            parameters.day
                        );
                        return {
                            found: results.length,
                            sessions: results.map(session => ({
                                id: session.id,
                                title: session.title,
                                description: session.description || 'Session description available',
                                speakers: session.speakers || 'Speakers TBD',
                                time: session.time || 'Time TBD',
                                day: session.day || 'Day TBD',
                                dayTime: session.dayTime || 'Schedule TBD',
                                type: session.type || 'Session',
                                level: session.level || 'All levels',
                                venue: session.venue || 'Venue TBD',
                                services: session.services || '',
                                tags: session.tags || '',
                                url: session.url || ''
                            }))
                        };
                        
                    case 'get_session_details':
                        const session = await dbQueries.getSessionById(parameters.session_id);
                        if (!session) {
                            return { error: 'Session not found' };
                        }
                        return {
                            ...session,
                            speakers: session.speakers || 'Speakers TBD',
                            time: session.time || 'Time TBD',
                            day: session.day || 'Day TBD',
                            venue: session.venue || 'Venue TBD',
                            description: session.description || 'Session description available',
                            dayTime: session.dayTime || 'Schedule TBD'
                        };
                        
                    case 'recommend_sessions':
                        // Use enhanced recommendation logic
                        let allSessions = await dbQueries.getAllSessions();
                        const scoredSessions = allSessions.map(session => {
                            let score = 0;
                            
                            if (parameters.interests) {
                                parameters.interests.forEach(interest => {
                                    const interestLower = interest.toLowerCase();
                                    if (session.title.toLowerCase().includes(interestLower)) score += 4;
                                    if (session.tags && session.tags.toLowerCase().includes(interestLower)) score += 3;
                                    if (session.services && session.services.toLowerCase().includes(interestLower)) score += 2;
                                });
                            }
                            
                            if (parameters.role && session.tags) {
                                const roleLower = parameters.role.toLowerCase();
                                if (session.tags.toLowerCase().includes(roleLower)) score += 5;
                            }
                            
                            return { ...session, relevanceScore: score };
                        });
                        
                        const recommendations = scoredSessions
                            .filter(s => s.relevanceScore > 0)
                            .sort((a, b) => b.relevanceScore - a.relevanceScore)
                            .slice(0, parameters.limit || 10);
                            
                        return {
                            total_found: recommendations.length,
                            recommendations: recommendations.map(session => ({
                                id: session.id,
                                title: session.title,
                                description: session.description || 'Session description available',
                                speakers: session.speakers || 'Speakers TBD',
                                time: session.time || 'Time TBD',
                                day: session.day || 'Day TBD',
                                type: session.type || 'Session',
                                level: session.level || 'All levels',
                                venue: session.venue || 'Venue TBD',
                                relevanceScore: session.relevanceScore,
                                tags: session.tags || '',
                                services: session.services || '',
                                dayTime: session.dayTime || 'Schedule TBD'
                            }))
                        };
                        
                    case 'create_personalized_schedule':
                        // This would call our enhanced create_personalized_schedule logic
                        // For now, return a simplified version
                        const scheduleResults = await dbQueries.searchSessions(
                            parameters.learning_topics ? parameters.learning_topics.join(' ') : '',
                            null, parameters.experience_level, null
                        );
                        
                        return {
                            personalized_schedule: {
                                role: parameters.role,
                                learning_topics: parameters.learning_topics,
                                total_sessions: scheduleResults.length,
                                schedule: {
                                    'Monday': scheduleResults.filter(s => s.day === 'Monday').slice(0, 4),
                                    'Tuesday': scheduleResults.filter(s => s.day === 'Tuesday').slice(0, 4),
                                    'Wednesday': scheduleResults.filter(s => s.day === 'Wednesday').slice(0, 4),
                                    'Thursday': scheduleResults.filter(s => s.day === 'Thursday').slice(0, 4),
                                    'Friday': scheduleResults.filter(s => s.day === 'Friday').slice(0, 4)
                                }
                            }
                        };
                        
                    default:
                        throw new Error(`Unknown tool: ${toolName}`);
                }
            }
            
            throw new Error(`Unknown MCP server: ${serverName}`);
            
        } catch (error) {
            console.error(`Error calling MCP server ${serverName}.${toolName}:`, error);
            throw error;
        }
    }

    // MCP Tool Implementations
    async searchReInventSessions(params) {
        try {
            const result = await this.callMCPServer('reinvent-schedule-server', 'search_sessions', params);
            return result;
        } catch (error) {
            console.error('Error calling search_sessions:', error);
            // Fallback to direct database query
            return await dbQueries.searchSessions(params.query, params.track, params.level, params.day);
        }
    }

    async getSessionDetails(params) {
        try {
            const result = await this.callMCPServer('reinvent-schedule-server', 'get_session_details', { session_id: params.sessionId });
            return result;
        } catch (error) {
            console.error('Error calling get_session_details:', error);
            // Fallback to direct database query
            return await dbQueries.getSessionById(params.sessionId);
        }
    }

    async recommendSessions(params) {
        try {
            const result = await this.callMCPServer('reinvent-schedule-server', 'recommend_sessions', params);
            return result;
        } catch (error) {
            console.error('Error calling recommend_sessions:', error);
            // Fallback to simplified logic
            let sessions = await dbQueries.getAllSessions();
            if (params.interests && params.interests.length > 0) {
                sessions = sessions.filter(session =>
                    params.interests.some(interest =>
                        (session.tags && session.tags.toLowerCase().includes(interest.toLowerCase())) ||
                        session.title.toLowerCase().includes(interest.toLowerCase()) ||
                        (session.type && session.type.toLowerCase().includes(interest.toLowerCase()))
                    )
                );
            }
            return sessions.slice(0, 5);
        }
    }

    async createPersonalizedSchedule(params) {
        try {
            const result = await this.callMCPServer('reinvent-schedule-server', 'create_personalized_schedule', params);
            return result;
        } catch (error) {
            console.error('Error calling create_personalized_schedule:', error);
            throw new Error(`Failed to create personalized schedule: ${error.message}`);
        }
    }

    async searchAWSDocs(params) {
        try {
            const { spawn } = await import('child_process');

            console.log(`🔍 AWS Documentation MCP server: searching for "${params.query}"`);

            const serverProcess = spawn('uvx', ['awslabs.aws-documentation-mcp-server@latest'], {
                stdio: ['pipe', 'pipe', 'pipe']
            });

            return new Promise((resolve) => {
                let responseData = '';
                const timeout = setTimeout(() => {
                    serverProcess.kill();
                    console.log('⏰ AWS MCP server timeout, using fallback');
                    resolve(this.generateMockAWSDocs(params.query, params.service));
                }, 10000);

                const initRequest = {
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'initialize',
                    params: {
                        protocolVersion: '2024-11-05',
                        capabilities: {},
                        clientInfo: { name: 'strands-agent', version: '1.0.0' }
                    }
                };

                const toolRequest = {
                    jsonrpc: '2.0',
                    id: 2,
                    method: 'tools/call',
                    params: {
                        name: 'search_documentation',
                        arguments: {
                            search_phrase: params.query,
                            service: params.service,
                            max_results: 5
                        }
                    }
                };

                let initialized = false;

                serverProcess.stdout.on('data', (data) => {
                    responseData += data.toString();

                    const lines = responseData.split('\n');
                    for (const line of lines) {
                        if (line.trim()) {
                            try {
                                const response = JSON.parse(line);

                                if (response.id === 1 && response.result && !initialized) {
                                    initialized = true;
                                    serverProcess.stdin.write(JSON.stringify(toolRequest) + '\n');
                                } else if (response.id === 2 && response.result) {
                                    clearTimeout(timeout);
                                    serverProcess.kill();

                                    const structuredResults = response.result.structuredContent?.result || [];
                                    resolve({
                                        query: params.query,
                                        service: params.service || 'all',
                                        results: structuredResults.slice(0, 5).map(result => ({
                                            title: result.title || 'AWS Documentation',
                                            url: result.url || '#',
                                            summary: result.context || 'AWS service documentation',
                                            service: params.service || 'aws',
                                            relevance: result.rank_order ? (11 - result.rank_order) / 10 : 0.9
                                        })),
                                        source: 'AWS Documentation MCP Server (Remote)',
                                        strand: 'documentation'
                                    });
                                    return;
                                }
                            } catch (e) {
                                // Continue parsing
                            }
                        }
                    }
                });

                serverProcess.on('error', () => {
                    clearTimeout(timeout);
                    resolve(this.generateMockAWSDocs(params.query, params.service));
                });

                serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');
            });

        } catch (error) {
            console.error('❌ AWS Documentation MCP server error:', error);
            return this.generateMockAWSDocs(params.query, params.service);
        }
    }

    async getWeather(params) {
        try {
            const response = await axios.get(`http://localhost:3001/api/weather/${encodeURIComponent(params.location)}`);
            const data = JSON.parse(response.data.content[0].text);
            return { ...data, strand: 'liveData' };
        } catch (error) {
            return { error: `Weather data unavailable for ${params.location}`, strand: 'liveData' };
        }
    }

    async getStockPrice(params) {
        try {
            const response = await axios.get(`http://localhost:3001/api/stocks/${params.symbol}`);
            const data = JSON.parse(response.data.content[0].text);
            return { ...data, strand: 'liveData' };
        } catch (error) {
            return { error: `Stock data unavailable for ${params.symbol}`, strand: 'liveData' };
        }
    }

    async searchFlights(params) {
        try {
            const route = `${params.origin.toUpperCase()}-ORD`;
            const response = await axios.get(`http://localhost:3001/api/flights/${route}`);
            const data = JSON.parse(response.data.content[0].text);
            return { ...data, strand: 'liveData' };
        } catch (error) {
            return { error: `Flight data unavailable for route ${params.origin} to Las Vegas`, strand: 'liveData' };
        }
    }

    // Helper methods
    generateMockAWSDocs(query, service) {
        const mockResults = [
            {
                title: '[MCP FALLBACK] Amazon Bedrock - Getting Started',
                url: 'https://docs.aws.amazon.com/bedrock/latest/userguide/getting-started.html',
                summary: 'Learn how to get started with Amazon Bedrock, a fully managed service for foundation models.',
                service: 'bedrock',
                relevance: 0.95
            }
        ];

        return {
            query: query,
            service: service || 'all',
            results: mockResults,
            source: 'Mock AWS Documentation (MCP fallback)',
            strand: 'documentation'
        };
    }

    extractLocation(message) {
        const cityPatterns = [
            /weather in ([^?]+)/i,
            /weather for ([^?]+)/i,
            /([a-zA-Z\s]+) weather/i
        ];

        for (const pattern of cityPatterns) {
            const match = message.match(pattern);
            if (match && match[1]) {
                return match[1].trim().replace(/\b(the|what's|what is)\b/gi, '').trim();
            }
        }
        return null;
    }

    formatFallbackResponseFromMCPResults(toolResults) {
        let response = 'Here are the results from the Strands Agent using MCP tools:\n\n';

        toolResults.forEach(result => {
            const strand = this.strands[result.strand];
            response += `**${strand?.name || result.strand}:**\n`;

            if (result.error) {
                response += `Error: ${result.error}\n\n`;
            } else if (result.tool === 'search_aws_docs') {
                response += this.formatAWSDocsResponse(result.result);
            } else if (result.tool === 'search_sessions') {
                response += this.formatSessionsResponse(result.result);
            } else if (result.tool === 'get_weather') {
                response += this.formatWeatherResponse(result.result);
            }
        });

        return response;
    }

    formatAWSDocsResponse(result) {
        if (result.error) return `Error: ${result.error}\n\n`;

        const results = result.results || [];
        if (results.length === 0) return 'No AWS documentation found.\n\n';

        return results.map(doc =>
            `📚 **${doc.title}**\n🔗 ${doc.url}\n📝 ${doc.summary}\n`
        ).join('\n') + '\n';
    }

    formatSessionsResponse(sessions) {
        if (!sessions || sessions.length === 0) return 'No AWS re:Invent sessions found.\n\n';

        return sessions.slice(0, 3).map(session =>
            `📅 **${session.title}**\n👤 Speaker: ${session.speaker}\n🕐 Time: ${session.time} (${session.day})\n📍 Location: ${session.location}\n🏷️ Track: ${session.track}\n`
        ).join('\n') + '\n';
    }

    formatWeatherResponse(weather) {
        if (weather.error) return `Weather error: ${weather.error}\n\n`;

        return `🌡️ Temperature: ${weather.temperature}°F\n☁️ Condition: ${weather.condition}\n💧 Humidity: ${weather.humidity}%\n💨 Wind Speed: ${weather.windSpeed} mph\n\n3-Day Forecast:\n${weather.forecast?.map(day => `${day.day}: ${day.high}°/${day.low}° - ${day.condition}`).join('\n') || 'Forecast unavailable'}\n\n`;
    }
}

export { StrandsAgent };