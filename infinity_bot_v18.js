/* ============================================
   ♾️ INFINITY BOT V18 — SOLO WARRIOR
   Clean build: NC + Namelock + Spam only
   Pair code login (no QR)
   ============================================ */

import readline from "readline";
import fs from "fs";
import os from "os";

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} = require("@whiskeysockets/baileys");

/* ============ CONFIG ============ */
let PREFIX = "/";
const DOMAIN_EXPANSION_IMAGE = "https://i.imgur.com/6Gq9V1P.jpeg";

/* ============ TEXT POOLS ============ */
const RAID_TEXTS = [
  "Infinity ⃟♥️","Infinity ⃟💔","Infinity ⃟❣️","Infinity ⃟💕",
  "Infinity ⃟💞","Infinity ⃟💓","Infinity ⃟💗","Infinity ⃟💖",
  "Infinity ⃟💘","Infinity ⃟💌","Infinity ⃟🩶","Infinity ⃟🩷",
  "Infinity ⃟🩵","Infinity ⃟❤️‍🔥","Infinity ⃟❤️‍🩹","Infinity ❤️‍🔥"
];
const INFINITY_TEXTS = [
  "🎀","💝","🔱","💘","💞","💢","❤️‍🔥","🌈","🪐","☄️",
  "⚡","🦚","🦈","🕸️","🍬","🧃","🗽","🪅","🎏","🎸",
  "📿","🏳️‍🌈","🌸","🎶","🎵","☃️","❄️","🕊️","🍷","🥂"
];
const NCEMO_EMOJIS = [
  "💘","🪷","🎐","🫧","💥","💢","❤️‍🔥","☘️","🪐","☄️",
  "🪽","🦚","🦈","🕸️","🍬","🧃","🗽","🪅","🎏","🎸",
  "📿","🏳️‍🌈","🌸","🎶","🎵","☃️","❄️","🕊️","🍷","🥂"
];

/* ============ DATA ============ */
const DATA_DIR          = "./data";
const SUDO_FILE         = `${DATA_DIR}/sudo.json`;
const SETTINGS_FILE     = `${DATA_DIR}/settings.json`;
const OWNER_FILE        = `${DATA_DIR}/owner.json`;
const CONFIG_FILE       = `${DATA_DIR}/config.json`;
const INFINITESUDO_FILE = `${DATA_DIR}/infinitesudo.json`;

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

