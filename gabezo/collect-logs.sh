#!/usr/bin/env bash
# collect-logs.sh — Recolecta y empaqueta todos los logs de Gabezo
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BUNDLE="$LOG_DIR/gabezo-logs-$TIMESTAMP.tar.gz"

mkdir -p "$LOG_DIR"

echo "[collect-logs] Recolectando logs en $BUNDLE..."
tar -czf "$BUNDLE" \
  --ignore-failed-read \
  -C "$SCRIPT_DIR" \
  logs/ tmp/ 2>/dev/null || true

echo "[collect-logs] ✅ Bundle: $BUNDLE"
ls -lh "$BUNDLE"
