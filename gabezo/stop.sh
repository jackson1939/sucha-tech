#!/usr/bin/env bash
# gabezo/stop.sh — Detiene todos los servicios del entorno Gabezo
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PID_FILE="$SCRIPT_DIR/gabezo.pids"
LOG_DIR="$SCRIPT_DIR/logs"
ARCHIVE="$LOG_DIR/archive-$(date +%Y%m%d_%H%M%S).tar.gz"

echo "========================================"
echo "  Vibe Broker — Gabezo STOP"
echo "========================================"

if [ -f "$PID_FILE" ]; then
  echo "[gabezo] Deteniendo procesos..."
  while read -r pid; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" && echo "  Detenido PID $pid" || echo "  No se pudo detener PID $pid"
    fi
  done < "$PID_FILE"
  rm -f "$PID_FILE"
else
  echo "[gabezo] No se encontró $PID_FILE — nada que detener"
fi

# Empaquetar logs
if ls "$LOG_DIR"/*.log 2>/dev/null | head -1 > /dev/null; then
  tar -czf "$ARCHIVE" -C "$LOG_DIR" . 2>/dev/null && \
    echo "[gabezo] Logs empaquetados en $ARCHIVE" || true
fi

echo ""
echo "========================================"
echo "  Gabezo detenido ✅"
echo "========================================"
