# Bolo MCP — Setup Guide

## What is this?

Bolo MCP connects your Bolo clipboard history to AI assistants (Claude, ChatGPT, Cursor, etc).

Once set up, you can ask your AI:
- "10 din pehle ek YouTube link copy kiya tha, nikal do"
- "Last week ke saare GitHub links do"
- "Kal maine kya kya copy kiya?"
- "Voice mein maine kya bola tha?"

Your AI will search your Bolo history and give you the answer — no need to open Bolo manually.

---

## Requirements

- **Bolo app** installed and running (you already have this)
- **Node.js** installed — download from https://nodejs.org (LTS version)
- **Claude Desktop** or **ChatGPT Desktop** installed

---

## Setup (One Command)

### Step 1: Open Terminal

Press `Cmd + Space`, type `Terminal`, press Enter.

### Step 2: Go to the bolo-mcp folder

```
cd /path/to/bolo-mcp
```

(Replace `/path/to/` with the actual folder location where you have bolo-mcp)

### Step 3: Run the setup

```
./setup-mcp.sh
```

This will:
- Install dependencies automatically
- Configure Claude Desktop automatically
- Configure ChatGPT Desktop automatically (if installed)
- Test the server

### Step 4: Restart your AI app

Quit Claude Desktop (Cmd+Q) and reopen it. Same for ChatGPT if you use it.

---

## Done!

Now open Claude or ChatGPT and try:

> "Bolo mein dekho, last week ke links do"

> "Bolo clipboard stats dikhao"

> "Maine kal kya copy kiya tha?"

Your AI will search your clipboard and give you results.

---

## Troubleshooting

**"Node.js not installed" error:**
Download and install from https://nodejs.org — then run `./setup-mcp.sh` again.

**Tools not showing in Claude:**
Make sure you fully quit Claude (Cmd+Q) and reopened it. Check the MCP menu (hammer icon) — Bolo tools should be listed there.

**No clipboard data:**
Make sure Bolo app is running (check menu bar). Copy some text or links — they'll start saving automatically.
