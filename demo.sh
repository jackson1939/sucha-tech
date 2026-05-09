#!/usr/bin/env bash
set -e

echo "==============================="
echo "  Iniciando demo Vibe Broker   "
echo "==============================="

# Verificar dependencias
command -v node >/dev/null 2>&1 || { echo "Node.js requerido. Abortando."; exit 1; }
command -v npm  >/dev/null 2>&1 || { echo "npm requerido. Abortando."; exit 1; }

# Instalar y levantar backend
cd "$(dirname "$0")/backend"
echo "[1/3] Instalando dependencias del backend..."
npm install --silent

if [ ! -f .env ]; then
  cp .env.example .env
  echo "      Copiado .env.example → .env (edita tus API keys)"
fi

echo "[2/3] Levantando backend en puerto 4000..."
PORT=4000 npm run start &
BACKEND_PID=$!
echo "      Backend PID: $BACKEND_PID"

sleep 4

echo "[3/3] Verificando healthcheck..."
curl -sf http://localhost:4000/api/health || { echo "Backend no responde. Abortando."; kill $BACKEND_PID 2>/dev/null; exit 1; }

echo ""
echo "-------------------------------"
echo "  Smoke test: simular orden    "
echo "-------------------------------"
curl -s -X POST http://localhost:4000/api/orders/simulate \
  -H "Content-Type: application/json" \
  -d '{"text":"compra 0.1 SOL","userId":"demo"}' | (command -v jq >/dev/null 2>&1 && jq || cat)

echo ""
echo "==============================="
echo "  Demo listo!                  "
echo "  Backend PID: $BACKEND_PID    "
echo "  Para detener: kill $BACKEND_PID"
echo "==============================="

# Iniciar mobile (opcional)
cd ../mobile
if [ -d node_modules ] || command -v npx >/dev/null 2>&1; then
  echo ""
  echo "Iniciando Metro bundler para la app móvil..."
  npx react-native start &
fi

wait $BACKEND_PID
