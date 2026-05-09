#!/usr/bin/env bash
# gabezo/start.sh — Levanta el entorno de pruebas Gabezo
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$SCRIPT_DIR/logs"
PID_FILE="$SCRIPT_DIR/gabezo.pids"

mkdir -p "$LOG_DIR" "$SCRIPT_DIR/tmp/tts"

echo "========================================"
echo "  Vibe Broker — Gabezo START"
echo "========================================"

# Matar procesos anteriores si existen
if [ -f "$PID_FILE" ]; then
  echo "[gabezo] Limpiando procesos anteriores..."
  while read -r pid; do
    kill "$pid" 2>/dev/null || true
  done < "$PID_FILE"
  rm -f "$PID_FILE"
fi

# ── 1. Mock LI.FI ────────────────────────────────────────────────────────────
echo "[gabezo] Iniciando LI.FI mock (puerto 3001)..."
node "$SCRIPT_DIR/mocks/lifi-mock.js" > "$LOG_DIR/lifi-mock.log" 2>&1 &
echo $! >> "$PID_FILE"
sleep 1

# ── 2. Mock RPC Solana ────────────────────────────────────────────────────────
echo "[gabezo] Iniciando RPC mock (puerto 8899)..."
node "$SCRIPT_DIR/mocks/rpc-mock.js" > "$LOG_DIR/rpc-mock.log" 2>&1 &
echo $! >> "$PID_FILE"
sleep 1

# ── 3. TTS Proxy ─────────────────────────────────────────────────────────────
echo "[gabezo] Iniciando TTS proxy (puerto 3002)..."
ELEVENLABS_API_KEY="${ELEVENLABS_API_KEY:-mock}" \
node "$SCRIPT_DIR/mocks/tts-proxy.js" > "$LOG_DIR/tts-proxy.log" 2>&1 &
echo $! >> "$PID_FILE"
sleep 1

# ── 4. Backend ────────────────────────────────────────────────────────────────
echo "[gabezo] Iniciando backend (puerto 4000)..."
cd "$ROOT_DIR/backend"
[ ! -f .env ] && cp .env.example .env
export LIFI_API_KEY=mock
export ELEVENLABS_API_KEY=mock
export SOLANA_RPC_URL=http://localhost:8899
export PORT=4000
export NODE_ENV=test

npm install --silent 2>/dev/null
npm run start > "$LOG_DIR/backend.log" 2>&1 &
echo $! >> "$PID_FILE"

echo "[gabezo] Esperando que el backend arranque..."
for i in $(seq 1 15); do
  if curl -sf http://localhost:4000/api/health > /dev/null 2>&1; then
    echo "[gabezo] ✅ Backend listo"
    break
  fi
  sleep 1
  if [ "$i" -eq 15 ]; then
    echo "[gabezo] ❌ Backend no respondió. Revisa logs/backend.log"
    exit 1
  fi
done

# ── 5. Warm-up ────────────────────────────────────────────────────────────────
echo "[gabezo] Warm-up: cacheando quotes y TTS..."
curl -sf -X POST http://localhost:4000/api/orders/simulate \
  -H "Content-Type: application/json" \
  -d '{"text":"compra 0.1 SOL","userId":"demo"}' > /dev/null 2>&1 || true

curl -sf -X POST http://localhost:4000/api/voice/tts \
  -H "Content-Type: application/json" \
  -d '{"scriptKey":"voice_only_eligible"}' > "$SCRIPT_DIR/tmp/tts.mp3" 2>/dev/null || true

echo ""
echo "========================================"
echo "  Gabezo listo 🚀"
echo "  Backend:   http://localhost:4000"
echo "  LI.FI:     http://localhost:3001"
echo "  RPC:       http://localhost:8899"
echo "  TTS Proxy: http://localhost:3002"
echo "  PIDs:      $PID_FILE"
echo "  Logs:      $LOG_DIR/"
echo ""
echo "  Para ejecutar tests: ./gabezo/run_tests.sh"
echo "  Para detener:        ./gabezo/stop.sh"
echo "========================================"
