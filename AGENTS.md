# Agent Guidelines & Codebase Intelligence

## Codebase Memory MCP Integration

This repository is indexed with [codebase-memory-mcp](https://github.com/DeusData/codebase-memory-mcp).

### Code Intelligence Priority
1. **Structural Searches & Call Chains**: Use `codebase-memory-mcp` tools (`search_graph`, `query_graph`, `trace_path`, `get_architecture`) as the primary mechanism for understanding code relationships and cross-file dependencies.
2. **Fallback**: Use standard grep or file reading tools if additional file content details are required.
3. **Re-indexing**: Run `codebase-memory-mcp cli index_repository --repo-path "." --mode full` whenever significant codebase structural changes occur.
