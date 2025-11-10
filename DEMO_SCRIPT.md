# MCP AWS re:Invent Demo Script (5 Minutes)

## Setup (30 seconds)
**Before starting:**
- Set up AWS credentials in `.env` file (copy from `.env.example`)
- Have both servers running: `node servers/proxy-server-llm.js` and frontend at `localhost:3000`
- Open browser to `localhost:3000`
- Have architecture tab ready to switch to

---

## Introduction (30 seconds)
*"Today I'm demonstrating the Model Context Protocol (MCP) with AWS Bedrock LLM integration. This shows how an AI agent can intelligently use MCP servers as tools to access multiple data sources."*

**Show:** Landing page with welcome message
- Point out the natural language interface
- Mention this is powered by AWS Bedrock Claude acting as the "brain"
- MCP servers provide the "tools" and "resources" the AI can use

---

## Demo 1: Real Conference Data (90 seconds)

### Query 1: Basic Search
**Type:** `"Show me AI sessions at re:Invent"`

**Explain while it loads:**
- *"The AWS Bedrock LLM analyzes this query and decides to use the search_sessions MCP tool"*
- *"It calls our custom AWS re:Invent Schedule MCP server with the appropriate parameters"*
- *"The server uses SQLite with 2254 real sessions parsed from the actual AWS re:Invent conference catalog"*

**When results appear:**
- *"Notice we get real session titles, speakers, and times"*
- *"The search uses full-text indexing and smart keyword matching"*

### Query 2: Natural Language Recommendations  
**Type:** `"Recommend sessions for someone interested in leadership development"`

**Explain:**
- *"The LLM understands this complex request and calls the recommend_sessions MCP tool"*
- *"It extracts 'leadership development' as the interest and passes it to the MCP server"*
- *"The server analyzes session descriptions and provides intelligent recommendations"*

---

## Demo 2: Live Data Integration (60 seconds)

### Weather Query
**Type:** `"What's the weather in Seattle?"` or `"Las Vegas weather"`

**Explain:**
- *"The LLM recognizes this as a weather query and calls the get_weather MCP tool"*
- *"It extracts 'Seattle' as the location parameter automatically"*
- *"The MCP server fetches live data from wttr.in with OpenWeatherMap fallback"*
- *"Notice how the LLM seamlessly orchestrates different MCP tools"*

**Expected Response:** Current temperature, conditions, humidity, wind speed, and 3-day forecast for the requested city

### Stock Query
**Type:** `"What are current stock prices for major tech companies?"`

**Explain:**
- *"The LLM calls the get_stock_price MCP tool for multiple companies"*
- *"It intelligently maps company names to ticker symbols"*
- *"MCP server fetches real-time data from Yahoo Finance API"*

---

## Demo 3: Architecture Deep Dive (90 seconds)

**Click:** Architecture tab

### MCP Client Section
*"At the top, we have the MCP Client - our React interface plus proxy server with AWS Bedrock LLM integration that acts as the intelligent agent"*

### MCP Protocol Layer
*"The middle shows the Model Context Protocol itself - using JSON-RPC for communication, tool discovery, and resource management"*

### MCP Servers Breakdown
*"Here are our four MCP servers, each exposing specific tools and resources:"*

**Point to AWS re:Invent Schedule Server:**
- *"Custom server with tools like search_sessions, get_session_details"*
- *"Resources include our SQLite database with real conference data"*

**Point to other servers:**
- *"Weather server with live API integration"*
- *"Stock server with Yahoo Finance"*
- *"Travel server with mock flight data"*

### MCP Core Concepts
*"These are the key MCP concepts:"*
- **Tools:** *"Functions that servers expose - like search_sessions"*
- **Resources:** *"Data sources - databases, APIs, files"*  
- **Prompt Templates:** *"Reusable structures for consistent queries"*

### Data Flow
*"The flow is simple: User query → MCP Client routes → MCP Server executes → Response back"*

### SQLite Database
*"At the bottom, our SQLite database with 2254 real AWS re:Invent sessions across 5 days"*

---

## Demo 4: Advanced Integration (60 seconds)

**Switch back to Chat tab**

### Complex Multi-Server Query
**Type:** `"I'm flying to Las Vegas for re:Invent. What's the weather forecast and can you recommend AI sessions for Monday?"`

**Explain while processing:**
- *"This single query demonstrates the LLM agent's intelligence - it automatically:"*
- *"1. Calls get_weather MCP tool for Las Vegas weather"*
- *"2. Calls search_sessions MCP tool for AI sessions on Day 1"*  
- *"3. Combines results from multiple MCP servers in a natural response"*

**When results appear:**
- *"Notice how we get weather data AND session recommendations in one response"*
- *"This is the magic of MCP - unified access to distributed data sources"*

---

## Conclusion (30 seconds)

*"What you've seen demonstrates MCP with LLM integration:"*
- **Intelligent Agent:** *"AWS Bedrock LLM acts as the brain, deciding which tools to use"*
- **MCP Tools:** *"Servers expose functions the LLM can call dynamically"*
- **Unified Protocol:** *"One interface, multiple data sources, intelligent orchestration"*
- **Natural Language:** *"Complex queries understood and executed automatically"*

*"This shows the future of AI applications - LLMs using MCP as a standard protocol to access any data source or service intelligently."*

---

## Backup Queries (if needed)

**Quick demos if time allows:**
- `"Find networking sessions on Day 2"`
- `"What flights are available from NYC to Las Vegas?"`
- `"Show me sessions by Google speakers"`
- `"What's the weather forecast for the conference dates?"`
- `"How do I use AWS Bedrock with Lambda functions?"`
- `"What are MCP tools and how do they work?"`
- `"Show me AWS documentation for the Model Context Protocol"`

---

## Troubleshooting

**If weather queries don't work in frontend:**
1. Check browser console for CORS or network errors
2. Verify proxy server is running on port 3001
3. Test API directly: `curl -X POST "http://localhost:3001/api/chat" -H "Content-Type: application/json" -d '{"message": "weather in Seattle"}'`
4. The weather API uses wttr.in (free, no API key needed) with OpenWeatherMap fallback
5. City name extraction supports: "weather in [city]", "[city] weather", "weather for [city]"

**If any queries fail:**
- Backend APIs are working (tested via curl)
- Issue likely in frontend-backend communication
- Show architecture diagram to explain the concept
- Emphasize that MCP enables this integration pattern

---

## Technical Notes

**If questions about implementation:**
- AWS Bedrock Claude 3 Haiku as the LLM agent brain
- Real SQLite database with 2254 sessions parsed from AWS re:Invent catalog
- Live weather data from wttr.in API with OpenWeatherMap fallback  
- Real-time stock data from Yahoo Finance
- Custom MCP servers built with Node.js exposing tools and resources
- React frontend with Express.js proxy server as MCP client
- LLM intelligently selects and calls appropriate MCP tools based on user queries

**If demo fails:**
- Emphasize the architecture diagram showing the concept
- Explain that MCP enables this type of integration
- Show the real data in the SQLite database section
- Weather API is confirmed working (test with: `curl -X POST "http://localhost:3001/api/chat" -H "Content-Type: application/json" -d '{"message": "What is the weather in Las Vegas?"}'`)