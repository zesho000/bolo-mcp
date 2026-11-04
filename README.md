# bolo-mcp

MCP server for **Bolo** — exposes your clipboard history and voice recordings to any MCP-compatible AI (Claude, ChatGPT, Cursor, Windsurf, etc).

## What it does

Ask your AI things like:
- "10 din pehle ek YouTube channel ka link save kiya tha, nikal do"
- "last week ke saare GitHub links do"
- "kal maine kya kya copy kiya?"
- "voice mein maine kya bola tha?"

## Tools

| Tool | Description |
|------|-------------|
| `search_clipboard` | Search clipboard by keyword, type, or date range |
| `clipboard_stats` | Get total items, type breakdown, date range |
| `search_voice` | Search voice recording transcriptions |
| `get_clipboard_item` | Get full content of a specific item by ID |

## Quick Setup (Mac)

```bash
cd bolo-mcp
./setup-mcp.sh
```

This auto-installs dependencies, configures Claude Desktop, and tests the server.
Restart Claude Desktop (Cmd+Q, reopen) — done.

---

## Setup per AI Tool

### Claude Desktop

Config: `~/Library/Application Support/Claude/claude_desktop_config.json`

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

### ChatGPT Desktop

Config: `~/Library/Application Support/ChatGPT/chatgpt_mcp_config.json` (create if missing)

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

### Cursor

Settings → MCP → Add Server:
- **Name:** `bolo`
- **Command:** `node /FULL/PATH/TO/bolo-mcp/server.mjs`

### Windsurf / Any MCP Client

Same pattern — point to `server.mjs`:
- **Command:** `node`
- **Args:** `["/FULL/PATH/TO/bolo-mcp/server.mjs"]`

Check your AI tool's docs for where MCP server config goes.

---

## Requirements

- Node.js 18+
- Bolo app running on the same Mac (data lives in `~/Library/Application Support/Bolo/`)
