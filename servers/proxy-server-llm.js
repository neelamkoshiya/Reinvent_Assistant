import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import axios from 'axios';
import { dbQueries } from './database.js';
import { StrandsAgent } from './strands-agent-simple.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Store active MCP server processes
const mcpServers = new Map();

// Initialize Strands Agent
const strandsAgent = new StrandsAgent();

// Live API keys - set these as environment variables or use free tiers
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || 'demo_key';
const STOCK_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'demo_key';

// Live weather data from multiple free sources
async function getLiveWeatherData(location) {
  // Try WeatherAPI.com first (no API key needed for basic data via web scraping approach)
  try {
    // Use wttr.in - a free weather service that doesn't require API keys
    const response = await axios.get(`https://wttr.in/${encodeURIComponent(location)}?format=j1`, {
      timeout: 5000,
      headers: {
        'User-Agent': 'curl/7.68.0' // wttr.in expects curl-like user agent
      }
    });

    const data = response.data;
    const current = data.current_condition[0];
    const weather = data.weather;

    // Process forecast data
    const forecast = [];
    const days = ['Today', 'Tomorrow', 'Day 3'];

    for (let i = 0; i < Math.min(3, weather.length); i++) {
      const dayData = weather[i];
      forecast.push({
        day: days[i],
        high: Math.round(dayData.maxtempF),
        low: Math.round(dayData.mintempF),
        condition: dayData.hourly[0].weatherDesc[0].value
      });
    }

    return {
      location: data.nearest_area[0].areaName[0].value + ', ' + data.nearest_area[0].country[0].value,
      temperature: Math.round(current.temp_F),
      condition: current.weatherDesc[0].value,
      humidity: parseInt(current.humidity),
      windSpeed: Math.round(current.windspeedMiles),
      forecast,
      lastUpdated: new Date().toLocaleTimeString(),
      source: 'wttr.in (Live)'
    };
  } catch (error) {
    console.log('wttr.in failed, trying OpenWeatherMap:', error.message);

    // Fallback to OpenWeatherMap if API key is available
    if (WEATHER_API_KEY !== 'demo_key') {
      try {
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
          params: {
            q: location,
            appid: WEATHER_API_KEY,
            units: 'imperial'
          },
          timeout: 5000
        });

        const data = response.data;

        // Get forecast
        const forecastResponse = await axios.get(`https://api.openweathermap.org/data/2.5/forecast`, {
          params: {
            q: location,
            appid: WEATHER_API_KEY,
            units: 'imperial'
          },
          timeout: 5000
        });

        const forecastData = forecastResponse.data;
        const forecast = [];
        const days = ['Today', 'Tomorrow', 'Day 3'];

        for (let i = 0; i < 3; i++) {
          const dayData = forecastData.list[i * 8] || forecastData.list[0];
          forecast.push({
            day: days[i],
            high: Math.round(dayData.main.temp_max),
            low: Math.round(dayData.main.temp_min),
            condition: dayData.weather[0].description
          });
        }

        return {
          location: data.name + ', ' + data.sys.country,
          temperature: Math.round(data.main.temp),
          condition: data.weather[0].description,
          humidity: data.main.humidity,
          windSpeed: Math.round(data.wind.speed),
          forecast,
          lastUpdated: new Date().toLocaleTimeString(),
          source: 'OpenWeatherMap (Live)'
        };
      } catch (owmError) {
        console.log('OpenWeatherMap also failed:', owmError.message);
      }
    }

    // Final fallback to simulated data
    console.log('All weather APIs failed, using simulated data');
    return generateWeatherData(location);
  }
}

