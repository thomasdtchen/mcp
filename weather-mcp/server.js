// server.js - Claude Desktop 兼容版本
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// 创建 MCP 服务器
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

// 定义工具
const tools = [
  {
    name: "get_weather",
    description: "获取指定城市的实时天气信息",
    inputSchema: {
      type: "object",
      properties: {
        city: {
          type: "string",
          description: "城市名称"
        }
      },
      required: ["city"]
    }
  }
];

// 处理工具列表请求
server.setRequestHandler(ListToolsRequestSchema, async (request) => {
  // 日志必须输出到 stderr
  process.stderr.write("收到工具列表请求\n");
  return {
    tools: tools,
  };
});

// 处理工具调用请求
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  // 所有日志都输出到 stderr
  process.stderr.write(`收到工具调用请求: ${name}\n`);
  process.stderr.write(`原始参数: ${JSON.stringify(args)}\n`);

  try {
    if (name === "get_weather") {
      const city = args?.city;
      
      if (!city) {
        throw new Error("必须提供城市名称");
      }

      process.stderr.write(`查询城市: ${city}\n`);

      // 模拟天气数据
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

      process.stderr.write(`返回天气数据: ${city} - ${weather.temperature}\n`);

      const resultText = `${city}实时天气信息：
城市：${city}
温度：${weather.temperature}
天气状况：${weather.condition}
湿度：${weather.humidity}
风速：${weather.wind}
更新时间：${new Date().toLocaleString('zh-CN')}`;

      return {
        content: [
          {
            type: "text",
            text: resultText
          }
        ]
      };
    }

    throw new Error(`未知工具: ${name}`);

  } catch (error) {
    process.stderr.write(`工具执行错误: ${error.message}\n`);
    
    return {
      content: [
        {
          type: "text",
          text: `获取天气信息失败：${error.message}`
        }
      ]
    };
  }
});

// 错误处理
server.onerror = (error) => {
  process.stderr.write(`MCP服务器错误: ${error.message}\n`);
};

// 启动服务器
async function main() {
  try {
    process.stderr.write("正在启动MCP服务器...\n");
    const transport = new StdioServerTransport();
    await server.connect(transport);
    process.stderr.write("天气MCP服务器已启动\n");
    process.stderr.write("支持功能：获取城市天气信息\n");
    
    // 保持进程运行
    process.stderr.write("服务器正在运行，等待请求...\n");
    
  } catch (error) {
    process.stderr.write(`启动服务器失败: ${error.message}\n`);
    process.exit(1);
  }
}

// 处理进程信号，确保优雅退出
process.on('SIGINT', () => {
  process.stderr.write('收到停止信号，关闭服务器...\n');
  process.exit(0);
});

process.on('SIGTERM', () => {
  process.stderr.write('收到终止信号，关闭服务器...\n');
  process.exit(0);
});

// 启动服务器
main().catch((error) => {
  process.stderr.write(`服务器启动异常: ${error.message}\n`);
  process.exit(1);
});