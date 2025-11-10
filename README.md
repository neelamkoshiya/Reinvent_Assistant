# MCP AWS re:Invent Demo with AWS Bedrock LLM Integration

A comprehensive demonstration of the Model Context Protocol (MCP) featuring AWS Bedrock LLM as an intelligent agent that uses MCP servers as tools. Built for AWS re:Invent 2025 conference planning with real data and live API integrations.

## 🧠 Strands + MCP Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MCP Client                                        │
│  ┌─────────────────┐    ┌─────────────────────────────────────────────────┐ │
│  │  React Frontend │    │        Strands Agent               │ │
│  │  (Chat UI)      │◄──►│  ┌─────────────────┐  ┌─────────────────────┐  │ │
│  └─────────────────┘    │  │ Strands Agent   │  │   Fallback MCP      │  │ │
│                         │  │        │  │   Tool Execution    │  │ │
│                         │  └─────────────────┘  └─────────────────────┘  │ │
│                         └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                            │
                              ┌─────────────┴─────────────┐
                              │     MCP Protocol          │
                              │     (JSON-RPC)            │
                              └─────────────┬─────────────┘
                                            │
        ┌───────────────────────────────────┼───────────────────────────────────┐
        │                                   │                                   │
┌───────▼────────┐   ┌────────▼────────┐   ┌───────▼────────┐   ┌───────▼────────┐
│ re:Invent      │   │ Weather Server  │   │ Stock Server   │   │ AWS Docs       │
│ MCP Server     │   │ (Live APIs)     │   │ (Live APIs)    │   │ MCP Server     │
│ (Local)        │   │ (Local)         │   │ (Local)        │   │ (Remote)       │
│                │   │                 │   │                │   │                │
│ Strands Tools: │   │ Strands Tools:  │   │ Strands Tools: │   │ Strands Tools: │
│ • searchSessions│   │ • getWeather    │   │ • getStock     │   │ • searchAWS    │
│ • recommend    │   │ • getForecast   │   │ • getMarket    │   │ • getGuides    │
│ • getDetails   │   │                 │   │                │   │                │
│                │   │ Resources:      │   │ Resources:     │   │ Resources:     │
│ Resources:     │   │ • wttr.in       │   │ • Yahoo Finance│   │ • Official     │
│ • SQLite DB    │   │ • OpenWeather   │   │ • Alpha Vantage│   │   AWS Docs     │
│ • 290 Sessions │   │                 │   │                │   │ • uvx runtime  │
└────────────────┘   └─────────────────┘   └────────────────┘   └────────────────┘
```

## 🚀 Key Features

### **Strands Agent Architecture**
- **AWS Bedrock Agent with Strands** for intelligent tool orchestration
- **Graceful Fallback** to direct MCP tool execution when agent setup is complex
- **Claude 3 Haiku** as the reasoning engine
- Automatically selects appropriate MCP tools based on user queries
- Natural language understanding and contextual responses
- Multi-tool orchestration for complex requests

### **Real Conference Data**
- **2254 actual AWS re:Invent 2025 sessions** parsed from official conference catalog
- Full-text search across session titles, descriptions, and speakers
- Smart recommendations based on interests and experience level
- Complete session details with times, locations, and tracks

### **Live Data Integration**
- **Weather**: Real-time data from wttr.in API with OpenWeatherMap fallback
- **Stock Market**: Live prices from Yahoo Finance API
- **Travel**: Mock flight data for Las Vegas routes (LAS airport)

### **MCP Architecture**
- **Tools**: Functions that MCP servers expose to the LLM
- **Resources**: Data sources (databases, APIs, files)
- **Prompt Templates**: Structured prompts for consistent interactions

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+ and npm
- AWS Account with Bedrock access
- AWS CLI installed
- Python and uv package manager (for remote MCP servers)

### Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Install uv (Python package manager for remote MCP servers)
# macOS/Linux:
curl -LsSf https://astral.sh/uv/install.sh | sh
# Or via pip: pip install uv

# 3. Configure AWS credentials (recommended)
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and region (us-east-1)

# 4. Optional: Create .env file for custom configuration
cp .env.example .env
# Edit .env with AWS_REGION or API keys if needed

# 5. Start the demo
chmod +x start-llm-demo.sh
./start-llm-demo.sh

# OR start manually:
npm start                    # Backend with strands agent
npm run start:demo          # Both backend and frontend

# Note: The SQLite database with 2254 re:Invent sessions will be automatically 
# created in servers/reinvent_schedule.db on first run
```