// Dynamic weather data generator - simulates real-time weather (fallback)
function generateWeatherData(location) {
  const baseWeather = {
    'Las Vegas, NV': {
      baseTemp: 45, tempRange: 10,
      conditions: ['Partly Cloudy', 'Cloudy', 'Sunny', 'Light Snow', 'Overcast'],
      baseHumidity: 72, baseWind: 15
    },
    'Orlando, FL': {
      baseTemp: 78, tempRange: 8,
      conditions: ['Sunny', 'Partly Cloudy', 'Light Rain', 'Thunderstorms', 'Clear'],
      baseHumidity: 65, baseWind: 8
    },
    'San Francisco, CA': {
      baseTemp: 65, tempRange: 6,
      conditions: ['Foggy', 'Partly Cloudy', 'Sunny', 'Overcast', 'Drizzle'],
      baseHumidity: 80, baseWind: 12
    }
  };

  const config = baseWeather[location] || baseWeather['Las Vegas, NV'];
  const now = new Date();
  const hour = now.getHours();

  // Add some time-based and random variation
  const tempVariation = Math.sin(hour / 24 * Math.PI * 2) * 5 + (Math.random() - 0.5) * config.tempRange;
  const currentTemp = Math.round(config.baseTemp + tempVariation);

  const condition = config.conditions[Math.floor(Math.random() * config.conditions.length)];
  const humidity = Math.round(config.baseHumidity + (Math.random() - 0.5) * 20);
  const windSpeed = Math.round(config.baseWind + (Math.random() - 0.5) * 10);

  // Generate forecast with some variation
  const forecast = [];
  for (let i = 0; i < 3; i++) {
    const dayNames = ['Today', 'Tomorrow', 'Day 3'];
    const dayTemp = currentTemp + (Math.random() - 0.5) * 8;
    const high = Math.round(dayTemp + 3 + Math.random() * 5);
    const low = Math.round(dayTemp - 3 - Math.random() * 5);
    const dayCondition = config.conditions[Math.floor(Math.random() * config.conditions.length)];

    forecast.push({
      day: dayNames[i],
      high,
      low,
      condition: dayCondition
    });
  }

  return {
    location,
    temperature: currentTemp,
    condition,
    humidity,
    windSpeed,
    forecast,
    lastUpdated: now.toLocaleTimeString(),
    source: 'Simulated Data'
  };
}

// Mock flight data - AWS re:Invent 2025 in Las Vegas
const mockFlightData = {
  'NYC-ORD': [
    {
      airline: 'United',
      flight: 'UA 1234',
      departure: '7:30 AM',
      arrival: '9:15 AM',
      duration: '2h 45m',
      price: '$285',
      stops: 'Nonstop'
    },
    {
      airline: 'American',
      flight: 'AA 5678',
      departure: '1:45 PM',
      arrival: '3:30 PM',
      duration: '2h 45m',
      price: '$312',
      stops: 'Nonstop'
    }
  ],
  'LAX-ORD': [
    {
      airline: 'United',
      flight: 'UA 9876',
      departure: '6:00 AM',
      arrival: '12:15 PM',
      duration: '4h 15m',
      price: '$395',
      stops: 'Nonstop'
    },
    {
      airline: 'Southwest',
      flight: 'WN 5432',
      departure: '10:30 AM',
      arrival: '4:45 PM',
      duration: '4h 15m',
      price: '$358',
      stops: 'Nonstop'
    }
  ],
  'SFO-ORD': [
    {
      airline: 'United',
      flight: 'UA 2468',
      departure: '8:15 AM',
      arrival: '2:30 PM',
      duration: '4h 15m',
      price: '$425',
      stops: 'Nonstop'
    },
    {
      airline: 'American',
      flight: 'AA 1357',
      departure: '3:20 PM',
      arrival: '9:35 PM',
      duration: '4h 15m',
      price: '$389',
      stops: 'Nonstop'
    }
  ],
  'ATL-ORD': [
    {
      airline: 'Delta',
      flight: 'DL 3691',
      departure: '9:45 AM',
      arrival: '11:20 AM',
      duration: '2h 35m',
      price: '$275',
      stops: 'Nonstop'
    },
    {
      airline: 'United',
      flight: 'UA 7410',
      departure: '4:10 PM',
      arrival: '5:45 PM',
      duration: '2h 35m',
      price: '$298',
      stops: 'Nonstop'
    }
  ]
};

