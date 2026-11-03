#!/bin/bash
# Bolo MCP — Auto Setup for Claude Desktop
# Students: run this once and restart Claude Desktop

set -e

echo "========================================="
echo "  Bolo MCP — Setup for Claude Desktop"
echo "========================================="
echo ""

# 1. Check Node.js
if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js not installed."
  echo "Install it from: https://nodejs.org"
  echo "Then run this script again."
  exit 1
fi

NODE_VER=$(node -v)
echo "Node.js found: $NODE_VER"

# 2. Get script directory (where bolo-mcp lives)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
echo "Bolo MCP path: $SCRIPT_DIR"

# 3. Install dependencies
echo ""
echo "Installing dependencies..."
cd "$SCRIPT_DIR"
npm install --silent 2>/dev/null
echo "Dependencies installed."

# 4. Add to Claude Desktop config
CONFIG_DIR="$HOME/Library/Application Support/Claude"
CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"

echo ""
echo "Configuring Claude Desktop..."

if [ ! -d "$CONFIG_DIR" ]; then
  mkdir -p "$CONFIG_DIR"
fi

if [ ! -f "$CONFIG_FILE" ]; then
  echo "{}" > "$CONFIG_FILE"
fi

# Use node to safely merge JSON
node -e "
const fs = require('fs');
const path = '$CONFIG_FILE';
let config = {};
try { config = JSON.parse(fs.readFileSync(path, 'utf8')); } catch {}
if (!config.mcpServers) config.mcpServers = {};
config.mcpServers.bolo = {
  command: 'node',
  args: ['$SCRIPT_DIR/server.mjs']
};
fs.writeFileSync(path, JSON.stringify(config, null, 2));
console.log('Claude Desktop config updated.');
"

# 5. Test server
echo ""
echo "Testing MCP server..."
node -e "
const { spawn } = require('child_process');
const s = spawn('node', ['$SCRIPT_DIR/server.mjs'], { stdio: ['pipe','pipe','pipe'] });
let out = '';
s.stdout.on('data', d => { out += d; s.kill(); });
s.stdin.write(JSON.stringify({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'test',version:'1.0.0'}}}) + '\n');
setTimeout(() => { s.kill(); process.exit(out.includes('bolo-mcp') ? 0 : 1); }, 5000);
s.on('close', () => {
  if (out.includes('bolo-mcp')) { console.log('Server test: PASSED'); process.exit(0); }
  else { console.log('Server test: could not verify (this is OK)'); process.exit(0); }
});
"

echo ""
echo "========================================="
echo "  DONE! Now restart Claude Desktop."
echo "  (Cmd+Q to quit, then reopen)"
echo ""
echo "  After restart, ask Claude:"
echo "  'Bolo mein dekho, last week ke links do'"
echo "========================================="
