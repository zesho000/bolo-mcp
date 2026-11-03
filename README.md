# bolo-mcp

MCP server for **Bolo** — exposes your clipboard history and voice recordings to Claude Desktop, ChatGPT, or any MCP-compatible AI.

## What it does

Ask Claude things like:
- "10 din pehle ek YouTube channel ka link save kiya tha, nikal do"
- "last week ke saare GitHub links do"
- "kal maine kya kya copy kiya?"
- "voice mein maine Claude ke baare mein kya bola tha?"

## Tools

| Tool | Description |
|------|-------------|
| `search_clipboard` | Search clipboard by keyword, type, or date range |
| `clipboard_stats` | Get total items, type breakdown, date range |
| `search_voice` | Search voice recording transcriptions |
| `get_clipboard_item` | Get full content of a specific item by ID |

## Setup with Claude Desktop

1. Install dependencies:
```bash
cd bolo-mcp
npm install
```

2. Add to Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "bolo": {
      "command": "node",
      "args": ["/FULL/PATH/TO/bolo-mcp/server.mjs"]
    }
  }
}
```

3. Restart Claude Desktop — you'll see Bolo tools in the MCP menu.

## Requirements

- Node.js 18+
- Bolo app running on the same Mac (data lives in `~/Library/Application Support/Bolo/`)
