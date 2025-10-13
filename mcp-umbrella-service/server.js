// server.js - Simple MCP HTTP Umbrella Service
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Umbrella products
const umbrellaProducts = {
  "single": { name: "Single Umbrella", price: 10 },
  "double": { name: "Double Umbrella", price: 20 },
  "large": { name: "Large Umbrella", price: 30 }
};

// MCP tools definition
const tools = [
  {
    name: "list_umbrellas",
    description: "Get list of available umbrella types and prices",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "buy_umbrella",
    description: "Purchase an umbrella",
    inputSchema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["single", "double", "large"],
          description: "Type of umbrella to purchase"
        },
        quantity: {
          type: "number",
          description: "Number of umbrellas to buy",
          default: 1
        }
      },
      required: ["type"]
    }
  }
];

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MCP Umbrella Service',
    timestamp: new Date().toISOString()
  });
});

// MCP protocol endpoint
app.post('/mcp', async (req, res) => {
  try {
    const { method, params, id } = req.body;
    
    console.log(`MCP Request: ${method}, ID: ${id}`);

    // Initialize request
    if (method === "initialize") {
      res.json({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {},
            resources: {}
          },
          serverInfo: {
            name: "umbrella-service",
            version: "1.0.0"
          }
        }
      });
      return;
    }

    // Tools list request
    if (method === "tools/list") {
      res.json({
        jsonrpc: "2.0",
        id,
        result: {
          tools: tools
        }
      });
      return;
    }

    // Tool call request
    if (method === "tools/call") {
      const { name, arguments: args } = params;
      
      console.log(`Call tool: ${name}`, args);

      let result;
      
      try {
        if (name === "list_umbrellas") {
          const productList = Object.entries(umbrellaProducts)
            .map(([key, product]) => `${product.name}: $${product.price} (type: ${key})`)
            .join('\n');
            
          result = {
            content: [{
              type: "text",
              text: `Available Umbrellas:\n${productList}`
            }]
          };
        }
        else if (name === "buy_umbrella") {
          const { type, quantity = 1 } = args;
          
          if (!umbrellaProducts[type]) {
            throw new Error(`Unknown umbrella type: ${type}. Available types: single, double, large`);
          }
          
          if (quantity < 1) {
            throw new Error("Quantity must be at least 1");
          }
          
          const product = umbrellaProducts[type];
          const totalPrice = product.price * quantity;
          
          result = {
            content: [{
              type: "text",
              text: `Purchase Successful!\nProduct: ${product.name}\nQuantity: ${quantity}\nUnit Price: $${product.price}\nTotal: $${totalPrice}\n\nThank you for your purchase!`
            }]
          };
        }
        else {
          throw new Error(`Unknown tool: ${name}`);
        }

        res.json({
          jsonrpc: "2.0",
          id,
          result: result
        });

      } catch (toolError) {
        res.json({
          jsonrpc: "2.0",
          id,
          error: {
            code: -32000,
            message: toolError.message
          }
        });
      }
      return;
    }

    // Unknown method
    res.json({
      jsonrpc: "2.0",
      id,
      error: {
        code: -32601,
        message: `Method not found: ${method}`
      }
    });

  } catch (error) {
    console.error('Error processing MCP request:', error);
    res.status(500).json({
      jsonrpc: "2.0",
      id: req.body?.id || null,
      error: {
        code: -32603,
        message: "Internal server error"
      }
    });
  }
});

// Server info endpoint
app.get('/info', (req, res) => {
  res.json({
    name: "MCP Umbrella Service",
    version: "1.0.0",
    protocol: "MCP over HTTP",
    endpoints: {
      health: "/health",
      mcp: "/mcp",
      info: "/info"
    },
    available_tools: tools.map(tool => tool.name)
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MCP HTTP Server running at http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Server info: http://localhost:${PORT}/info`);
  console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
  console.log('\nAvailable tools:');
  tools.forEach(tool => {
    console.log(`  - ${tool.name}: ${tool.description}`);
  });
  console.log('\nUmbrella products:');
  Object.entries(umbrellaProducts).forEach(([key, product]) => {
    console.log(`  - ${key}: ${product.name} - $${product.price}`);
  });
});