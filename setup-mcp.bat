@echo off
REM Bolo MCP — Auto Setup for Claude Desktop (Windows)
REM Students: run this once and restart Claude Desktop

echo =========================================
echo   Bolo MCP — Setup for Claude Desktop
echo =========================================
echo.

REM 1. Check Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not installed.
    echo Install it from: https://nodejs.org
    echo Then run this script again.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do echo Node.js found: %%v

REM 2. Get script directory
set "SCRIPT_DIR=%~dp0"
set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
echo Bolo MCP path: %SCRIPT_DIR%

REM 3. Install dependencies
echo.
echo Installing dependencies...
cd /d "%SCRIPT_DIR%"
call npm install --silent 2>nul
echo Dependencies installed.

REM 4. Add to Claude Desktop config
set "CONFIG_DIR=%APPDATA%\Claude"
set "CONFIG_FILE=%CONFIG_DIR%\claude_desktop_config.json"

echo.
echo Configuring Claude Desktop...

if not exist "%CONFIG_DIR%" mkdir "%CONFIG_DIR%"
if not exist "%CONFIG_FILE%" echo {} > "%CONFIG_FILE%"

node -e "const fs=require('fs');const p='%CONFIG_FILE:\=\\%';let c={};try{c=JSON.parse(fs.readFileSync(p,'utf8'))}catch{}if(!c.mcpServers)c.mcpServers={};c.mcpServers.bolo={command:'node',args:['%SCRIPT_DIR:\=/%/server.mjs']};fs.writeFileSync(p,JSON.stringify(c,null,2));console.log('Claude Desktop config updated.')"

REM 5. ChatGPT Desktop config
set "CHATGPT_DIR=%APPDATA%\ChatGPT"
set "CHATGPT_FILE=%CHATGPT_DIR%\chatgpt_mcp_config.json"

if exist "%CHATGPT_DIR%" (
    echo.
    echo ChatGPT Desktop detected — configuring...
    if not exist "%CHATGPT_FILE%" echo {} > "%CHATGPT_FILE%"
    node -e "const fs=require('fs');const p='%CHATGPT_FILE:\=\\%';let c={};try{c=JSON.parse(fs.readFileSync(p,'utf8'))}catch{}if(!c.mcpServers)c.mcpServers={};c.mcpServers.bolo={command:'node',args:['%SCRIPT_DIR:\=/%/server.mjs']};fs.writeFileSync(p,JSON.stringify(c,null,2));console.log('ChatGPT Desktop config updated.')"
)

echo.
echo =========================================
echo   DONE! Restart your AI app(s).
echo   (Close and reopen Claude / ChatGPT)
echo.
echo   Works with: Claude, ChatGPT, Cursor, Windsurf
echo.
echo   After restart, ask your AI:
echo   "Show my Bolo clipboard history"
echo =========================================
pause