// Live stock data from Alpha Vantage (free tier) or Yahoo Finance
async function getLiveStockData(symbol) {
  // Try Yahoo Finance first (no API key needed)
  try {
    const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, {
      timeout: 5000
    });

    const data = response.data.chart.result[0];
    const meta = data.meta;
    const quote = data.indicators.quote[0];

    const currentPrice = meta.regularMarketPrice;
    const previousClose = meta.previousClose;
    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;

    return {
      symbol: symbol,
      price: currentPrice.toFixed(2),
      change: change.toFixed(2),
      changePercent: changePercent.toFixed(2),
      volume: meta.regularMarketVolume?.toLocaleString() || 'N/A',
      marketCap: formatMarketCap(meta.marketCap),
      sector: 'Technology', // Yahoo doesn't provide this easily
      marketStatus: meta.marketState === 'REGULAR' ? 'Open' : 'Closed',
      lastUpdated: new Date(meta.regularMarketTime * 1000).toLocaleTimeString(),
      dayHigh: meta.regularMarketDayHigh?.toFixed(2) || 'N/A',
      dayLow: meta.regularMarketDayLow?.toFixed(2) || 'N/A',
      source: 'Yahoo Finance (Live)'
    };
  } catch (error) {
    console.log('Yahoo Finance failed, trying Alpha Vantage:', error.message);

    // Fallback to Alpha Vantage if available
    if (STOCK_API_KEY !== 'demo_key') {
      try {
        const response = await axios.get(`https://www.alphavantage.co/query`, {
          params: {
            function: 'GLOBAL_QUOTE',
            symbol: symbol,
            apikey: STOCK_API_KEY
          },
          timeout: 5000
        });

        const quote = response.data['Global Quote'];
        if (quote && quote['05. price']) {
          return {
            symbol: symbol,
            price: parseFloat(quote['05. price']).toFixed(2),
            change: parseFloat(quote['09. change']).toFixed(2),
            changePercent: quote['10. change percent'].replace('%', ''),
            volume: parseInt(quote['06. volume']).toLocaleString(),
            marketCap: 'N/A',
            sector: 'N/A',
            marketStatus: 'N/A',
            lastUpdated: quote['07. latest trading day'],
            dayHigh: parseFloat(quote['03. high']).toFixed(2),
            dayLow: parseFloat(quote['04. low']).toFixed(2),
            source: 'Alpha Vantage (Live)'
          };
        }
      } catch (alphaError) {
        console.log('Alpha Vantage also failed:', alphaError.message);
      }
    }

    // Final fallback to simulated data
    console.log('Using simulated stock data for', symbol);
    return generateStockData(symbol);
  }
}

function formatMarketCap(marketCap) {
  if (!marketCap) return 'N/A';
  if (marketCap >= 1e12) return `${(marketCap / 1e12).toFixed(1)}T`;
  if (marketCap >= 1e9) return `${(marketCap / 1e9).toFixed(1)}B`;
  if (marketCap >= 1e6) return `${(marketCap / 1e6).toFixed(1)}M`;
  return marketCap.toString();
}

// Dynamic stock data generator - simulates real-time market data (fallback)
function generateStockData(symbol) {
  const stockProfiles = {
    'AAPL': { basePrice: 175, volatility: 0.02, sector: 'Technology', marketCap: 2800 },
    'GOOGL': { basePrice: 140, volatility: 0.025, sector: 'Technology', marketCap: 1800 },
    'MSFT': { basePrice: 380, volatility: 0.018, sector: 'Technology', marketCap: 2900 },
    'TSLA': { basePrice: 250, volatility: 0.04, sector: 'Automotive', marketCap: 800 },
    'AMZN': { basePrice: 145, volatility: 0.022, sector: 'E-commerce', marketCap: 1500 },
    'NVDA': { basePrice: 450, volatility: 0.035, sector: 'Semiconductors', marketCap: 1100 },
    'META': { basePrice: 320, volatility: 0.028, sector: 'Social Media', marketCap: 850 }
  };

  const profile = stockProfiles[symbol] || {
    basePrice: 100, volatility: 0.025, sector: 'Technology', marketCap: 500
  };

  const now = new Date();
  const marketHours = now.getHours() >= 9 && now.getHours() < 16; // 9 AM - 4 PM

  // Simulate price movement based on time and volatility
  const timeVariation = Math.sin(now.getTime() / 1000000) * profile.volatility * profile.basePrice;
  const randomVariation = (Math.random() - 0.5) * 2 * profile.volatility * profile.basePrice;
  const marketMultiplier = marketHours ? 1 : 0.3; // Less movement after hours

  const currentPrice = profile.basePrice + (timeVariation + randomVariation) * marketMultiplier;
  const change = currentPrice - profile.basePrice;
  const changePercent = (change / profile.basePrice) * 100;

  // Generate realistic volume
  const baseVolume = profile.marketCap * 1000;
  const volume = Math.floor(baseVolume * (0.5 + Math.random() * 1.5));

  return {
    symbol,
    price: currentPrice.toFixed(2),
    change: change.toFixed(2),
    changePercent: changePercent.toFixed(2),
    volume: volume.toLocaleString(),
    marketCap: `${profile.marketCap}B`,
    sector: profile.sector,
    marketStatus: marketHours ? 'Open' : 'Closed',
    lastUpdated: now.toLocaleTimeString(),
    dayHigh: (currentPrice * (1 + Math.random() * 0.02)).toFixed(2),
    dayLow: (currentPrice * (1 - Math.random() * 0.02)).toFixed(2),
    source: 'Simulated Data'
  };
}

