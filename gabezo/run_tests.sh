#!/usr/bin/env bash
# run_tests.sh — Ejecuta los test-cases de Gabezo y genera reporte
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:4000}"
LOG_DIR="$(dirname "$0")/logs"
REPORT="$LOG_DIR/test-report-$(date +%Y%m%d_%H%M%S).txt"
PASS=0
FAIL=0

mkdir -p "$LOG_DIR"

log() { echo "$1" | tee -a "$REPORT"; }

log "========================================"
log "  Vibe Broker — Gabezo Test Suite"
log "  $(date)"
log "  Base URL: $BASE_URL"
log "========================================"

check() {
  local tc="$1" name="$2" expected_status="$3" body="$4" path="$5"
  local actual_status actual_body

  actual_body=$(curl -s -o /tmp/vb_resp.json -w "%{http_code}" \
    -X POST "$BASE_URL$path" \
    -H "Content-Type: application/json" \
    -d "$body" 2>/dev/null) || actual_body="000"
  actual_status="$actual_body"
  actual_body=$(cat /tmp/vb_resp.json 2>/dev/null || echo "{}")

  if [ "$actual_status" = "$expected_status" ]; then
    log "  ✅ $tc — $name"
    PASS=$((PASS + 1))
  else
    log "  ❌ $tc — $name  (esperado $expected_status, recibido $actual_status)"
    log "     Body: $(echo "$actual_body" | head -c 200)"
    FAIL=$((FAIL + 1))
  fi
}

# ── Healthcheck ──────────────────────────────────────────────────────────────
log ""
log "── Healthcheck ──"
HC=$(curl -sf "$BASE_URL/api/health" -o /dev/null -w "%{http_code}" 2>/dev/null || echo "000")
if [ "$HC" = "200" ]; then log "  ✅ /api/health OK"; PASS=$((PASS+1));
else log "  ❌ /api/health FAIL ($HC)"; FAIL=$((FAIL+1)); fi

# ── TC-01 Happy Path ─────────────────────────────────────────────────────────
log ""
log "── TC-01: Happy Path voice-only ──"
SIM=$(curl -s -X POST "$BASE_URL/api/orders/simulate" \
  -H "Content-Type: application/json" \
  -d '{"text":"compra 0.05 SOL","userId":"demo","asrConfidence":0.95}')
SIM_ID=$(echo "$SIM" | grep -o '"simulationId":"[^"]*"' | cut -d'"' -f4 || echo "")
REQUIRES=$(echo "$SIM" | grep -o '"requiresDoubleConfirmation":[^,}]*' | cut -d: -f2 | tr -d ' ')

if [ "$REQUIRES" = "false" ] && [ -n "$SIM_ID" ]; then log "  ✅ TC-01a simulate OK"; PASS=$((PASS+1));
else log "  ❌ TC-01a simulate FAIL (requiresDouble=$REQUIRES simId=$SIM_ID)"; FAIL=$((FAIL+1)); fi

if [ -n "$SIM_ID" ]; then
  EXEC=$(curl -s -X POST "$BASE_URL/api/orders/execute" \
    -H "Content-Type: application/json" \
    -d "{\"simulationId\":\"$SIM_ID\",\"userId\":\"demo\",\"confirmation\":{\"type\":\"voice\",\"signature\":\"ZGVtby1zaWduYXR1cmUtZGV2bmV0\"}}")
  STATUS=$(echo "$EXEC" | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "")
  if [ "$STATUS" = "submitted" ]; then log "  ✅ TC-01b execute OK"; PASS=$((PASS+1));
  else log "  ❌ TC-01b execute FAIL (status=$STATUS)"; FAIL=$((FAIL+1)); fi
fi

# ── TC-03 ASR baja confianza ──────────────────────────────────────────────────
log ""
log "── TC-03: ASR baja confianza → doble confirmación ──"
check "TC-03" "simulate con confianza 0.65" "200" \
  '{"text":"compra 0.05 SOL","userId":"demo","asrConfidence":0.65}' \
  "/api/orders/simulate"
DBLCONF=$(curl -s -X POST "$BASE_URL/api/orders/simulate" \
  -H "Content-Type: application/json" \
  -d '{"text":"compra 0.05 SOL","userId":"demo","asrConfidence":0.65}' | \
  grep -o '"requiresDoubleConfirmation":true' || echo "")
if [ -n "$DBLCONF" ]; then log "  ✅ TC-03b requiresDoubleConfirmation=true OK"; PASS=$((PASS+1));
else log "  ❌ TC-03b requiresDoubleConfirmation no es true"; FAIL=$((FAIL+1)); fi

# ── TC-04 Signature vacía ─────────────────────────────────────────────────────
log ""
log "── TC-04: Signature vacía → 400 ──"
check "TC-04" "execute sin signature" "400" \
  '{"simulationId":"fake","userId":"demo","confirmation":{"type":"voice","signature":""}}' \
  "/api/orders/execute"

# ── TC-07 Intención desconocida ───────────────────────────────────────────────
log ""
log "── TC-07: Intención desconocida → 422 ──"
check "TC-07" "texto sin intención" "422" \
  '{"text":"hola qué tal","userId":"demo"}' \
  "/api/orders/simulate"

# ── Resumen ──────────────────────────────────────────────────────────────────
log ""
log "========================================"
log "  Resultado: $PASS PASS  |  $FAIL FAIL"
log "  Reporte:   $REPORT"
log "========================================"

[ "$FAIL" -eq 0 ]