function loadJSON(file, def) {
  try { return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf-8")) : def; }
  catch { return def; }
}
function saveJSON(file, data) {
  try { fs.writeFileSync(file, JSON.stringify(data, null, 2)); } catch {}
}

let SUDO_USERS         = new Set(loadJSON(SUDO_FILE, []));
let INFINITESUDO_USERS = new Set(loadJSON(INFINITESUDO_FILE, []));
let OWNER_JID          = loadJSON(OWNER_FILE, null);
const settings         = loadJSON(SETTINGS_FILE, { prefix: "/" });
PREFIX = settings.prefix || "/";

function saveOwner()        { saveJSON(OWNER_FILE, OWNER_JID); }
function saveSudo()         { saveJSON(SUDO_FILE, [...SUDO_USERS]); }
function saveInfiniteSudo() { saveJSON(INFINITESUDO_FILE, [...INFINITESUDO_USERS]); }
function saveSettings()     { saveJSON(SETTINGS_FILE, { prefix: PREFIX }); }
function saveBotCount(n)    { const c = loadJSON(CONFIG_FILE, {}); c.botCount = n; saveJSON(CONFIG_FILE, c); }

/* ============ HELPERS ============ */
const log   = (...a) => console.log(`[${new Date().toLocaleTimeString()}]`, ...a);
const bare  = jid => jid?.split(":")[0];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const START_TIME = Date.now();
const formatUptime = ms => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m ${s % 60}s`;
};

const isOwner = jid => {
  if (!OWNER_JID) return false;
  return bare(jid) === bare(OWNER_JID) || jid === OWNER_JID;
};
const isInfiniteSudo = jid => {
  const b = bare(jid);
  return isOwner(jid) || INFINITESUDO_USERS.has(b) || INFINITESUDO_USERS.has(jid);
};
const isSudo = jid => {
  const b = bare(jid);
  return isOwner(jid) || isInfiniteSudo(jid) || SUDO_USERS.has(b) || SUDO_USERS.has(jid);
};
const isCmd  = (text, cmd) => text === `${PREFIX}${cmd}` || text.startsWith(`${PREFIX}${cmd} `);
const getArg = text => text.slice(PREFIX.length).trim().split(" ").slice(1).join(" ");

/* ================================================================
   ♾️ SOLO WARRIOR ENGINE
   Adaptive rate + zero-waste pipeline + namelock defender
   ================================================================ */

class AdaptiveRateController {
  constructor(startDelay = 80) {
    this.delay = startDelay;
    this.min   = 20;
    this.max   = 600;
    this.wins  = 0;
    this.losses = 0;
  }
  onSuccess() {
    this.wins++;
    this.losses = 0;
    if (this.wins >= 5) { this.delay = Math.max(this.min, this.delay - 5); this.wins = 0; }
  }
  onError() {
    this.losses++;
    this.wins = 0;
    this.delay = Math.min(this.max, this.delay + 30);
  }
  get()         { return this.delay; }
  reset(d = 80) { this.delay = d; this.wins = 0; this.losses = 0; }
}

class NCPipeline {
  constructor(sock, chatId, pool, base, ctrl) {
    this.sock     = sock;
    this.chatId   = chatId;
    this.pool     = pool;
    this.base     = base;
    this.ctrl     = ctrl;
    this.idx      = 0;
    this.alive    = true;
    this.lastSent = null;
    this._run();
  }
  _next() {
    let title, tries = 0;
    do {
      title = `${this.base} ${this.pool[this.idx % this.pool.length]}`;
      this.idx++;
    } while (title === this.lastSent && ++tries < this.pool.length);
    return (this.lastSent = title);
  }
  async _run() {
    while (this.alive) {
      try {
        await this.sock.groupUpdateSubject(this.chatId, this._next());
        this.ctrl.onSuccess();
      } catch { this.ctrl.onError(); }
      await sleep(this.ctrl.get());
    }
  }
  stop() { this.alive = false; }
}

class NameLockDefender {
  constructor(sock, chatId, base, pool) {
    this.sock      = sock;
    this.chatId    = chatId;
    this.base      = base;
    this.pool      = pool;
    this.alive     = true;
    this.attacking = false;
    this.idx       = 0;
    this.ctrl      = new AdaptiveRateController(60);
    this._loop();
  }
  _next() {
    const title = `${this.base} ${this.pool[this.idx % this.pool.length]}`;
    this.idx++;
    return title;
  }
  async _loop() {
    while (this.alive) {
      if (!this.attacking) {
        const title = this._next();
        try { await this.sock.groupUpdateSubject(this.chatId, title); this.ctrl.onSuccess(); }
        catch { this.ctrl.onError(); }
      }
      await sleep(this.ctrl.get());
    }
  }
  async onChanged(newName) {
    if (!this.alive || newName.startsWith(this.base)) return;
    this.attacking = true;
    try {
      for (let i = 0; i < 3; i++) {
        await this.sock.groupUpdateSubject(this.chatId, this._next()).catch(() => {});
        await sleep(15);
      }
    } finally { this.attacking = false; }
  }
  stop() { this.alive = false; }
}

/* ── SESSION STORE ── */
const _ncPipes     = new Map();
const _ncLocks     = new Map();
const _ncCtrl      = new Map();
const spam_tasks   = new Map();
const domain_tasks = new Map();
const raidActivated = new Set();

function _getCtrl(chatId, d = 80) {
  if (!_ncCtrl.has(chatId)) _ncCtrl.set(chatId, new AdaptiveRateController(d));
  return _ncCtrl.get(chatId);
}
function _stopNC(chatId) {
  if (_ncPipes.has(chatId)) { _ncPipes.get(chatId).stop(); _ncPipes.delete(chatId); return true; }
  return false;
}
function stopNameLock(chatId) {
  if (_ncLocks.has(chatId)) { _ncLocks.get(chatId).stop(); _ncLocks.delete(chatId); return true; }
  return false;
}
function stopSpam(chatId) {
  if (spam_tasks.has(chatId)) { spam_tasks.get(chatId).cancel(); spam_tasks.delete(chatId); return true; }
  return false;
}
function stopDomain(chatId) {
  if (domain_tasks.has(chatId)) {
    const t = domain_tasks.get(chatId);
    if (Array.isArray(t)) t.forEach(x => x?.cancel?.());
    domain_tasks.delete(chatId); return true;
  }
  return false;
}
function stopAll(chatId) { _stopNC(chatId); stopNameLock(chatId); stopSpam(chatId); stopDomain(chatId); }
function onGroupNameChanged(chatId, newName) {
  if (_ncLocks.has(chatId)) _ncLocks.get(chatId).onChanged(newName);
}

/* ── NC STARTERS ── */
function startGCNC(sock, chatId, base) {
  _stopNC(chatId); const c = _getCtrl(chatId); c.reset(80);
  _ncPipes.set(chatId, new NCPipeline(sock, chatId, RAID_TEXTS, base, c));
}
function startNCEMO(sock, chatId, base) {
  _stopNC(chatId); const c = _getCtrl(chatId); c.reset(80);
  _ncPipes.set(chatId, new NCPipeline(sock, chatId, NCEMO_EMOJIS, base, c));
}
function startNCBAAP(sock, chatId, base) {
  _stopNC(chatId); const c = _getCtrl(chatId); c.reset(20);
  _ncPipes.set(chatId, new NCPipeline(sock, chatId, RAID_TEXTS, base, c));
}
function startInfinity(sock, chatId, base) {
  _stopNC(chatId); const c = _getCtrl(chatId); c.reset(80);
  _ncPipes.set(chatId, new NCPipeline(sock, chatId, INFINITY_TEXTS, base, c));
}
function startInfinityFast(sock, chatId, base) {
  _stopNC(chatId); const c = _getCtrl(chatId); c.reset(30);
  _ncPipes.set(chatId, new NCPipeline(sock, chatId, INFINITY_TEXTS, base, c));
}
function startInfinityGodspeed(sock, chatId, base) {
  _stopNC(chatId); const c = _getCtrl(chatId); c.reset(20); c.min = 20;
  _ncPipes.set(chatId, new NCPipeline(sock, chatId, INFINITY_TEXTS, base, c));
}
function startNameLock(sock, chatId, base, pool) {
  stopNameLock(chatId);
  _ncLocks.set(chatId, new NameLockDefender(sock, chatId, base, pool));
}
function startSpam(sock, chatId, spamText) {
  stopSpam(chatId);
  let alive = true;
  (async () => { while (alive) { try { await sock.sendMessage(chatId, { text: spamText }); } catch {} await sleep(100); } })();
  spam_tasks.set(chatId, { cancel: () => { alive = false; } });
}
function startDomainExpansion(sock, chatId, base, mode) {
  stopDomain(chatId);
  const pool = mode === "ncemo" ? NCEMO_EMOJIS : mode === "infinity" ? INFINITY_TEXTS : RAID_TEXTS;
  const pipes = Array.from({ length: 3 }, (_, w) => {
    const ctrl = new AdaptiveRateController(20 + w * 15);
    let idx = w * Math.floor(pool.length / 3), lastSent = null, alive = true;
    (async () => {
      while (alive) {
        let title, tries = 0;
        do { title = `${base} ${pool[idx % pool.length]}`; idx++; }
        while (title === lastSent && ++tries < pool.length);
        lastSent = title;
        try { await sock.groupUpdateSubject(chatId, title); ctrl.onSuccess(); }
        catch { ctrl.onError(); }
        await sleep(ctrl.get());
      }
    })();
    return { cancel: () => { alive = false; } };
  });
  let watching = true;
  (async () => {
    while (watching) {
      await sleep(300);
      try {
        const meta = await sock.groupMetadata(chatId).catch(() => null);
        if (meta?.subject && !meta.subject.toLowerCase().startsWith(base.toLowerCase())) {
          await sock.groupUpdateSubject(chatId, `${base} 😈♾️`).catch(() => {});
          await sleep(20);
          await sock.groupUpdateSubject(chatId, `${base} 😈♾️`).catch(() => {});
        }
      } catch {}
    }
  })();
  domain_tasks.set(chatId, [...pipes, { cancel: () => { watching = false; } }]);
}

/* ============ HELP ============ */
function getHelp(unlocked) {
  const base =
`♾️ *INFINITY BOT V18 — SOLO WARRIOR*
━━━━━━━━━━━━━━━━━━━━━━━
🤖 *BOT*
> ${PREFIX}ping / ${PREFIX}status
> ${PREFIX}prefix <new>
> ${PREFIX}addsudo / ${PREFIX}delsudo / ${PREFIX}listsudo (reply)
> ${PREFIX}addinfinitesudo / ${PREFIX}delinfinitesudo (reply)

━━━━━━━━━━━━━━━━━━━━━━━
🔐 *RAID MODE*
> ${PREFIX}activateinfinity   → Unlock NC & Spam
> ${PREFIX}deactivateinfinity → Lock + stop all`;

  const raid =
`

━━━━━━━━━━━━━━━━━━━━━━━
💀 *NAME CHANGER* 🔓
> ${PREFIX}gcnc <text>
> ${PREFIX}ncemo <text>
> ${PREFIX}ncbaap <text>
> ${PREFIX}infinity <text>
> ${PREFIX}infinityfast <text>
> ${PREFIX}infinitygodspeed <text>
> ${PREFIX}stopnc

━━━━━━━━━━━━━━━━━━━━━━━
🔒 *NAME LOCK* 🔓
> ${PREFIX}namelock <text>    → Infinity emojis + instant rewrite
> ${PREFIX}namelockemo <text> → NCEMO emojis + instant rewrite
> ${PREFIX}stopnamelock

━━━━━━━━━━━━━━━━━━━━━━━
😈 *DOMAIN EXPANSION* 🔓
> ${PREFIX}domainexpansion <text>
> ${PREFIX}domainexpansionncemo <text>
> ${PREFIX}domainexpansioninfinity <text>
> ${PREFIX}stopdomainexpansion

━━━━━━━━━━━━━━━━━━━━━━━
💥 *SPAM* 🔓
> ${PREFIX}spam <text>
> ${PREFIX}unspam
> ${PREFIX}stopall`;

  const locked =
`

━━━━━━━━━━━━━━━━━━━━━━━
🔒 *LOCKED — type ${PREFIX}activateinfinity*`;

  return base + (unlocked ? raid : locked) + `\n\n♾️ _Solo Warrior V18_`;
}

/* ============ BOT ============ */
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(`./auth_bot_1`);
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({ auth: state, version, printQRInTerminal: false });
  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("groups.update", updates => {
    for (const upd of updates)
      if (upd.subject !== undefined) onGroupNameChanged(upd.id, upd.subject);
  });

  let pairCodeRequested = false;
  sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
    if (!pairCodeRequested && !sock.authState.creds.registered && connection === "connecting") {
      pairCodeRequested = true;
      const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout });
      rl2.question(`\n📱 WhatsApp number (e.g. 919876543210): `, async phone => {
        rl2.close();
        phone = phone.replace(/[^0-9]/g, "");
        try {
          await sleep(1500);
          const code = await sock.requestPairingCode(phone);
          const fmt = code.match(/.{1,4}/g).join("-");
          console.log(`\n╔══════════════════════════════╗`);
          console.log(`║  🔑  INFINITY PAIR CODE       ║`);
          console.log(`╠══════════════════════════════╣`);
          console.log(`║        ${fmt}          ║`);
          console.log(`╚══════════════════════════════╝`);
          console.log(`\n👉 WhatsApp → Linked Devices → Link with Phone Number\n`);
        } catch (err) { console.error(`❌ Pair error:`, err.message || err); }
      });
    }
    if (connection === "open") log(`✅ INFINITY V18 ONLINE`);
    if (connection === "close" && lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
      log(`🔄 Reconnecting...`);
      startBot();
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    for (const msg of messages) {
      try {
        if (!msg.message) continue;
        const chatId = msg.key.remoteJid;
        if (!chatId) continue;
        const isGroup = chatId.endsWith("@g.us");
        const sender  = isGroup ? (msg.key.participant || msg.participant) : msg.key.remoteJid;
        if (!sender) continue;
        const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";

        // /owner claim
        if (text.trim() === "/owner" && !isGroup) {
          if (OWNER_JID) {
            await sock.sendMessage(chatId, { text: "👑 Owner already claimed." }, { quoted: msg });
          } else {
            OWNER_JID = bare(sender); saveOwner();
            SUDO_USERS.add(bare(sender)); saveSudo();
            await sock.sendMessage(chatId, {
              text:
                "╔══════════════════════╗\n" +
                "║  👑  OWNER CLAIMED ✅  ║\n" +
                "╚══════════════════════╝\n\n" +
                `♾️ *INFINITY BOT V18*\n` +
                `Send ${PREFIX}help to see commands.`
            }, { quoted: msg });
            log(`👑 Owner: ${sender}`);
          }
          continue;
        }

        if (!text.startsWith(PREFIX)) continue;
        if (!isSudo(sender)) {
          await sock.sendMessage(chatId, { text: "Hat Garib 🤡🤬" }, { quoted: msg });
          continue;
        }

        const cmdName = text.slice(PREFIX.length).trim().split(/\s+/)[0].toLowerCase();

        // HELP
        if (["help","start","menu"].includes(cmdName)) {
          await sock.sendMessage(chatId, { text: getHelp(raidActivated.has(chatId)) }, { quoted: msg }); continue;
        }

        // PING
        if (isCmd(text, "ping")) {
          const t = Date.now();
          const s = await sock.sendMessage(chatId, { text: "🏓 Pinging..." }, { quoted: msg });
          await sock.sendMessage(chatId, { text: `🏓 Pong! *${Date.now() - t}ms*` }, { quoted: s }); continue;
        }

        // STATUS
        if (isCmd(text, "status")) {
          const tot = os.totalmem(), fr = os.freemem();
          const ctrl = _ncCtrl.get(chatId);
          await sock.sendMessage(chatId, {
            text:
              `📊 *INFINITY V18*\n━━━━━━━━━━━━━━━━━━━━━━━\n` +
              `> 💀 NC          : ${_ncPipes.has(chatId) ? "✅ ON" : "❌ Off"}\n` +
              `> 🔒 Name Lock   : ${_ncLocks.has(chatId) ? "✅ ON" : "❌ Off"}\n` +
              `> 💥 Spam        : ${spam_tasks.has(chatId) ? "✅ ON" : "❌ Off"}\n` +
              `> 😈 Domain Exp. : ${domain_tasks.has(chatId) ? "✅ ON" : "❌ Off"}\n` +
              `> ⚡ NC Speed    : ${ctrl ? ctrl.get() + "ms" : "—"}\n` +
              `━━━━━━━━━━━━━━━━━━━━━━━\n` +
              `> 💾 RAM  : ${((tot - fr) / 1024 / 1024).toFixed(0)}MB/${(tot / 1024 / 1024).toFixed(0)}MB\n` +
              `> ⏳ Up   : ${formatUptime(Date.now() - START_TIME)}\n` +
              `> 👑 Sudo : ${SUDO_USERS.size}`
          }, { quoted: msg }); continue;
        }

        // PREFIX
        if (isCmd(text, "prefix")) {
          const np = getArg(text).trim();
          if (!np) { await sock.sendMessage(chatId, { text: `⚠️ ${PREFIX}prefix <new>` }, { quoted: msg }); continue; }
          PREFIX = np; saveSettings();
          await sock.sendMessage(chatId, { text: `✅ Prefix: *${PREFIX}*` }, { quoted: msg }); continue;
        }

        // SUDO MANAGEMENT
        if (isCmd(text, "addsudo")) {
          if (!isOwner(sender)) { await sock.sendMessage(chatId, { text: "❌ Only Owner." }, { quoted: msg }); continue; }
          const ctx = msg.message?.extendedTextMessage?.contextInfo;
          if (!ctx?.participant) { await sock.sendMessage(chatId, { text: "⚠️ Reply to a user." }, { quoted: msg }); continue; }
          const uid = bare(ctx.participant); SUDO_USERS.add(uid); saveSudo();
          await sock.sendMessage(chatId, { text: `✅ Sudo: @${uid.split("@")[0]}` }, { quoted: msg, mentions: [ctx.participant] }); continue;
        }
        if (isCmd(text, "delsudo")) {
          if (!isOwner(sender)) { await sock.sendMessage(chatId, { text: "❌ Only Owner." }, { quoted: msg }); continue; }
          const ctx = msg.message?.extendedTextMessage?.contextInfo;
          if (!ctx?.participant) { await sock.sendMessage(chatId, { text: "⚠️ Reply to a user." }, { quoted: msg }); continue; }
          const uid = bare(ctx.participant); SUDO_USERS.delete(uid); saveSudo();
          await sock.sendMessage(chatId, { text: `🗑 Removed: @${uid.split("@")[0]}` }, { quoted: msg, mentions: [ctx.participant] }); continue;
        }
        if (isCmd(text, "listsudo")) {
          await sock.sendMessage(chatId, {
            text: `👑 *Sudo:*\n> ${[...SUDO_USERS].map(u => `@${u.split("@")[0]}`).join("\n> ") || "None"}`
          }, { quoted: msg }); continue;
        }
        if (isCmd(text, "addinfinitesudo")) {
          if (!isOwner(sender)) { await sock.sendMessage(chatId, { text: "❌ Only Owner." }, { quoted: msg }); continue; }
          const ctx = msg.message?.extendedTextMessage?.contextInfo;
          if (!ctx?.participant) { await sock.sendMessage(chatId, { text: "⚠️ Reply to a user." }, { quoted: msg }); continue; }
          const uid = bare(ctx.participant); INFINITESUDO_USERS.add(uid); saveInfiniteSudo();
          await sock.sendMessage(chatId, { text: `♾️ InfiniteSudo: @${uid.split("@")[0]}` }, { quoted: msg, mentions: [ctx.participant] }); continue;
        }
        if (isCmd(text, "delinfinitesudo")) {
          if (!isOwner(sender)) { await sock.sendMessage(chatId, { text: "❌ Only Owner." }, { quoted: msg }); continue; }
          const ctx = msg.message?.extendedTextMessage?.contextInfo;
          if (!ctx?.participant) { await sock.sendMessage(chatId, { text: "⚠️ Reply to a user." }, { quoted: msg }); continue; }
          const uid = bare(ctx.participant); INFINITESUDO_USERS.delete(uid); saveInfiniteSudo();
          await sock.sendMessage(chatId, { text: `🗑 Removed: @${uid.split("@")[0]}` }, { quoted: msg, mentions: [ctx.participant] }); continue;
        }

        // ACTIVATE / DEACTIVATE
        if (isCmd(text, "activateinfinity")) {
          raidActivated.add(chatId);
          await sock.sendMessage(chatId, {
            text: `🔓 *Infinity ACTIVATED*\n> NC, Namelock & Spam unlocked.\n> ${PREFIX}help to see all.`
          }, { quoted: msg }); continue;
        }
        if (isCmd(text, "deactivateinfinity")) {
          stopAll(chatId); raidActivated.delete(chatId);
          await sock.sendMessage(chatId, { text: `🔒 *Infinity DEACTIVATED*\n> All tasks stopped.` }, { quoted: msg }); continue;
        }

        // RAID GATE
        const RAID_CMDS = new Set([
          "gcnc","ncemo","ncbaap","infinity","infinityfast","infinitygodspeed","stopnc",
          "namelock","namelockemo","stopnamelock",
          "domainexpansion","domainexpansionncemo","domainexpansioninfinity","stopdomainexpansion",
          "spam","unspam","stopspam","stopall"
        ]);
        if (RAID_CMDS.has(cmdName) && !raidActivated.has(chatId)) {
          await sock.sendMessage(chatId, { text: `🔒 *Locked*\n> ${PREFIX}activateinfinity first.` }, { quoted: msg }); continue;
        }

        // ── NAME CHANGERS ──
        if (isCmd(text, "gcnc")) {
          const base = getArg(text);
          if (!base) { await sock.sendMessage(chatId, { text: `⚠️ ${PREFIX}gcnc <text>` }, { quoted: msg }); continue; }
          startGCNC(sock, chatId, base);
          await sock.sendMessage(chatId, { text: `💀 *GCNC ON* — ${base}` }, { quoted: msg }); continue;
        }
        if (isCmd(text, "ncemo")) {
          const base = getArg(text);
          if (!base) { await sock.sendMessage(chatId, { text: `⚠️ ${PREFIX}ncemo <text>` }, { quoted: msg }); continue; }
          startNCEMO(sock, chatId, base);
          await sock.sendMessage(chatId, { text: `🎭 *NCEMO ON* — ${base}` }, { quoted: msg }); continue;
        }
        if (isCmd(text, "ncbaap")) {
          const base = getArg(text);
          if (!base) { await sock.sendMessage(chatId, { text: `⚠️ ${PREFIX}ncbaap <text>` }, { quoted: msg }); continue; }
          startNCBAAP(sock, chatId, base);
          await sock.sendMessage(chatId, { text: `👑 *NCBAAP GOD MODE* — ${base}\n> ⚡ 20ms floor` }, { quoted: msg }); continue;
        }
        if (isCmd(text, "infinity")) {
          const base = getArg(text);
          if (!base) { await sock.sendMessage(chatId, { text: `⚠️ ${PREFIX}infinity <text>` }, { quoted: msg }); continue; }
          startInfinity(sock, chatId, base);
          await sock.sendMessage(chatId, { text: `♾️ *INFINITY ON* — ${base}` }, { quoted: msg }); continue;
        }
        if (isCmd(text, "infinityfast")) {
          const base = getArg(text);
          if (!base) { await sock.sendMessage(chatId, { text: `⚠️ ${PREFIX}infinityfast <text>` }, { quoted: msg }); continue; }
          startInfinityFast(sock, chatId, base);
          await sock.sendMessage(chatId, { text: `⚡ *INFINITY FAST* — ${base}` }, { quoted: msg }); continue;
        }
        if (isCmd(text, "infinitygodspeed")) {
          const base = getArg(text);
          if (!base) { await sock.sendMessage(chatId, { text: `⚠️ ${PREFIX}infinitygodspeed <text>` }, { quoted: msg }); continue; }
          startInfinityGodspeed(sock, chatId, base);
          await sock.sendMessage(chatId, { text: `😈 *GODSPEED* — ${base}\n> 💀 20ms absolute floor` }, { quoted: msg }); continue;
        }
        if (isCmd(text, "stopnc") || isCmd(text, "stopgcnc") || isCmd(text, "stopncemo") || isCmd(text, "stopncbaap") || isCmd(text, "stopinfinity")) {
          const ok = _stopNC(chatId);
          await sock.sendMessage(chatId, { text: ok ? "⏹ *NC Stopped*" : "❌ No active NC" }, { quoted: msg }); continue;
        }

        // ── NAME LOCK ──
        if (isCmd(text, "namelock")) {
          const base = getArg(text).trim();
          if (!base) {
            await sock.sendMessage(chatId, {
              text:
                `🔒 *NAME LOCK*\n━━━━━━━━━━━━━━━━━━━━━━━\n` +
                `> Cycles infinity emojis continuously\n` +
                `> Enemy changes name → instant 3x overwrite\n` +
                `> You will always be last 😈\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━\n` +
                `> ${PREFIX}namelock <text>`
            }, { quoted: msg }); continue;
          }
          startNameLock(sock, chatId, base, INFINITY_TEXTS);
          await sock.sendMessage(chatId, {
            text:
              `🔒 *NAME LOCK ON*\n` +
              `> 🎯 Base: *${base}*\n` +
              `> 🔄 Cycling INFINITY emojis\n` +
              `> ⚡ Enemy change → instant overwrite\n` +
              `> 😈 You will always be last`
          }, { quoted: msg }); continue;
        }
        if (isCmd(text, "namelockemo")) {
          const base = getArg(text).trim();
          if (!base) { await sock.sendMessage(chatId, { text: `⚠️ ${PREFIX}namelockemo <text>` }, { quoted: msg }); continue; }
          startNameLock(sock, chatId, base, NCEMO_EMOJIS);
          await sock.sendMessage(chatId, {
            text: `🔒 *NAME LOCK EMO ON*\n> 🎯 Base: *${base}*\n> 🔄 Cycling NCEMO emojis`
          }, { quoted: msg }); continue;
        }
        if (isCmd(text, "stopnamelock")) {
          const ok = stopNameLock(chatId);
          await sock.sendMessage(chatId, { text: ok ? "🔓 *Name Lock OFF*" : "❌ No active Name Lock" }, { quoted: msg }); continue;
        }

        // ── DOMAIN EXPANSION ──
        const domainMap = [
          ["domainexpansioninfinity", "infinity"],
          ["domainexpansionncemo",    "ncemo"],
          ["domainexpansion",         "gcnc"],
        ];
        let handled = false;
        for (const [cmd, mode] of domainMap) {
          if (isCmd(text, cmd)) {
            const base = getArg(text);
            if (!base) { await sock.sendMessage(chatId, { text: `⚠️ ${PREFIX}${cmd} <text>` }, { quoted: msg }); handled = true; break; }
            startDomainExpansion(sock, chatId, base, mode);
            const cap =
              `╔══════════════════════════════╗\n` +
              `║   😈  D O M A I N  E X P    ║\n` +
              `╚══════════════════════════════╝\n\n` +
              `  📛 Base : ${base}\n  ⚙️ Mode : ${mode.toUpperCase()}\n` +
              `  ◈ 3 pipelines ON\n  ◈ Watcher ON\n` +
              `  ➡ ${PREFIX}stopdomainexpansion`;
            try { await sock.sendMessage(chatId, { image: { url: DOMAIN_EXPANSION_IMAGE }, caption: cap }, { quoted: msg }); }
            catch { await sock.sendMessage(chatId, { text: cap }, { quoted: msg }); }
            handled = true; break;
          }
        }
        if (handled) continue;

        if (isCmd(text, "stopdomainexpansion")) {
          const ok = stopDomain(chatId);
          await sock.sendMessage(chatId, { text: ok ? "✅ *Domain Expansion LIFTED* ♾️" : "❌ No active Domain Expansion" }, { quoted: msg }); continue;
        }

        // ── SPAM ──
        if (isCmd(text, "spam")) {
          const st = getArg(text);
          if (!st) { await sock.sendMessage(chatId, { text: `⚠️ ${PREFIX}spam <text>` }, { quoted: msg }); continue; }
          startSpam(sock, chatId, st);
          await sock.sendMessage(chatId, { text: "💥 *SPAM ON*" }, { quoted: msg }); continue;
        }
        if (isCmd(text, "unspam") || isCmd(text, "stopspam")) {
          const ok = stopSpam(chatId);
          await sock.sendMessage(chatId, { text: ok ? "⏹ *Spam OFF*" : "❌ No active spam" }, { quoted: msg }); continue;
        }

        // STOP ALL
        if (isCmd(text, "stopall")) {
          stopAll(chatId);
          await sock.sendMessage(chatId, { text: "⏹ *ALL STOPPED* — NC, Namelock, Spam, Domain." }, { quoted: msg }); continue;
        }

      } catch (err) { log(`❌`, err?.message || err); }
    }
  });
}

/* ============ START ============ */
console.log(`\n╔══════════════════════════════════╗`);
console.log(`║   ♾️  INFINITY BOT V18           ║`);
console.log(`║      SOLO WARRIOR ENGINE         ║`);
console.log(`╚══════════════════════════════════╝\n`);
saveBotCount(1);
startBot();