### AWS Configuration Options

**Option 1: AWS CLI (Recommended)**
```bash
aws configure
# AWS Access Key ID: your_key_here
# AWS Secret Access Key: your_secret_here  
# Default region: us-east-1
# Default output format: json
```

**Option 2: Environment Variables**
```bash
export AWS_ACCESS_KEY_ID=your_key_here
export AWS_SECRET_ACCESS_KEY=your_secret_here
export AWS_REGION=us-east-1
```

**Option 3: .env File (Optional)**
```bash
cp .env.example .env
# Edit .env with AWS_REGION (credentials optional if using aws configure)
# Optionally add API keys for enhanced live data:
# WEATHER_API_KEY=your_openweathermap_key
# ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
```

## 🔧 MCP Tools & Resources

### AWS re:Invent Schedule MCP Server
**Tools:**
- `search_sessions` - Find sessions by keywords, topics, speakers
- `get_session_details` - Get complete session information
- `recommend_sessions` - AI-powered personalized recommendations

**Resources:**
- SQLite database with 2254 real AWS re:Invent sessions
- Full-text search capabilities
- Session metadata (tracks, levels, days, locations)

### Weather MCP Server
**Tools:**
- `get_weather` - Current weather conditions
- `get_forecast` - 3-day weather forecast

**Resources:**
- wttr.in API (primary, no key required)
- OpenWeatherMap API (fallback)

### Stock MCP Server
**Tools:**
- `get_stock_price` - Real-time stock quotes
- `get_market_status` - Trading hours and market state

**Resources:**
- Yahoo Finance API (primary, no key required)
- Alpha Vantage API (fallback)

### Flight MCP Server
**Tools:**
- `search_flights` - Find flights to Las Vegas for re:Invent

**Resources:**
- Mock flight database with realistic data
- Las Vegas (LAS) focused routes

### AWS Documentation MCP Server (Remote)
**Tools:**
- `search_docs` - Search AWS service documentation using official AWS MCP server
- Powered by `uvx awslabs.aws-documentation-mcp-server@latest`

**Resources:**
- Official AWS service documentation
- Real-time access to AWS docs via remote MCP server
- Comprehensive coverage of all AWS services

## 🎯 Demo Experience

### Natural Language Queries
The LLM agent understands complex, conversational requests:

```
"I'm interested in AI and serverless. What re:Invent sessions would you recommend, 
and what's the weather like in Las Vegas?"
```

The agent automatically:
1. Calls `recommend_sessions` with interests: ["AI", "leadership"]
2. Calls `get_weather` with location: "Las Vegas"
3. Combines results in a natural response

### Sample Interactions
- **Session Search**: "Show me cybersecurity sessions on Day 2"
- **Weather**: "What's the weather forecast for Las Vegas?"
- **Travel**: "Find flights from San Francisco to Las Vegas"
- **Recommendations**: "Suggest sessions for a beginner in data science"
- **AWS Documentation**: "How do I use Bedrock with Lambda functions?"
- **MCP Protocol**: "What are MCP tools and how do they work?"
- **Complex**: "Plan my re:Invent trip: weather, flights from NYC, AI sessions, and AWS Bedrock documentation"

## 🏗️ Technical Architecture

### Database Setup & Schema

