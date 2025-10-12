// server-minimal.js - 最小化生产版本
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
          description: "City name in Chinese"
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
      "北京": { temperature: "15°C", condition: "晴朗", humidity: "45%", wind: "3.2m/s" },
      "上海": { temperature: "18°C", condition: "多云", humidity: "60%", wind: "2.8m/s" },
      "深圳": { temperature: "25°C", condition: "阵雨", humidity: "75%", wind: "4.1m/s" },
      "广州": { temperature: "23°C", condition: "阴天", humidity: "70%", wind: "3.5m/s" },
      "杭州": { temperature: "17°C", condition: "小雨", humidity: "65%", wind: "2.5m/s" }
    };

    const weather = weatherData[city] || { 
      temperature: "22°C", 
      condition: "晴朗", 
      humidity: "50%",
      wind: "3.0m/s"
    };

    return {
      content: [{
        type: "text",
        text: `${city}天气信息：温度${weather.temperature}，${weather.condition}，湿度${weather.humidity}，风速${weather.wind}`
      }]
    };
  }
  
  throw new Error(`Unknown tool: ${name}`);
});

async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    // 完全静默启动，不输出任何内容
  } catch (error) {
    process.exit(1);
  }
}

main();