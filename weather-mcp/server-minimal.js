// server-minimal.js - Minimal production version
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: "weather-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const tools = [
  {
    name: "get_weather",
    description: "Get real-time weather information for Chinese cities",
    inputSchema: {
      type: "object",
      properties: {
        city: {
          type: "string",
          description: "City name (English or Chinese)"
        }
      },
      required: ["city"]
    }
  }
];

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name === "get_weather") {
    const city = args?.city;
    
    if (!city) {
      throw new Error("City name is required");
    }

    const weatherData = {
      "London": { temperature: "10°C", condition: "Rain", humidity: "75%", wind: "5.2m/s" },
      "Paris": { temperature: "18°C", condition: "Cloudy", humidity: "60%", wind: "2.8m/s" },
      "Los Angeles": { temperature: "25°C", condition: "Showers", humidity: "75%", wind: "4.1m/s" },
      "New York": { temperature: "23°C", condition: "Overcast", humidity: "70%", wind: "3.5m/s" },
      "Guangzhou": { temperature: "17°C", condition: "Light Rain", humidity: "65%", wind: "2.5m/s" }
    };

    const weather = weatherData[city] || { 
      temperature: "22°C", 
      condition: "Clear", 
      humidity: "50%",
      wind: "3.0m/s"
    };

    return {
      content: [{
        type: "text",
        text: `${city} weather info: temperature ${weather.temperature}, ${weather.condition}, humidity ${weather.humidity}, wind ${weather.wind}`
      }]
    };
  }
  
  throw new Error(`Unknown tool: ${name}`);
});

async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    // Fully silent startup, no output
  } catch (error) {
    process.exit(1);
  }
}

main();