**Automatic Initialization:**
The SQLite database (`servers/reinvent_schedule.db`) is automatically created and populated when you first run the server. It contains:
- **2254 real AWS re:Invent 2025 sessions** parsed from the official conference catalog
- **Full session metadata**: titles, speakers, descriptions, times, locations, tracks
- **Searchable fields**: All text fields are indexed for full-text search

**Database Schema:**
- **sessions table**: 2254 real AWS re:Invent sessions with complete metadata
- **Indexed fields**: title, description, speaker, tags, track, level, day
- **Search capabilities**: Full-text search with relevance scoring across all fields

**Verify Database:**
```bash
# Check if database exists and has data
sqlite3 servers/reinvent_schedule.db "SELECT COUNT(*) FROM sessions;"
# Should return: 2254

# View sample sessions
sqlite3 servers/reinvent_schedule.db "SELECT title, type, level FROM sessions LIMIT 3;"
```

**Database Recreation (if needed):**
If the database file is missing or corrupted, it will be automatically recreated with sample data when the server starts. The full 290-session dataset is embedded in the application and loaded automatically.

### Strands Agent Integration
- **Primary**: AWS Bedrock Agent with strands architecture
- **Fallback**: Direct MCP tool execution with Claude 3 Haiku
- **Tool Planning**: Intelligent selection of appropriate MCP tools
- **Parameter Extraction**: Smart parsing of user queries
- **Response Generation**: Natural language formatting of results
- **Graceful Degradation**: Always functional regardless of AWS setup complexity

### Fallback Strategy
- LLM failure → Rule-based query processing
- API failures → Simulated data with clear indicators
- Graceful degradation ensures demo always works

## 📊 Demo Script

See `DEMO_SCRIPT.md` for a complete 5-minute walkthrough including:
- Setup instructions
- Key talking points
- Expected responses
- Troubleshooting tips
- Architecture explanations

This demo showcases the future of AI applications: Strands agents using MCP as a standard protocol to intelligently orchestrate multiple data sources and services.

## 🧪 Testing the Demo

### Test AWS Documentation Integration
```bash
# Test the remote AWS MCP server directly
curl -X POST "http://localhost:3001/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "How do I get started with AWS Bedrock?"}'

# Expected: Real AWS documentation with official links
```

### Test AWS re:Invent Conference Data
```bash
# Test the local SQLite database
curl -X POST "http://localhost:3001/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me AI sessions at re:Invent"}'

# Expected: Real conference sessions from 2254-session database
```

### Test Live Data Integration
```bash
# Test weather API
curl -X POST "http://localhost:3001/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the weather in Seattle?"}'

# Expected: Live weather data from wttr.in
```

### Test Multi-Tool Orchestration
```bash
# Test complex query using multiple MCP servers
curl -X POST "http://localhost:3001/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "Plan my re:Invent trip: weather in Las Vegas, AI sessions, and AWS Bedrock documentation"}'

# Expected: Combined results from weather, sessions, and AWS docs
```

### Verify System Status
```bash
# Check overall system health including database
curl "http://localhost:3001/api/health"

# Look for:
# - "database": "connected"
# - "sessionsCount": 290
# - "llmAgent": "enabled"

# Check database info specifically
curl "http://localhost:3001/api/database/info"

# Should show:
# - totalSessions: 290
# - Available tracks, levels, and days
```

### Frontend Testing
1. Open http://localhost:3000
2. Click "MCP Architecture" tab to see strands architecture
3. Test queries in chat interface:
   - "How do I use Bedrock with Lambda?" (AWS docs)
   - "Show me security sessions" (re:Invent data)
   - "Weather in Las Vegas" (live data)

### Troubleshooting
- **AWS docs not working**: Check uvx installation (`uvx --version`)
- **Agent working normally**: The system uses direct MCP tool orchestration
- **No responses**: Verify AWS credentials (`aws sts get-caller-identity`)