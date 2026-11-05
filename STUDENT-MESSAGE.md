# Bolo — Smart Clipboard & Voice Tool + AI Integration

Bolo is a lightweight tool that runs in your menu bar and automatically saves everything you copy — links, text, codes, emails — and also lets you record voice-to-text instantly with a hotkey. It detects and categorizes your clipboard items (YouTube, GitHub, Instagram, TikTok, and more) so you never lose a link again.

With the **Bolo MCP Server**, you can connect your clipboard history directly to AI assistants like **Claude**, **ChatGPT**, **Cursor**, or **Windsurf** — and search your saved data using natural language.

---

## Download Bolo

| Platform | Download |
|----------|----------|
| **Mac** | [Download for Mac](https://drive.google.com/open?id=1SErwb0oF_gtKGLCezpihPKlMvKCld_EM) |
| **Windows** | [Download for Windows](https://drive.google.com/open?id=1W2v6wFcxAdc0Oj6y3tn3SpwltYuPmOSw) |

---

## Bolo MCP Server — Connect to AI

The MCP server lets your AI assistant search your Bolo clipboard and voice history. Once connected, you just ask — your AI does the rest.

### GitHub Repo

```
https://github.com/zesho000/bolo-mcp
```

### Quick Setup

**Step 1:** Make sure Node.js is installed — download from https://nodejs.org (LTS version)

**Step 2:** Clone the repo and run setup:

**Mac:**
```bash
git clone https://github.com/zesho000/bolo-mcp.git
cd bolo-mcp
./setup-mcp.sh
```

**Windows (Command Prompt or PowerShell):**
```
git clone https://github.com/zesho000/bolo-mcp.git
cd bolo-mcp
setup-mcp.bat
```

**Step 3:** Restart your AI app (close and reopen)

That's it. The setup script automatically installs dependencies and configures Claude Desktop + ChatGPT Desktop.

### Manual Setup (Any AI Tool)

If your AI tool supports MCP servers, add this to its config:

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

Replace `/FULL/PATH/TO/` with the actual path where you cloned the repo.

**Config file locations:**
- Claude Desktop (Mac): `~/Library/Application Support/Claude/claude_desktop_config.json`
- Claude Desktop (Windows): `%APPDATA%\Claude\claude_desktop_config.json`
- ChatGPT Desktop (Mac): `~/Library/Application Support/ChatGPT/chatgpt_mcp_config.json`
- ChatGPT Desktop (Windows): `%APPDATA%\ChatGPT\chatgpt_mcp_config.json`
- Cursor: Settings → MCP → Add Server
- Windsurf: Settings → MCP → Add Server

---

## MCP Tools Available

| Tool | What it does |
|------|-------------|
| `search_clipboard` | Search your saved clipboard items by keyword, type, or date |
| `clipboard_stats` | See total items, type breakdown, and date range |
| `search_voice` | Search your voice recording transcriptions |
| `get_clipboard_item` | Get the full content of a specific saved item |
| `get_translate_language` / `set_translate_language` | Check or change Bolo's Translate (Output Style) language |
| `get_interface_language` / `set_interface_language` | Check or change Bolo's own interface language |

---

## Example Prompts

Once connected, try these prompts in Claude or ChatGPT:

> Search my Bolo clipboard for YouTube links from the last 7 days

> Show me everything I copied yesterday

> Find the GitHub link I saved last week

> What are my Bolo clipboard stats?

> Search my voice history for anything about "channel"

> I saved a website link about 10 days ago with the word "design" in it — find it for me

> Set Bolo's translate language to Spanish

> Change Bolo's interface to Hindi

---

## Requirements

- **Bolo app** installed and running
- **Node.js 18+** — https://nodejs.org
- **Claude Desktop** or **ChatGPT Desktop** or any MCP-compatible AI tool
