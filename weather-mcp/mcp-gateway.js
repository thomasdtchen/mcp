// final-gateway-fixed.js
import express from 'express';
import { spawn } from 'child_process';
import cors from 'cors';

console.log('🚀 启动 MCP 网关...');

const app = express();
app.use(cors());
app.use(express.json());

// 存储 MCP 相关的变量
let mcpServer = null;
let messageBuffer = '';

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'MCP Gateway',
    mcpStatus: mcpServer && !mcpServer.killed ? 'running' : 'stopped',
    timestamp: new Date().toISOString()
  });
});

// 获取工具列表
app.get('/api/tools', async (req, res) => {
  if (!mcpServer || mcpServer.killed) {
    return res.status(500).json({ error: 'MCP 服务未运行' });
  }

  try {
    const requestId = Date.now();
    const request = {
      jsonrpc: "2.0",
      id: requestId,
      method: "tools/list",
      params: {}
    };

    console.log(`📋 发送工具列表请求 ID: ${requestId}`);
    
    // 清空缓冲区并发送请求
    const originalLength = messageBuffer.length;
    messageBuffer = messageBuffer.substring(originalLength); // 保留之前的消息，只清空新的
    
    mcpServer.stdin.write(JSON.stringify(request) + '\n');

    const response = await waitForResponse(requestId, 3000);
    console.log('✅ 收到工具列表响应');
    res.json(response.result);
    
  } catch (error) {
    console.error('❌ 获取工具列表失败:', error);
    console.log('📦 当前消息缓冲区:', messageBuffer);
    res.status(500).json({ error: error.message });
  }
});

// 调用工具
app.post('/api/tools/:toolName', async (req, res) => {
  if (!mcpServer || mcpServer.killed) {
    return res.status(500).json({ error: 'MCP 服务未运行' });
  }

  try {
    const { toolName } = req.params;
    const params = req.body;

    const requestId = Date.now();
    const request = {
      jsonrpc: "2.0",
      id: requestId,
      method: "tools/call",
      params: {
        name: toolName,
        arguments: params
      }
    };

    console.log(`🛠️ 发送工具调用请求 ID: ${requestId}`, { toolName, params });
    
    // 清空缓冲区并发送请求
    const originalLength = messageBuffer.length;
    messageBuffer = messageBuffer.substring(originalLength);
    
    mcpServer.stdin.write(JSON.stringify(request) + '\n');

    const response = await waitForResponse(requestId, 5000);
    
    if (response.error) {
      console.error(`❌ 工具 ${toolName} 调用失败:`, response.error);
      return res.status(400).json({ error: response.error });
    }
    
    console.log(`✅ 工具 ${toolName} 调用成功`);
    res.json(response.result);
    
  } catch (error) {
    console.error(`❌ 工具调用异常:`, error);
    console.log('📦 当前消息缓冲区:', messageBuffer);
    res.status(500).json({ error: error.message });
  }
});

// 修复的等待 MCP 响应函数
function waitForResponse(requestId, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let found = false;
    
    console.log(`⏳ 等待响应 ID: ${requestId}, 超时: ${timeout}ms`);
    
    const checkResponse = () => {
      if (found) return;
      
      const lines = messageBuffer.split('\n').filter(line => line.trim());
      console.log(`🔍 检查 ${lines.length} 条消息，寻找 ID: ${requestId}`);
      
      for (let i = 0; i < lines.length; i++) {
        try {
          const response = JSON.parse(lines[i]);
          console.log(`📨 检查消息 ID: ${response.id}, 目标: ${requestId}`);
          
          if (response.id === requestId) {
            console.log(`✅ 找到匹配的响应 ID: ${requestId}`);
            found = true;
            resolve(response);
            return;
          }
        } catch (e) {
          // 忽略解析错误，但记录一下
          console.log(`❓ 无法解析的消息: ${lines[i].substring(0, 100)}`);
        }
      }
      
      // 检查超时
      if (Date.now() - startTime > timeout) {
        console.log(`⏰ 请求 ${requestId} 超时`);
        reject(new Error('请求超时'));
        return;
      }
      
      // 继续检查
      setTimeout(checkResponse, 100);
    };
    
    // 开始检查
    checkResponse();
  });
}

// 启动 MCP 服务
function startMCPService() {
  console.log('🔧 启动 MCP 服务...');
  
  mcpServer = spawn('node', ['server.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  mcpServer.stdout.on('data', (data) => {
    const output = data.toString();
    messageBuffer += output;
    console.log('📥 MCP 原始输出:', output);
  });

  mcpServer.stderr.on('data', (data) => {
    console.log('📝 MCP 日志:', data.toString().trim());
  });

  mcpServer.on('close', (code) => {
    console.log(`MCP 服务退出，代码: ${code}`);
  });

  console.log('✅ MCP 服务启动完成');
}

// 启动 HTTP 服务器
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🎉 MCP 网关运行在 http://localhost:${PORT}`);
  console.log('📚 可用端点:');
  console.log(`   GET  /health - 健康检查`);
  console.log(`   GET  /api/tools - 工具列表`);
  console.log(`   POST /api/tools/get_weather - 天气查询`);
  
  // 启动 MCP 服务
  startMCPService();
});

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('未捕获异常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason);
});