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
const TRANSLATE_PATH = join(BOLO_DIR, "translate_mode.json");

const LANGUAGES = ["roman_urdu", "english", "urdu", "hindi", "pashto", "bengali",
                   "chinese", "spanish", "french", "arabic", "russian", "portuguese"];
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

function loadTranslateState() {
  if (!existsSync(TRANSLATE_PATH)) return { on: false, lang: "english" };
  try { return JSON.parse(readFileSync(TRANSLATE_PATH, "utf8")); } catch { return { on: false, lang: "english" }; }
}

function saveTranslateState(state) {
  writeFileSync(TRANSLATE_PATH, JSON.stringify(state, null, 2));
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

// --- Tool: get translate mode ---
server.tool(
  "get_translate_mode",
  "Check Bolo's Quick Translate Mode — whether it's currently ON (voice dictation gets translated into an alternate language instead of the default Roman Urdu) or OFF, and which language it's set to. Bolo must be running — it picks up changes within ~1 second.",
  {},
  async () => {
    const state = loadTranslateState();
    const label = LANGUAGE_LABELS[state.lang] || state.lang;
    return {
      content: [{
        type: "text",
        text: state.on
          ? `Quick Translate Mode: ON — dictation is being translated into ${label}.`
          : `Quick Translate Mode: OFF — dictation stays in the default (Roman Urdu / whatever Output Style is set in Settings).`
      }]
    };
  }
);

// --- Tool: set translate mode ---
server.tool(
  "set_translate_mode",
  "Turn Bolo's Quick Translate Mode on or off, same as clicking the menu bar toggle — no need to open Settings. When ON, voice dictation is translated into the given language instead of the default. Bolo must be running — it picks up the change within ~1 second (poll get_translate_mode right after to confirm).",
  {
    on: z.boolean().describe("true = turn translate mode on, false = turn it off (back to default Roman Urdu)"),
    lang: z.enum(LANGUAGES).optional().describe("Language to translate into when turning on. Omit to keep whatever language was last used. Options: " + LANGUAGES.join(", ")),
  },
  async ({ on, lang }) => {
    const current = loadTranslateState();
    const next = { on, lang: lang || current.lang || "english" };
    saveTranslateState(next);
    const label = LANGUAGE_LABELS[next.lang] || next.lang;
    return {
      content: [{
        type: "text",
        text: on
          ? `Quick Translate Mode turned ON — dictation will be translated into ${label}.`
          : `Quick Translate Mode turned OFF — dictation is back to the default.`
      }]
    };
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
