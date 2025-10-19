

## Vedios
youtube.com/watch?v=kOhLoixrJXo&t=60

## MCP Defination 
Model Context Protocol (MCP)
- An open standard that allows Large Language Models (LLMs) to communicate with external applications and data sources. 
- Functions like a standardized "USB-C port" for AI, providing a universal way for AI models to connect to various tools, databases, and services. 
- Helps AI assistants become more capable by giving them access to up-to-date information and the ability to perform actions beyond their training data. 
- Simplifies the integration process for developers, allowing them to build one MCP server that can be used across different AI platforms. 

## Transport 
MCP is designed to work over several transports. As of 2025, the specification highlights:

- stdio: Simple, local transport where the client launches the server as a subprocess and communicates over stdin/stdout. Low overhead and great for local tools.
- Streamable HTTP: The modern HTTP-based transport that supports bidirectional JSON-RPC via HTTP endpoints and can provide streaming semantics without a separate SSE channel. The 2025 documents state that Streamable HTTP replaces the older HTTP+SSE transport from late 2024.
- HTTP+SSE (deprecated): The earlier pattern paired HTTP POST (client→server) with Server‑Sent Events for server→client streaming. It is marked deprecated in favor of Streamable HTTP, though many community samples still demonstrate it for learning and backward compatibility.