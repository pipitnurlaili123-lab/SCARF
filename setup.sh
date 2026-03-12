#!/bin/bash
# ♾️ INFINITY BOT V17 — One-Line Setup
# Run: bash setup.sh

set -e

echo ""
echo "╔══════════════════════════════════╗"
echo "║   ♾️  INFINITY BOT V17 SETUP     ║"
echo "║      SOLO WARRIOR ENGINE         ║"
echo "╚══════════════════════════════════╝"
echo ""

# ── 1. Check Node.js ──
if ! command -v node &> /dev/null; then
  echo "📦 Installing Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
else
  echo "✅ Node.js $(node -v) found"
fi

# ── 2. Create project folder ──
mkdir -p infinity-bot && cd infinity-bot

# ── 3. Write package.json ──
cat > package.json << 'EOF'
{
  "name": "infinity-bot",
  "version": "17.0.0",
  "type": "module",
  "scripts": {
    "start": "node infinity_bot_v17.js"
  },
  "dependencies": {
    "@whiskeysockets/baileys": "^6.7.9",
    "google-tts-api": "^2.0.2",
    "yt-search": "^2.10.4"
  }
}
EOF

# ── 4. Install dependencies ──
echo ""
echo "📦 Installing packages..."
npm install --silent

echo "✅ Packages installed"

# ── 5. Copy bot file if it exists next to setup.sh ──
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/infinity_bot_v17.js" ]; then
  cp "$SCRIPT_DIR/infinity_bot_v17.js" ./infinity_bot_v17.js
  echo "✅ Bot file copied"
else
  echo "⚠️  Put infinity_bot_v17.js in the same folder as setup.sh"
  echo "   Then run: node infinity_bot_v17.js"
  exit 1
fi

# ── 6. Create data folder ──
mkdir -p data

echo ""
echo "╔══════════════════════════════════╗"
echo "║   ✅  SETUP COMPLETE!            ║"
echo "╚══════════════════════════════════╝"
echo ""
echo "▶  Start the bot:"
echo "   cd infinity-bot && node infinity_bot_v17.js"
echo ""
echo "📱 Enter your WhatsApp number when asked"
echo "🔑 Enter the pair code in WhatsApp → Linked Devices"
echo ""
