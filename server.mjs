#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const BOLO_DIR = process.platform === "win32"
  ? join(process.env.APPDATA || join(homedir(), "AppData", "Roaming"), "Bolo")
  : join(homedir(), "Library", "Application Support", "Bolo");
const CLIP_PATH = join(BOLO_DIR, "clipboard_history.json");
const HIST_PATH = join(BOLO_DIR, "history.json");
const SETTINGS_PATH = join(BOLO_DIR, "settings.json");

// Same language keys/labels as the Mac and Windows apps' Translate (Output Style) dropdown.
const TRANSLATE_LANGUAGES = ["roman_urdu", "english", "urdu", "hindi", "pashto", "bengali",
                             "chinese", "spanish", "french", "arabic", "russian", "portuguese"];
// Same language keys/labels as the Interface Language dropdown (a subset — no Chinese/Spanish/French/Arabic).
const INTERFACE_LANGUAGES = ["english", "hindi", "urdu", "roman_urdu", "pashto", "bengali", "russian", "portuguese"];
const LANGUAGE_LABELS = {
  roman_urdu: "Roman Urdu", english: "English", urdu: "Urdu (اردو)", hindi: "Hindi (हिन्दी)",
  pashto: "Pashto (پښتو)", bengali: "Bengali (বাংলা)", chinese: "Chinese (中文)",
  spanish: "Spanish (Español)", french: "French (Français)", arabic: "Arabic (العربية)",
  russian: "Russian (Русский)", portuguese: "Portuguese (Português)",
};

function loadJSON(path) {
  if (!existsSync(path)) return [];
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return []; }
}

function loadSettings() {
  if (!existsSync(SETTINGS_PATH)) return null;
  try { return JSON.parse(readFileSync(SETTINGS_PATH, "utf8")); } catch { return null; }
}

// Only ever touches the one field it's asked to change — every other setting
// (API keys, hotkey, etc.) is read back untouched and written back as-is.
function patchSettings(patch) {
  const current = loadSettings();
  if (!current) return null;
  const next = { ...current, ...patch };
  writeFileSync(SETTINGS_PATH, JSON.stringify(next, null, 2));
  return next;
}

function ago(isoStr) {
  const ms = Date.now() - new Date(isoStr).getTime();
  const m = Math.floor(ms / 60000), h = Math.floor(ms / 3600000), d = Math.floor(ms / 86400000);
  if (d > 0) return `${d} day${d > 1 ? "s" : ""} ago`;
  if (h > 0) return `${h} hour${h > 1 ? "s" : ""} ago`;
  if (m > 0) return `${m} min ago`;
  return "just now";
}

const server = new McpServer({
  name: "bolo-mcp",
  version: "1.0.0",
});

// --- Tool: search clipboard ---
server.tool(
  "search_clipboard",
  "Search Bolo clipboard history — find saved links, text, codes by keyword, type, or date range. Returns matching items with content, type, and time.",
  {
    query: z.string().optional().describe("Search keyword (searches content and label). Leave empty to list recent items."),
    type: z.string().optional().describe("Filter by type: youtube_channel, youtube_video, github, tiktok, instagram, facebook, twitter, linkedin, gdrive, gdoc, openrouter, whop, web_link, email, long_text, text"),
    days: z.number().optional().describe("Only items from the last N days (default: all)"),
    limit: z.number().optional().describe("Max results to return (default: 20, max: 100)"),
  },
  async ({ query, type, days, limit }) => {
    let items = loadJSON(CLIP_PATH);
    const q = (query || "").toLowerCase();
    const maxItems = Math.min(limit || 20, 100);
    const cutoff = days ? Date.now() - days * 86400000 : 0;

    if (q) items = items.filter(i => i.content.toLowerCase().includes(q) || i.label.toLowerCase().includes(q));
    if (type) items = items.filter(i => i.type === type);
    if (cutoff) items = items.filter(i => new Date(i.time).getTime() >= cutoff);

    const results = items.slice(0, maxItems);
    if (results.length === 0) return { content: [{ type: "text", text: "Koi result nahi mila." }] };

    const lines = results.map((i, n) =>
      `${n + 1}. [${i.label}] ${ago(i.time)}\n   ${i.content.length > 300 ? i.content.slice(0, 300) + "…" : i.content}`
    );
    return {
      content: [{
        type: "text",
        text: `Found ${results.length} of ${items.length} items:\n\n${lines.join("\n\n")}`
      }]
    };
  }
);

// --- Tool: get clipboard stats ---
server.tool(
  "clipboard_stats",
  "Get summary stats of Bolo clipboard history — total items, breakdown by type, date range.",
  {},
  async () => {
    const items = loadJSON(CLIP_PATH);
    if (items.length === 0) return { content: [{ type: "text", text: "Clipboard empty." }] };

    const types = {};
    items.forEach(i => { types[i.type] = (types[i.type] || 0) + 1; });
    const sorted = Object.entries(types).sort((a, b) => b[1] - a[1]);
    const oldest = items[items.length - 1]?.time || "?";
    const newest = items[0]?.time || "?";

    let text = `Total: ${items.length} items\n`;
    text += `Date range: ${oldest.slice(0, 10)} → ${newest.slice(0, 10)}\n\nBy type:\n`;
    sorted.forEach(([t, c]) => { text += `  ${t}: ${c}\n`; });
    return { content: [{ type: "text", text }] };
  }
);

