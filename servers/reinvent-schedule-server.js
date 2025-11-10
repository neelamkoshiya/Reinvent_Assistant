#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { dbQueries } from './database.js';

const server = new Server(
  {
    name: 'reinvent-schedule-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_sessions',
        description: 'Search AWS re:Invent 2025 conference sessions by topic, type, level, venue, or keywords',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query (topic, speaker, keywords, services)',
            },
            track: {
              type: 'string',
              description: 'Filter by session type (Workshop, Breakout session, Chalk talk, Builders\' session, etc.)',
            },
            level: {
              type: 'string',
              description: 'Filter by level (200 – Intermediate, 300 – Advanced, 400 – Expert)',
            },
            day: {
              type: 'string',
              description: 'Filter by day (Monday, Tuesday, Wednesday, Thursday, Friday)',
            },
            venue: {
              type: 'string',
              description: 'Filter by venue (MGM, Mandalay Bay, Venetian, Wynn, Caesars Forum, etc.)',
            },
          },
        },
      },
      {
        name: 'get_session_details',
        description: 'Get detailed information about a specific session',
        inputSchema: {
          type: 'object',
          properties: {
            session_id: {
              type: 'string',
              description: 'The ID of the session to get details for',
            },
          },
          required: ['session_id'],
        },
      },
      {
        name: 'get_schedule_by_day',
        description: 'Get all sessions scheduled for a specific day',
        inputSchema: {
          type: 'object',
          properties: {
            day: {
              type: 'string',
              description: 'The day to get schedule for (Monday, Tuesday, Wednesday, Thursday, Friday)',
            },
          },
          required: ['day'],
        },
      },
      {
        name: 'recommend_sessions',
        description: 'Get personalized session recommendations based on interests and role',
        inputSchema: {
          type: 'object',
          properties: {
            interests: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of interests/topics (e.g., ["AI", "Leadership", "Career"])',
            },
            role: {
              type: 'string',
              description: 'Professional role (e.g., "product manager", "developer", "architect")',
            },
            experience_level: {
              type: 'string',
              description: 'Experience level (100 – Introductory, 200 – Intermediate, 300 – Advanced, 400 – Expert)',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of recommendations to return (default: 10)',
              default: 10,
            },
          },
          required: ['interests'],
        },
      },
      {
        name: 'get_available_tracks',
        description: 'Get all available session types (tracks)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_available_venues',
        description: 'Get all available conference venues',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_available_levels',
        description: 'Get all available experience levels',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_conference_days',
        description: 'Get all conference days',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'create_personalized_schedule',
        description: 'Create a personalized conference schedule based on role and learning interests',
        inputSchema: {
          type: 'object',
          properties: {
            role: {
              type: 'string',
              description: 'Professional role (e.g., "product manager", "developer", "architect", "data scientist")',
            },
            learning_topics: {
              type: 'array',
              items: { type: 'string' },
              description: 'Topics to learn about (e.g., ["agents", "AI", "machine learning", "leadership"])',
            },
            experience_level: {
              type: 'string',
              description: 'Experience level (100 – Introductory, 200 – Intermediate, 300 – Advanced, 400 – Expert)',
            },
            max_sessions_per_day: {
              type: 'number',
              description: 'Maximum number of sessions per day (default: 4)',
              default: 4,
            },
            avoid_conflicts: {
              type: 'boolean',
              description: 'Whether to avoid time conflicts (default: true)',
              default: true,
            },
          },
          required: ['role', 'learning_topics'],
        },
      },
      {
        name: 'debug_database',
        description: 'Debug tool to inspect database contents and search capabilities',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              description: 'Debug action: "count", "sample", "search_test", "roles_sample"',
              enum: ['count', 'sample', 'search_test', 'roles_sample'],
            },
            limit: {
              type: 'number',
              description: 'Limit for sample results (default: 5)',
              default: 5,
            },
          },
          required: ['action'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'search_sessions': {
        const { query, track, level, day, venue } = args;
        let results = await dbQueries.searchSessions(query, track, level, day);
        
        // Additional venue filtering
        if (venue) {
          results = results.filter(session => 
            session.venue && session.venue.toLowerCase().includes(venue.toLowerCase())
          );
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
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
              }, null, 2),
            },
          ],
        };
      }

      case 'get_session_details': {
        const { session_id } = args;
        const session = await dbQueries.getSessionById(session_id);

        if (!session) {
          // Instead of returning error, search for similar sessions
          const similarSessions = await dbQueries.searchSessions(session_id);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  message: `Session ${session_id} not found, but here are similar sessions:`,
                  similar_sessions: similarSessions.slice(0, 3).map(s => ({
                    id: s.id,
                    title: s.title,
                    description: s.description || 'Session description available',
                    speaker: s.speaker || 'Speaker TBD',
                    time: s.time || 'Time TBD',
                    day: s.day || 'Day TBD',
                    track: s.track || 'General',
                    level: s.level || 'All levels',
                    location: s.location || 'Location TBD'
                  }))
                }, null, 2),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                ...session,
                speakers: session.speakers || 'Speakers TBD',
                time: session.time || 'Time TBD',
                day: session.day || 'Day TBD',
                venue: session.venue || 'Venue TBD',
                description: session.description || 'Session description available',
                dayTime: session.dayTime || 'Schedule TBD'
              }, null, 2),
            },
          ],
        };
      }

      case 'get_schedule_by_day': {
        const { day } = args;
        const sessions = await dbQueries.getSessionsByDay(day);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                day,
                sessions: sessions
              }, null, 2),
            },
          ],
        };
      }

      case 'recommend_sessions': {
        const { interests, role, experience_level, limit = 10 } = args;
        let recommendations = await dbQueries.getAllSessions();

        // Enhanced scoring with role consideration
        recommendations = recommendations.map(session => {
          let score = 0;
          
          // Role matching using tags field
          if (role && session.tags) {
            const sessionTags = session.tags.toLowerCase();
            const userRole = role.toLowerCase();
            
            if (sessionTags.includes(userRole)) {
              score += 5;
            }
            
            // Role synonyms
            const roleSynonyms = {
              'product manager': ['product', 'pm', 'product management', 'business executive'],
              'developer': ['dev', 'engineer', 'software engineer', 'developer / engineer'],
              'architect': ['solution architect', 'technical architect', 'solution / systems architect'],
              'data scientist': ['data', 'analytics', 'ml engineer', 'data scientist'],
              'devops': ['devops engineer', 'sre', 'platform engineer'],
              'it manager': ['it professional / technical manager', 'technical manager']
            };
            
            const synonyms = roleSynonyms[userRole] || [];
            synonyms.forEach(synonym => {
              if (sessionTags.includes(synonym)) {
                score += 3;
              }
            });
          }
          
          // Interest matching with enhanced scoring
          if (interests) {
            interests.forEach(interest => {
              const interestLower = interest.toLowerCase();
              
              if (session.title.toLowerCase().includes(interestLower)) {
                score += 4;
              }
              if (session.tags && session.tags.toLowerCase().includes(interestLower)) {
                score += 3;
              }
              if (session.services && session.services.toLowerCase().includes(interestLower)) {
                score += 2;
              }
              if (session.type && session.type.toLowerCase().includes(interestLower)) {
                score += 1;
              }
              if (session.description && session.description.toLowerCase().includes(interestLower)) {
                score += 2;
              }
              
              // Interest synonyms
              const interestSynonyms = {
                'agents': ['agent', 'ai agent', 'bedrock agents'],
                'ai': ['artificial intelligence', 'machine learning', 'ml'],
                'leadership': ['management', 'strategy', 'executive']
              };
              
              const synonyms = interestSynonyms[interestLower] || [];
              synonyms.forEach(synonym => {
                if (session.title.toLowerCase().includes(synonym) ||
                    (session.tags && session.tags.toLowerCase().includes(synonym)) ||
                    (session.services && session.services.toLowerCase().includes(synonym))) {
                  score += 2;
                }
              });
            });
          }
          
          return { ...session, relevanceScore: score };
        });

        // Filter by experience level
        if (experience_level) {
          recommendations = recommendations.filter(session =>
            session.level === experience_level
          );
        }

        // Sort by relevance score, but always return results
        recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);
        
        // If no high-scoring matches, include general sessions
        if (recommendations.filter(s => s.relevanceScore > 0).length < limit) {
          const generalSessions = recommendations.filter(s => s.relevanceScore === 0);
          // Add some score to general sessions based on session type
          generalSessions.forEach(session => {
            if (session.type && session.type.toLowerCase().includes('keynote')) {
              session.relevanceScore = 0.8;
            } else if (session.type && session.type.toLowerCase().includes('workshop')) {
              session.relevanceScore = 0.6;
            } else if (session.level === '200') {
              session.relevanceScore = 0.4;
            } else {
              session.relevanceScore = 0.1;
            }
          });
          recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);
        }

        const finalRecommendations = recommendations.slice(0, limit);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                total_found: recommendations.length,
                recommendations: finalRecommendations.map(session => ({
                  id: session.id,
                  title: session.title,
                  description: session.description || 'Session description available',
                  speaker: session.speaker || 'Speaker TBD',
                  time: session.time || 'Time TBD',
                  day: session.day || 'Day TBD',
                  track: session.track || 'General',
                  level: session.level || 'All levels',
                  location: session.location || 'Location TBD',
                  type: session.type || 'Session',
                  relevanceScore: session.relevanceScore,
                  matchedInterests: interests?.filter(interest =>
                    session.title.toLowerCase().includes(interest.toLowerCase()) ||
                    (session.tags && session.tags.toLowerCase().includes(interest.toLowerCase())) ||
                    (session.services && session.services.toLowerCase().includes(interest.toLowerCase()))
                  ) || [],
                  roleMatch: role && session.tags && session.tags.toLowerCase().includes(role.toLowerCase()),
                  tags: session.tags || '',
                  services: session.services || '',
                  venue: session.venue || 'Venue TBD',
                  dayTime: session.dayTime || 'Schedule TBD'
                }))
              }, null, 2),
            },
          ],
        };
      }

      case 'get_available_tracks': {
        const tracks = await dbQueries.getTracks();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ session_types: tracks }, null, 2),
            },
          ],
        };
      }

      case 'get_available_venues': {
        const venues = await dbQueries.getVenues();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ venues }, null, 2),
            },
          ],
        };
      }

      case 'get_available_levels': {
        const levels = await dbQueries.getLevels();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ levels }, null, 2),
            },
          ],
        };
      }

      case 'get_conference_days': {
        const days = await dbQueries.getDays();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ days }, null, 2),
            },
          ],
        };
      }

      case 'debug_database': {
        const { action, limit = 5 } = args;
        
        try {
          switch (action) {
            case 'count': {
              const allSessions = await dbQueries.getAllSessions();
              return {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify({
                      total_sessions: allSessions.length,
                      message: `Database contains ${allSessions.length} sessions`
                    }, null, 2),
                  },
                ],
              };
            }
            
            case 'sample': {
              const allSessions = await dbQueries.getAllSessions();
              const sample = allSessions.slice(0, limit);
              return {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify({
                      total_sessions: allSessions.length,
                      sample_sessions: sample.map(s => ({
                        id: s.id,
                        title: s.title,
                        roles: s.roles,
                        topics: s.topics,
                        areas_of_interest: s.areas_of_interest,
                        level: s.level,
                        type: s.type
                      }))
                    }, null, 2),
                  },
                ],
              };
            }
            
            case 'search_test': {
              const agentResults = await dbQueries.searchSessions('agent');
              const aiResults = await dbQueries.searchSessions('AI');
              return {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify({
                      agent_search_results: agentResults.length,
                      ai_search_results: aiResults.length,
                      agent_samples: agentResults.slice(0, 3).map(s => ({
                        title: s.title,
                        topics: s.topics,
                        roles: s.roles
                      })),
                      ai_samples: aiResults.slice(0, 3).map(s => ({
                        title: s.title,
                        topics: s.topics,
                        roles: s.roles
                      }))
                    }, null, 2),
                  },
                ],
              };
            }
            
            case 'roles_sample': {
              const allSessions = await dbQueries.getAllSessions();
              const sessionsWithRoles = allSessions.filter(s => s.roles && s.roles.trim());
              return {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify({
                      total_sessions: allSessions.length,
                      sessions_with_roles: sessionsWithRoles.length,
                      role_samples: sessionsWithRoles.slice(0, limit).map(s => ({
                        title: s.title,
                        roles: s.roles,
                        topics: s.topics
                      }))
                    }, null, 2),
                  },
                ],
              };
            }
          }
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ debug_error: error.message }, null, 2),
              },
            ],
          };
        }
      }

      case 'create_personalized_schedule': {
        const { role, learning_topics, experience_level, max_sessions_per_day = 4, avoid_conflicts = true } = args;
        
        // Get all sessions
        let allSessions = await dbQueries.getAllSessions();
        
        // Always ensure we have sessions to work with
        if (allSessions.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  error: 'No sessions found in database',
                  message: 'Database appears to be empty. Please check data loading.'
                }, null, 2),
              },
            ],
          };
        }
        
        // Enhanced scoring algorithm for role-based recommendations
        const scoredSessions = allSessions.map(session => {
          let score = 0;
          
          // Role matching (highest priority) - using tags field
          if (role) {
            const userRole = role.toLowerCase();
            
            // Check tags field for role-related content
            if (session.tags) {
              const sessionTags = session.tags.toLowerCase();
              if (sessionTags.includes(userRole)) {
                score += 10;
              }
            }
            
            // Check title and description for role mentions
            if (session.title.toLowerCase().includes(userRole)) {
              score += 6;
            }
            if (session.description && session.description.toLowerCase().includes(userRole)) {
              score += 4;
            }
            
            // Role synonym matching
            const roleSynonyms = {
              'product manager': ['product', 'pm', 'product management', 'business executive', 'business', 'strategy'],
              'developer': ['dev', 'engineer', 'software engineer', 'developer / engineer', 'programmer', 'coder', 'development'],
              'architect': ['solution architect', 'technical architect', 'solution / systems architect', 'architecture'],
              'data scientist': ['data', 'analytics', 'ml engineer', 'ai engineer', 'data science'],
              'devops': ['sre', 'platform engineer', 'devops engineer', 'infrastructure', 'operations'],
              'security': ['cybersecurity', 'infosec', 'security engineer', 'compliance'],
              'executive': ['cto', 'ceo', 'vp', 'director', 'leadership', 'manager', 'management'],
              'it manager': ['it professional / technical manager', 'technical manager']
            };
            
            const synonyms = roleSynonyms[userRole] || [];
            synonyms.forEach(synonym => {
              if ((session.tags && session.tags.toLowerCase().includes(synonym)) ||
                  session.title.toLowerCase().includes(synonym) ||
                  (session.description && session.description.toLowerCase().includes(synonym))) {
                score += 5;
              }
            });
          }
          
          // Learning topic matching
          if (learning_topics && learning_topics.length > 0) {
            learning_topics.forEach(topic => {
              const topicLower = topic.toLowerCase();
              
              // Title match (highest weight for topics)
              if (session.title.toLowerCase().includes(topicLower)) {
                score += 8;
              }
              
              // Tags field match
              if (session.tags && session.tags.toLowerCase().includes(topicLower)) {
                score += 6;
              }
              
              // Services match
              if (session.services && session.services.toLowerCase().includes(topicLower)) {
                score += 4;
              }
              
              // Description match
              if (session.description && session.description.toLowerCase().includes(topicLower)) {
                score += 3;
              }
              
              // Session type match
              if (session.type && session.type.toLowerCase().includes(topicLower)) {
                score += 2;
              }
              
              // Topic synonyms for better matching
              const topicSynonyms = {
                'agents': ['agent', 'ai agent', 'intelligent agent', 'autonomous', 'bedrock agents', 'chatbot', 'bot', 'assistant', 'conversational', 'lex', 'alexa', 'bedrock', 'anthropic', 'claude'],
                'ai': ['artificial intelligence', 'machine learning', 'ml', 'generative ai', 'genai', 'neural', 'deep learning', 'llm', 'foundation model', 'sagemaker', 'comprehend', 'textract'],
                'leadership': ['management', 'strategy', 'executive', 'team lead', 'business', 'transformation', 'innovation', 'culture'],
                'security': ['cybersecurity', 'infosec', 'compliance', 'governance', 'identity', 'access', 'iam', 'cognito'],
                'data': ['analytics', 'database', 'data science', 'big data', 'warehouse', 'lake', 'redshift', 'athena', 'glue'],
                'cloud': ['aws', 'infrastructure', 'migration', 'serverless', 'compute', 'storage', 'ec2', 's3', 'lambda']
              };
              
              const synonyms = topicSynonyms[topicLower] || [];
              synonyms.forEach(synonym => {
                if (session.title.toLowerCase().includes(synonym) ||
                    (session.tags && session.tags.toLowerCase().includes(synonym)) ||
                    (session.description && session.description.toLowerCase().includes(synonym)) ||
                    (session.services && session.services.toLowerCase().includes(synonym))) {
                  score += 3;
                }
              });
            });
          }
          
          // Experience level matching
          if (experience_level && session.level === experience_level) {
            score += 5;
          }
          
          // Bonus for certain session types that are generally valuable
          if (session.type) {
            const sessionType = session.type.toLowerCase();
            if (sessionType.includes('workshop') || sessionType.includes('hands-on')) {
              score += 2; // Workshops are valuable for learning
            }
            if (sessionType.includes('keynote')) {
              score += 3; // Keynotes are high-value
            }
            if (sessionType.includes('breakout')) {
              score += 1; // Standard sessions
            }
          }
          
          return { ...session, relevanceScore: score };
        });
        
        // Always ensure we have sessions to recommend
        let relevantSessions = scoredSessions.filter(session => session.relevanceScore > 0);
        
        // If we don't have enough relevant sessions, add high-value general sessions
        if (relevantSessions.length < max_sessions_per_day * 3) {
          const fallbackSessions = scoredSessions
            .filter(session => session.relevanceScore === 0)
            .map(session => {
              // Give fallback sessions scores based on general value
              let fallbackScore = 0.1;
              if (session.type) {
                const sessionType = session.type.toLowerCase();
                if (sessionType.includes('keynote')) fallbackScore = 0.8;
                else if (sessionType.includes('workshop')) fallbackScore = 0.6;
                else if (session.level === '200') fallbackScore = 0.4;
              }
              return { ...session, relevanceScore: fallbackScore };
            })
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, max_sessions_per_day * 3 - relevantSessions.length);
          
          relevantSessions = [...relevantSessions, ...fallbackSessions];
        }
        
        // Sort by relevance score
        relevantSessions.sort((a, b) => b.relevanceScore - a.relevanceScore);
        
        // Group sessions by day
        const sessionsByDay = {};
        relevantSessions.forEach(session => {
          const day = session.day || 'TBD';
          if (!sessionsByDay[day]) {
            sessionsByDay[day] = [];
          }
          sessionsByDay[day].push(session);
        });
        
        // Create schedule avoiding conflicts if requested
        const schedule = {};
        const usedTimeSlots = {};
        
        Object.keys(sessionsByDay).forEach(day => {
          schedule[day] = [];
          usedTimeSlots[day] = new Set();
          
          const daySessions = sessionsByDay[day];
          let addedCount = 0;
          
          for (const session of daySessions) {
            if (addedCount >= max_sessions_per_day) break;
            
            if (avoid_conflicts && session.time && session.time !== 'Time TBD' && usedTimeSlots[day].has(session.time)) {
              continue; // Skip if time conflict
            }
            
            schedule[day].push({
              id: session.id,
              title: session.title,
              description: session.description || 'Session description available',
              speakers: session.speakers || 'Speakers TBD',
              time: session.time || 'Time TBD',
              venue: session.venue || 'Venue TBD',
              level: session.level || 'All levels',
              type: session.type || 'Session',
              relevanceScore: Math.round(session.relevanceScore * 100) / 100,
              matchedTopics: learning_topics?.filter(topic =>
                session.title.toLowerCase().includes(topic.toLowerCase()) ||
                (session.tags && session.tags.toLowerCase().includes(topic.toLowerCase())) ||
                (session.services && session.services.toLowerCase().includes(topic.toLowerCase()))
              ) || [],
              roleMatch: session.tags && role && session.tags.toLowerCase().includes(role.toLowerCase()),
              tags: session.tags || '',
              services: session.services || '',
              venue: session.venue || 'Venue TBD',
              dayTime: session.dayTime || 'Schedule TBD',
              url: session.url || ''
            });
            
            if (session.time && session.time !== 'Time TBD') {
              usedTimeSlots[day].add(session.time);
            }
            addedCount++;
          }
        });
        
        // Calculate schedule statistics
        const totalSessions = Object.values(schedule).reduce((sum, daySessions) => sum + daySessions.length, 0);
        const averageRelevanceScore = totalSessions > 0 
          ? Object.values(schedule).flat().reduce((sum, session) => sum + session.relevanceScore, 0) / totalSessions 
          : 0;
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                personalized_schedule: {
                  role,
                  learning_topics,
                  experience_level: experience_level || 'All levels',
                  total_sessions: totalSessions,
                  average_relevance_score: Math.round(averageRelevanceScore * 100) / 100,
                  schedule,
                  summary: {
                    message: `Personalized re:Invent schedule created for ${role} focusing on ${learning_topics.join(', ')}`,
                    sessions_per_day: Object.keys(schedule).map(day => ({
                      day,
                      count: schedule[day].length,
                      top_session: schedule[day][0]?.title || 'No sessions'
                    })),
                    recommendations: [
                      "Sessions ranked by relevance to your role and interests",
                      "Higher relevance scores indicate better topic/role matches",
                      "Workshops provide hands-on learning opportunities",
                      "Keynotes offer strategic insights and industry direction"
                    ]
                  }
                }
              }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2),
        },
      ],
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('AWS re:Invent Schedule MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});