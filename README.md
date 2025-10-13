# mcp
Build a simple mcp instance

### How to develop a MCP Server and test
See weather-mcp\readme.md

### How to setup mcp in VS Code 
See setup_vscode_mcp\setup_vscode_mcp.md



## Knowledage 
### Transport methods 
- Standard input/output (stdio) for local servers.
- Streamable HTTP (http) for remote servers.
- Server-sent events (sse) for legacy support.
选择 stdio 当：
✅ 服务和客户端在同一台机器
✅ 需要最高性能
✅ 用于 Claude Desktop 等桌面应用
✅ 不需要网络访问

选择 HTTP 当：
✅ 服务需要远程访问
✅ 多客户端共享同一服务
✅ 需要负载均衡和高可用
✅ 已经有 HTTP 基础设施

选择 SSE 当：
✅ 集成传统系统
✅ 需要服务器主动推送事件
✅ 兼容旧版协议
✅ 实时数据流需求