// --- Tool: search voice history ---
server.tool(
  "search_voice",
  "Search Bolo voice recording history — find past voice-to-text transcriptions by keyword or date.",
  {
    query: z.string().optional().describe("Search keyword in transcription text"),
    days: z.number().optional().describe("Only items from the last N days"),
    limit: z.number().optional().describe("Max results (default: 20, max: 50)"),
  },
  async ({ query, days, limit }) => {
    let items = loadJSON(HIST_PATH).filter(i => i.status === "ok" && i.text);
    const q = (query || "").toLowerCase();
    const maxItems = Math.min(limit || 20, 50);
    const cutoff = days ? Date.now() - days * 86400000 : 0;

    if (q) items = items.filter(i => i.text.toLowerCase().includes(q));
    if (cutoff) items = items.filter(i => new Date(i.time).getTime() >= cutoff);

    items.reverse();
    const results = items.slice(0, maxItems);
    if (results.length === 0) return { content: [{ type: "text", text: "Koi voice recording nahi mili." }] };

    const lines = results.map((i, n) =>
      `${n + 1}. ${ago(i.time)} (${i.seconds.toFixed(1)}s)\n   ${i.text.length > 300 ? i.text.slice(0, 300) + "…" : i.text}`
    );
    return {
      content: [{
        type: "text",
        text: `Found ${results.length} voice recordings:\n\n${lines.join("\n\n")}`
      }]
    };
  }
);

// --- Tool: get specific clipboard item ---
server.tool(
  "get_clipboard_item",
  "Get full content of a specific clipboard item by its ID.",
  {
    id: z.string().describe("The item ID"),
  },
  async ({ id }) => {
    const items = loadJSON(CLIP_PATH);
    const item = items.find(i => i.id === id);
    if (!item) return { content: [{ type: "text", text: "Item not found." }] };
    return {
      content: [{
        type: "text",
        text: `[${item.label}] saved ${ago(item.time)} (${item.time})\n\nType: ${item.type}\nContent:\n${item.content}`
      }]
    };
  }
);

// --- Tool: get translate language ---
server.tool(
  "get_translate_language",
  "Check what language Bolo's Translate (Output Style) setting is currently set to — the language your voice dictation gets turned into. 'roman_urdu' means no translation (speech stays in Roman Urdu, as-is).",
  {},
  async () => {
    const s = loadSettings();
    if (!s) return { content: [{ type: "text", text: "Bolo hasn't been set up yet (no settings.json found)." }] };
    const lang = s.style || "roman_urdu";
    return { content: [{ type: "text", text: `Translate is set to: ${LANGUAGE_LABELS[lang] || lang}` }] };
  }
);

// --- Tool: set translate language ---
server.tool(
  "set_translate_language",
  "Set Bolo's Translate (Output Style) language — same as picking it in Settings. Applies within ~1 second without needing to restart Bolo or click Save. 'roman_urdu' turns translation off (speech stays as spoken).",
  {
    lang: z.enum(TRANSLATE_LANGUAGES).describe("Options: " + TRANSLATE_LANGUAGES.join(", ")),
  },
  async ({ lang }) => {
    const next = patchSettings({ style: lang });
    if (!next) return { content: [{ type: "text", text: "Bolo hasn't been set up yet (no settings.json found)." }] };
    return { content: [{ type: "text", text: `Translate set to: ${LANGUAGE_LABELS[lang] || lang}` }] };
  }
);

// --- Tool: get interface language ---
server.tool(
  "get_interface_language",
  "Check what language Bolo's own interface (menus, Settings window, buttons) is currently displayed in.",
  {},
  async () => {
    const s = loadSettings();
    if (!s) return { content: [{ type: "text", text: "Bolo hasn't been set up yet (no settings.json found)." }] };
    const lang = s.ui_language || "english";
    return { content: [{ type: "text", text: `Interface language is: ${LANGUAGE_LABELS[lang] || lang}` }] };
  }
);

// --- Tool: set interface language ---
server.tool(
  "set_interface_language",
  "Set Bolo's own interface language (menus, Settings window, buttons) — same as picking it in the Language dropdown. Applies within ~1 second without needing to restart Bolo.",
  {
    lang: z.enum(INTERFACE_LANGUAGES).describe("Options: " + INTERFACE_LANGUAGES.join(", ")),
  },
  async ({ lang }) => {
    const next = patchSettings({ ui_language: lang });
    if (!next) return { content: [{ type: "text", text: "Bolo hasn't been set up yet (no settings.json found)." }] };
    return { content: [{ type: "text", text: `Interface language set to: ${LANGUAGE_LABELS[lang] || lang}` }] };
  }
);

// --- Resource: clipboard as context ---
server.resource(
  "clipboard-recent",
  "bolo://clipboard/recent",
  async (uri) => ({
    contents: [{
      uri: uri.href,
      mimeType: "application/json",
      text: JSON.stringify(loadJSON(CLIP_PATH).slice(0, 50), null, 2),
    }]
  })
);

server.resource(
  "voice-recent",
  "bolo://voice/recent",
  async (uri) => ({
    contents: [{
      uri: uri.href,
      mimeType: "application/json",
      text: JSON.stringify(
        loadJSON(HIST_PATH).filter(i => i.status === "ok").reverse().slice(0, 30),
        null, 2
      ),
    }]
  })
);

const transport = new StdioServerTransport();
await server.connect(transport);