// Start re:Invent Schedule MCP Server
function startReInventServer() {
  const serverProcess = spawn('node', ['servers/reinvent-schedule-server.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  mcpServers.set('reinvent-schedule', serverProcess);

  serverProcess.stderr.on('data', (data) => {
    console.log('re:Invent Server:', data.toString());
  });

  return serverProcess;
}

// AWS Documentation MCP Server is now remote (uvx awslabs.aws-documentation-mcp-server@latest)
// No local server startup needed - called on-demand via uvx

// API Routes

// Weather endpoints (live data with fallback)
app.get('/api/weather/:location', async (req, res) => {
  try {
    const location = req.params.location;
    const weatherData = await getLiveWeatherData(location);

    res.json({
      content: [{
        type: 'text',
        text: JSON.stringify(weatherData, null, 2)
      }]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Flight endpoints (mock public MCP server)
app.get('/api/flights/:route', async (req, res) => {
  try {
    const route = req.params.route;
    const flightData = mockFlightData[route] || [];

    res.json({
      content: [{
        type: 'text',
        text: JSON.stringify({
          route: route,
          flights: flightData
        }, null, 2)
      }]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stock/News endpoints (live data with fallback)
app.get('/api/stocks/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const stockData = await getLiveStockData(symbol);

    res.json({
      content: [{
        type: 'text',
        text: JSON.stringify(stockData, null, 2)
      }]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LLM-powered chat endpoint that uses MCP tools
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    console.log('Processing query with LLM agent:', message);

    // Use Strands agent to process the query with MCP tools
    const result = await strandsAgent.processQuery(message, conversationHistory);

    const response = {
      type: 'text',
      content: result.response,
      metadata: {
        toolsUsed: result.toolsUsed,
        model: result.model,
        timestamp: new Date().toISOString()
      }
    };

    // Log the tools used for debugging
    if (result.toolsUsed && result.toolsUsed.length > 0) {
      console.log('MCP Tools used:', result.toolsUsed.map(t => t.tool).join(', '));
    }

    res.json(response);
  } catch (error) {
    console.error('Chat endpoint error:', error);

    // Fallback response
    const fallbackResponse = {
      type: 'text',
      content: `I apologize, but I'm experiencing technical difficulties with the AI model. However, I can still help you with:

🎯 **AWS re:Invent 2025 Conference Planning**
- Search sessions: "Show me AI sessions"
- Get recommendations: "Recommend leadership sessions"

🌤️ **Weather Information**
- "What's the weather in Las Vegas?"

✈️ **Travel Planning**
- "Show me flights from NYC to Las Vegas"

📈 **Market Data**
- "What's the stock price for AAPL?"

Please try rephrasing your question or ask about specific topics. The system will fall back to rule-based processing.`,
      metadata: {
        error: error.message,
        fallback: true,
        timestamp: new Date().toISOString()
      }
    };

    res.json(fallbackResponse);
  }
});

// Database info endpoint
app.get('/api/database/info', async (req, res) => {
  try {
    const [tracks, levels, days, sessions] = await Promise.all([
      dbQueries.getTracks(),
      dbQueries.getLevels(),
      dbQueries.getDays(),
      dbQueries.getAllSessions()
    ]);

    const info = {
      tracks,
      levels,
      days,
      totalSessions: sessions.length
    };
    res.json(info);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const sessions = await dbQueries.getAllSessions();
    const dbHealth = sessions.length > 0;
    res.json({
      status: 'ok',
      servers: Array.from(mcpServers.keys()),
      database: dbHealth ? 'connected' : 'error',
      sessionsCount: sessions.length,
      llmAgent: 'enabled',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      status: 'error',
      servers: Array.from(mcpServers.keys()),
      database: 'error',
      llmAgent: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`MCP Proxy Server with LLM Agent running on port ${PORT}`);

  // Start MCP servers
  startReInventServer();

  console.log('All MCP servers started');
  console.log('- re:Invent Schedule Server: Conference session data (local)');
  console.log('- AWS Documentation Server: Remote MCP server via uvx');
  console.log('🧵 Strands Agent initialized with Bedrock LLM + MCP tool orchestration');
});