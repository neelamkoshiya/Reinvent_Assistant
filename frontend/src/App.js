import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
  PaperAirplaneIcon, 
  SparklesIcon,
  CloudIcon,
  ArrowUpIcon,
  ChartBarIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  CubeTransparentIcon,
  ServerIcon,
  CircleStackIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: `Welcome to the AWS re:Invent Demo! 🎉

I'm your AI assistant that can help you with:

🎯 **AWS re:Invent 2025 Conference Planning (Las Vegas)**
- Find sessions by topic
- Get personalized recommendations
- View daily schedules

🌤️ **Weather Information**
- Check weather for Las Vegas conference location

✈️ **Travel Planning**
- Find flights to Las Vegas (LAS)

📈 **Market Data**
- Get real-time stock prices

Try asking me something like:
• "Show me AI sessions at re:Invent"
• "What's the weather in Las Vegas?"
• "Find flights from NYC to Las Vegas"
• "Recommend sessions for leadership development"`
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickActions = [
    { 
      icon: SparklesIcon, 
      text: 'AI Sessions', 
      query: 'Show me AI and machine learning sessions',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    { 
      icon: CloudIcon, 
      text: 'Weather', 
      query: 'What\'s the weather in Las Vegas?',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    { 
      icon: ArrowUpIcon, 
      text: 'Flights', 
      query: 'Show me flights from NYC to Las Vegas',
      color: 'bg-green-500 hover:bg-green-600'
    },
    { 
      icon: ChartBarIcon, 
      text: 'Stocks', 
      query: 'What are the current stock prices?',
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    { 
      icon: CalendarIcon, 
      text: 'Schedule', 
      query: 'What re:Invent sessions are happening on Monday?',
      color: 'bg-pink-500 hover:bg-pink-600'
    }
  ];

  const handleSendMessage = async (messageText = inputValue) => {
    if (!messageText.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: messageText
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/chat', {
        message: messageText
      });

      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response.data.content
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };



  const formatMessage = (content) => {
    // Simple formatting for better readability
    return content
      .split('\n')
      .map((line, index) => (
        <div key={index} className={line.trim() === '' ? 'h-2' : ''}>
          {line.startsWith('•') || line.startsWith('-') ? (
            <div className="flex items-start space-x-2 my-1">
              <span className="text-blue-400 mt-1">•</span>
              <span>{line.substring(1).trim()}</span>
            </div>
          ) : line.startsWith('**') && line.endsWith('**') ? (
            <div className="font-bold text-blue-300 my-2">
              {line.replace(/\*\*/g, '')}
            </div>
          ) : line.includes(':') && line.length < 50 ? (
            <div className="font-semibold text-gray-300 my-1">{line}</div>
          ) : (
            <div className="my-1">{line}</div>
          )}
        </div>
      ));
  };

  const ArchitectureDiagram = () => (
    <div className="p-6 space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">Agent + MCP Architecture</h2>
        <p className="text-gray-300">Intelligent agent orchestrates MCP servers as tools using LLM reasoning</p>
      </div>

      {/* Agent Layer */}
      <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl p-6 border border-purple-400/30">
        <div className="flex items-center space-x-3 mb-4">
          <ChatBubbleLeftRightIcon className="w-8 h-8 text-purple-400" />
          <h3 className="text-xl font-semibold text-white">Intelligent Agent</h3>
          <span className="bg-purple-500/30 text-purple-200 text-xs px-2 py-1 rounded-full">Agent</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-purple-500/30 rounded-lg p-4">
            <div className="text-white font-medium">Agent Components</div>
            <div className="text-purple-200 text-sm mt-1">Tool selection • Query analysis • Response synthesis</div>
          </div>
          <div className="bg-blue-500/30 rounded-lg p-4">
            <div className="text-white font-medium">LLM Engine</div>
            <div className="text-blue-200 text-sm mt-1">Claude 3 Haiku • Natural language processing</div>
          </div>
          <div className="bg-indigo-500/30 rounded-lg p-4">
            <div className="text-white font-medium">React Frontend</div>
            <div className="text-indigo-200 text-sm mt-1">Chat interface • Architecture view • Real-time responses</div>
          </div>
        </div>
      </div>

      {/* MCP Protocol Layer */}
      <div className="flex justify-center">
        <div className="bg-gradient-to-r from-green-500/20 to-teal-500/20 rounded-xl p-6 border border-green-400/30">
          <div className="flex items-center space-x-3 mb-3">
            <CubeTransparentIcon className="w-8 h-8 text-green-400" />
            <span className="text-white font-semibold text-lg">Model Context Protocol (MCP)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="bg-green-500/30 rounded p-2 text-center">
              <div className="text-green-200 font-medium">Tool Calls</div>
              <div className="text-green-100 text-xs">LLM → MCP Server</div>
            </div>
            <div className="bg-teal-500/30 rounded p-2 text-center">
              <div className="text-teal-200 font-medium">JSON-RPC</div>
              <div className="text-teal-100 text-xs">Standardized Protocol</div>
            </div>
            <div className="bg-cyan-500/30 rounded p-2 text-center">
              <div className="text-cyan-200 font-medium">Resource Access</div>
              <div className="text-cyan-100 text-xs">Data & APIs</div>
            </div>
          </div>
        </div>
      </div>



      {/* MCP Servers Grid */}
      <div className="space-y-6">
        <h3 className="text-2xl font-semibold text-white text-center">MCP Servers (LLM Tools)</h3>
        <p className="text-gray-300 text-center">Each server exposes tools that the LLM can call dynamically</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* re:Invent Schedule Server */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center space-x-3 mb-4">
              <ServerIcon className="w-8 h-8 text-orange-400" />
              <h4 className="text-xl font-semibold text-white">re:Invent Schedule MCP Server</h4>
            </div>
            
            <div className="space-y-4">
              <div className="bg-orange-500/20 rounded-lg p-4">
                <div className="text-orange-200 font-medium mb-2">Tools Provided:</div>
                <div className="space-y-1 text-sm">
                  <div className="text-orange-100">• search_sessions - Find sessions by keywords</div>
                  <div className="text-orange-100">• get_session_details - Get full session info</div>
                  <div className="text-orange-100">• recommend_sessions - AI-powered recommendations</div>
                </div>
              </div>
              
              <div className="bg-orange-500/20 rounded-lg p-4">
                <div className="text-orange-200 font-medium mb-2">Resources:</div>
                <div className="space-y-1 text-sm">
                  <div className="text-orange-100">• SQLite database with 290 sessions</div>
                  <div className="text-orange-100">• Full-text search capabilities</div>
                  <div className="text-orange-100">• Company name mapping</div>
                </div>
              </div>
            </div>
          </div>

          {/* Weather Server */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center space-x-3 mb-4">
              <CloudIcon className="w-8 h-8 text-blue-400" />
              <h4 className="text-xl font-semibold text-white">Weather MCP Server</h4>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-500/20 rounded-lg p-4">
                <div className="text-blue-200 font-medium mb-2">Tools Provided:</div>
                <div className="space-y-1 text-sm">
                  <div className="text-blue-100">• get_weather - Current conditions</div>
                  <div className="text-blue-100">• get_forecast - 3-day forecast</div>
                  <div className="text-blue-100">• search_cities - Location lookup</div>
                </div>
              </div>
              
              <div className="bg-blue-500/20 rounded-lg p-4">
                <div className="text-blue-200 font-medium mb-2">Resources:</div>
                <div className="space-y-1 text-sm">
                  <div className="text-blue-100">• wttr.in API integration</div>
                  <div className="text-blue-100">• OpenWeatherMap fallback</div>
                  <div className="text-blue-100">• Real-time data updates</div>
                </div>
              </div>
            </div>
          </div>

          {/* Stock Server */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center space-x-3 mb-4">
              <ChartBarIcon className="w-8 h-8 text-green-400" />
              <h4 className="text-xl font-semibold text-white">Stock Data MCP Server</h4>
            </div>
            
            <div className="space-y-4">
              <div className="bg-green-500/20 rounded-lg p-4">
                <div className="text-green-200 font-medium mb-2">Tools Provided:</div>
                <div className="space-y-1 text-sm">
                  <div className="text-green-100">• get_stock_price - Real-time quotes</div>
                  <div className="text-green-100">• get_market_status - Trading hours</div>
                  <div className="text-green-100">• search_companies - Symbol lookup</div>
                </div>
              </div>
              
              <div className="bg-green-500/20 rounded-lg p-4">
                <div className="text-green-200 font-medium mb-2">Resources:</div>
                <div className="space-y-1 text-sm">
                  <div className="text-green-100">• Yahoo Finance API</div>
                  <div className="text-green-100">• Live market data</div>
                  <div className="text-green-100">• Company symbol mapping</div>
                </div>
              </div>
            </div>
          </div>

          {/* Travel Server */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center space-x-3 mb-4">
              <ArrowUpIcon className="w-8 h-8 text-purple-400" />
              <h4 className="text-xl font-semibold text-white">Travel MCP Server</h4>
            </div>
            
            <div className="space-y-4">
              <div className="bg-purple-500/20 rounded-lg p-4">
                <div className="text-purple-200 font-medium mb-2">Tools Provided:</div>
                <div className="space-y-1 text-sm">
                  <div className="text-purple-100">• search_flights - Find flight options</div>
                  <div className="text-purple-100">• get_flight_details - Route information</div>
                  <div className="text-purple-100">• get_airports - Airport codes</div>
                </div>
              </div>
              
              <div className="bg-purple-500/20 rounded-lg p-4">
                <div className="text-purple-200 font-medium mb-2">Resources:</div>
                <div className="space-y-1 text-sm">
                  <div className="text-purple-100">• Mock flight database</div>
                  <div className="text-purple-100">• Las Vegas-focused routes</div>
                  <div className="text-purple-100">• Dynamic pricing simulation</div>
                </div>
              </div>
            </div>
          </div>

          {/* AWS Documentation Server - Remote */}
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-6 border border-yellow-400/30">
            <div className="flex items-center space-x-3 mb-4">
              <GlobeAltIcon className="w-8 h-8 text-yellow-400" />
              <h4 className="text-xl font-semibold text-white">AWS Docs MCP Server</h4>
              <span className="bg-yellow-500/30 text-yellow-200 text-xs px-2 py-1 rounded-full">Remote</span>
            </div>
            
            <div className="space-y-4">
              <div className="bg-yellow-500/30 rounded-lg p-4">
                <div className="text-yellow-200 font-medium mb-2">Remote MCP Server:</div>
                <div className="space-y-1 text-sm">
                  <div className="text-yellow-100">• uvx awslabs.aws-documentation-mcp-server@latest</div>
                  <div className="text-yellow-100">• Official AWS Labs MCP server</div>
                  <div className="text-yellow-100">• Real-time AWS documentation access</div>
                </div>
              </div>
              
              <div className="bg-orange-500/30 rounded-lg p-4">
                <div className="text-orange-200 font-medium mb-2">Resources:</div>
                <div className="space-y-1 text-sm">
                  <div className="text-orange-100">• Complete AWS service docs</div>
                  <div className="text-orange-100">• API references and guides</div>
                  <div className="text-orange-100">• Best practices and examples</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Agent + MCP Integration */}
      <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl p-6 border border-indigo-400/30">
        <div className="flex items-center space-x-3 mb-6">
          <GlobeAltIcon className="w-8 h-8 text-indigo-400" />
          <h3 className="text-2xl font-semibold text-white">Agent + MCP Integration</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-indigo-500/30 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-3">🤖 Intelligent Agent</h4>
            <div className="space-y-2 text-sm">
              <div className="text-indigo-100">• Query understanding and planning</div>
              <div className="text-indigo-100">• Multi-tool orchestration</div>
              <div className="text-indigo-100">• Context-aware responses</div>
              <div className="text-indigo-100">• Parallel tool execution</div>
            </div>
          </div>
          
          <div className="bg-purple-500/30 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-3">🔧 MCP Tools</h4>
            <div className="space-y-2 text-sm">
              <div className="text-purple-100">• Standardized tool interface</div>
              <div className="text-purple-100">• JSON-RPC protocol</div>
              <div className="text-purple-100">• Dynamic tool discovery</div>
              <div className="text-purple-100">• Parameter validation</div>
            </div>
          </div>
          
          <div className="bg-pink-500/30 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-3">📊 Data Sources</h4>
            <div className="space-y-2 text-sm">
              <div className="text-pink-100">• SQLite database (290 sessions)</div>
              <div className="text-pink-100">• Remote MCP servers (AWS docs)</div>
              <div className="text-pink-100">• Live APIs (weather, stocks)</div>
              <div className="text-pink-100">• Real-time data integration</div>
            </div>
          </div>
        </div>
      </div>

      {/* Agent-Powered Data Flow */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <h3 className="text-xl font-semibold text-white mb-4 text-center">Agent-Powered MCP Flow</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-blue-500/20 rounded-lg p-3 text-center">
            <div className="text-white font-medium mb-1">1. User Query</div>
            <div className="text-blue-200 text-xs">"Find AI sessions and AWS docs"</div>
          </div>
          <div className="bg-purple-500/20 rounded-lg p-3 text-center">
            <div className="text-white font-medium mb-1">2. Agent Analysis</div>
            <div className="text-purple-200 text-xs">LLM-powered query understanding</div>
          </div>
          <div className="bg-green-500/20 rounded-lg p-3 text-center">
            <div className="text-white font-medium mb-1">3. Tool Selection</div>
            <div className="text-green-200 text-xs">re:Invent tools + AWS docs tools</div>
          </div>
          <div className="bg-orange-500/20 rounded-lg p-3 text-center">
            <div className="text-white font-medium mb-1">4. MCP Execution</div>
            <div className="text-orange-200 text-xs">Local SQLite + Remote AWS</div>
          </div>
          <div className="bg-pink-500/20 rounded-lg p-3 text-center">
            <div className="text-white font-medium mb-1">5. Agent Response</div>
            <div className="text-pink-200 text-xs">Intelligent synthesis & formatting</div>
          </div>
        </div>
        <div className="mt-4 text-center">
          <div className="text-gray-300 text-sm">The agent provides intelligent tool orchestration with natural language understanding</div>
        </div>
      </div>

      {/* SQLite Database - Bottom Section */}
      <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl p-6 border border-orange-400/30">
        <div className="flex items-center space-x-3 mb-4">
          <CircleStackIcon className="w-8 h-8 text-orange-400" />
          <h3 className="text-xl font-semibold text-white">SQLite Database</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-orange-500/30 rounded-lg p-4 text-center">
            <div className="text-white font-bold text-2xl">2254</div>
            <div className="text-orange-200 text-sm">re:Invent Sessions</div>
          </div>
          <div className="bg-orange-500/30 rounded-lg p-4 text-center">
            <div className="text-white font-bold text-2xl">3</div>
            <div className="text-orange-200 text-sm">Conference Days</div>
          </div>
          <div className="bg-orange-500/30 rounded-lg p-4 text-center">
            <div className="text-white font-bold text-2xl">15+</div>
            <div className="text-orange-200 text-sm">Session Types</div>
          </div>
        </div>
        <div className="mt-4 text-center">
          <div className="text-orange-200 text-sm">Real conference data parsed from re:Invent catalog • Full-text search • Smart recommendations</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            AWS re:Invent Agent Demo
          </h1>
          <p className="text-gray-300">
            AI Agent for Conference Planning
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="flex space-x-1 bg-white/10 backdrop-blur-sm rounded-xl p-1">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'chat'
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <ChatBubbleLeftRightIcon className="w-5 h-5" />
              <span>Chat Demo</span>
            </button>
            <button
              onClick={() => setActiveTab('architecture')}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'architecture'
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <CubeTransparentIcon className="w-5 h-5" />
              <span>Architecture</span>
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl">
          {activeTab === 'chat' ? (
            <>
              {/* Messages */}
              <div className="chat-container p-6 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`message-bubble flex ${
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-3xl px-4 py-3 rounded-2xl ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/20 text-white backdrop-blur-sm'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">
                        {formatMessage(message.content)}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/20 backdrop-blur-sm px-4 py-3 rounded-2xl">
                      <div className="typing-indicator text-white">
                        Thinking...
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Actions */}
              <div className="px-6 pb-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(action.query)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-full text-white text-sm transition-colors ${action.color}`}
                      disabled={isLoading}
                    >
                      <action.icon className="w-4 h-4" />
                      <span>{action.text}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div className="p-6 border-t border-white/20">
                <div className="flex space-x-4">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Ask me about re:Invent sessions, weather, flights, or anything else..."
                    className="flex-1 bg-white/10 backdrop-blur-sm text-white placeholder-gray-300 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="2"
                    disabled={isLoading}
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={isLoading || !inputValue.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white p-3 rounded-xl transition-colors"
                  >
                    <PaperAirplaneIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <ArchitectureDiagram />
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-300 text-sm">
          <p>
            Powered by AI Agent + LLM • 
            Demonstrating seamless integration of multiple data sources
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;