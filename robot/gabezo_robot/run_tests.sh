#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/robot/gabezo_robot/docker-compose.yml"
LOG_DIR="$ROOT_DIR/robot/gabezo_robot/logs"
REPORT="$LOG_DIR/robot-test-report-$(date +%Y%m%d_%H%M%S).txt"
PASS=0
FAIL=0

mkdir -p "$LOG_DIR"

log() { echo "$1" | tee -a "$REPORT"; }

check() {
  local tc="$1" name="$2" cmd="$3"
  if eval "$cmd"; then
    log "  ✅ $tc — $name"
    PASS=$((PASS + 1))
  else
    log "  ❌ $tc — $name"
    FAIL=$((FAIL + 1))
  fi
}

run_robot_once() {
  local tc="$1"
  local api_url="$2"
  local asr_sequence="$3"

  curl -s -X POST "http://localhost:4003/reset" >/dev/null || true
  curl -s -X POST "http://localhost:4001/reset" >/dev/null || true
  curl -s -X POST "http://localhost:4002/reset" >/dev/null || true
  curl -s -X POST "http://localhost:4002/sequence" \
    -H "Content-Type: application/json" \
    -d "{\"presets\":$asr_sequence}" >/dev/null

  (
    cd "$ROOT_DIR/robot"
    python -m pip install -q -r requirements.txt >/dev/null
    API_BASE_URL="$api_url" \
    TTS_BASE_URL="http://localhost:4003" \
    WAKE_MOCK_URL="http://localhost:4001" \
    ASR_MOCK_URL="http://localhost:4002" \
    ROBOT_DISABLE_AUDIO_PLAYBACK="true" \
    ROBOT_MAX_CYCLES="1" \
    ROBOT_LOG_LEVEL="INFO" \
    python main.py
  ) >"$LOG_DIR/$tc.log" 2>&1 &
  local robot_pid=$!

  sleep 1
  curl -s -X POST "http://localhost:4001/trigger" >/dev/null

  wait "$robot_pid"
}

orders_count() {
  docker compose -f "$COMPOSE_FILE" exec -T postgres \
    psql -U vibebroker -d vibebroker -t -A -c "SELECT count(*) FROM orders;" | tr -d '\r'
}

wait_backend() {
  local tries=0
  until curl -sf "http://localhost:3000/api/health" >/dev/null; do
    tries=$((tries + 1))
    if [ "$tries" -gt 60 ]; then
      log "No levantó backend en tiempo esperado"
      return 1
    fi
    sleep 2
  done
  return 0
}

log "========================================"
log "  Vibe Broker Robot v3 — Gabezo Tests"
log "  $(date)"
log "========================================"

log ""
log "Levantando entorno docker..."
docker compose -f "$COMPOSE_FILE" down -v >/dev/null 2>&1 || true
docker compose -f "$COMPOSE_FILE" up -d --build
wait_backend

BASE_ORDERS="$(orders_count)"
log "Órdenes iniciales en DB: $BASE_ORDERS"

log ""
log "── RBT-01: Happy path ──"
run_robot_once "RBT-01" "http://localhost:3000" "[\"happy_path\",\"confirm\"]"
AFTER_RBT01="$(orders_count)"
RBT01_DIFF=$((AFTER_RBT01 - BASE_ORDERS))
check "RBT-01a" "se envía operación" "curl -s http://localhost:4003/logs | rg -q 'Operación enviada'"
check "RBT-01b" "DB incrementa órdenes" "[ \"$RBT01_DIFF\" -ge 1 ]"

log ""
log "── RBT-02: Intención desconocida ──"
BEFORE_RBT02="$(orders_count)"
run_robot_once "RBT-02" "http://localhost:3000" "[\"unknown\"]"
AFTER_RBT02="$(orders_count)"
check "RBT-02a" "narra no entendí" "curl -s http://localhost:4003/logs | rg -q 'No entendí, intenta de nuevo'"
check "RBT-02b" "sin ejecución" "[ \"$AFTER_RBT02\" -eq \"$BEFORE_RBT02\" ]"

log ""
log "── RBT-03: Baja confianza ASR ──"
BEFORE_RBT03="$(orders_count)"
run_robot_once "RBT-03" "http://localhost:3000" "[\"low_conf\"]"
AFTER_RBT03="$(orders_count)"
check "RBT-03a" "narra usa el móvil" "curl -s http://localhost:4003/logs | rg -q 'Operación bloqueada, usa el móvil'"
check "RBT-03b" "sin ejecución" "[ \"$AFTER_RBT03\" -eq \"$BEFORE_RBT03\" ]"

log ""
log "── RBT-04: Red caída ──"
run_robot_once "RBT-04" "http://localhost:3999" "[\"happy_path\"]"
check "RBT-04" "narra sin conexión" "curl -s http://localhost:4003/logs | rg -q 'Sin conexión, verifica tu red'"

log ""
log "── RBT-05: Cancelación ──"
BEFORE_RBT05="$(orders_count)"
run_robot_once "RBT-05" "http://localhost:3000" "[\"happy_path\",\"cancel\"]"
AFTER_RBT05="$(orders_count)"
check "RBT-05a" "narra operación cancelada" "curl -s http://localhost:4003/logs | rg -q 'Operación cancelada'"
check "RBT-05b" "sin ejecución" "[ \"$AFTER_RBT05\" -eq \"$BEFORE_RBT05\" ]"

log ""
docker compose -f "$COMPOSE_FILE" down -v >/dev/null 2>&1 || true

log "========================================"
log "Resultado robot: $PASS PASS | $FAIL FAIL"
log "Reporte: $REPORT"
log "========================================"

[ "$FAIL" -eq 0 ]
