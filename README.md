# 🎙️ Vibe Broker

> **El "Alexa" de las transacciones Web3** — asistente conversacional por voz y texto que orquesta swaps y bridges cross-chain en Solana con confirmaciones habladas.

![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?logo=solana)
![LI.FI](https://img.shields.io/badge/LI.FI-Bridge%20%26%20Swap-00C2FF)
![ElevenLabs](https://img.shields.io/badge/ElevenLabs-TTS-orange)
![Virtuals](https://img.shields.io/badge/Virtuals-AI%20Agent-blueviolet)
![Solana Mobile](https://img.shields.io/badge/Solana%20Mobile-Ready-9945FF)

---

## ¿Qué es?

Vibe Broker permite a usuarios novatos interactuar con DeFi usando voz o texto natural. Di "compra 0.1 SOL" y el sistema parsea la intención, consulta la ruta óptima en LI.FI, narra la simulación con ElevenLabs y ejecuta firmando localmente — todo sin tocar una sola UI compleja.

### Por qué gana frente a proyectos similares

| Característica | Vibe Broker | HeySolana | Lexana AI |
|---|---|---|---|
| LI.FI cross-chain routing | ✅ | ❌ | ❌ |
| ElevenLabs TTS (voz de salida) | ✅ | ❌ | ❌ |
| Anchor receipt on-chain | ✅ | ❌ | ❌ |
| Política configurable (voice-only) | ✅ | ❌ | ❌ |
| Non-custodial + passkey | ✅ | ✅ | ✅ |

---

## Las 3 interfaces

```
🌐 Web (este PR)     Next.js 14, admin + historial + configuración de política
📱 Mobile (v2)       React Native + Solana Mobile SDK + Wallet Adapter
🤖 Robot (v3)        ElevenLabs bidireccional + wake word + Raspberry Pi
```

La web actual es mobile-first (max-width 480px, bottom nav, touch) — funciona perfectamente desde el browser del móvil mientras llega la app nativa.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 14 (App Router), Tailwind CSS, GSAP |
| Backend | Next.js API Routes, TypeScript |
| Orquestador | LI.FI SDK — rutas cross-chain + fallback mock |
| Voz entrada | Web Speech API (ASR nativo) |
| Voz salida | ElevenLabs TTS (`eleven_multilingual_v2`) |
| On-chain | Solana Devnet, Anchor (`RecordReceipt`) |
| Base de datos | PostgreSQL (Neon en producción) |
| Test env | Docker Gabezo (mocks LI.FI + RPC + TTS proxy) |

---

## Quick start (local)

```bash
git clone https://github.com/jackson1939/sucha-tech.git
cd sucha-tech
npm install
cp .env.example .env      # rellenar claves — ver sección Variables
npm run dev               # → http://localhost:3000
```

### Variables de entorno

```bash
PORT=3000
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_NETWORK=devnet
RECEIPT_PROGRAM_ID=DLUY5F8d4TtRxWXgJQMXH7hhaDTDbnqtkZsVbWDtMsYx
NEXT_PUBLIC_SOLANA_NETWORK=devnet
SOLANA_SIGNER_KEYPAIR=<array JSON>

LIFI_API_KEY=YOUR_LIFI_KEY           # sin clave: usa mock automático
ELEVENLABS_API_KEY=YOUR_KEY          # sin clave: TTS silencioso
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL

LLM_API_KEY=YOUR_LLM_KEY             # opcional
DATABASE_URL=postgres://user:pass@host/vibebroker?sslmode=require

VOICE_CONFIDENCE_MIN=0.8
VOICE_ONLY_MAX_PER_OP=0.1
VOICE_ONLY_DAILY_CAP=0.5
SESSION_KEYS_ALLOWED=false
```

### Despliegue en Vercel

1. Importar repo en [vercel.com](https://vercel.com)
2. Agregar Neon PostgreSQL desde Storage → Connect
3. Copiar `DATABASE_URL` generado
4. Configurar las demás variables en Settings → Environment Variables
5. `npm run db:migrate` para inicializar la base de datos

---

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/health` | Healthcheck |
| `POST` | `/api/orders/simulate` | Parsea intención → LI.FI quote → política |
| `POST` | `/api/orders/execute` | Propaga tx firmada → DB → recibo |
| `GET` | `/api/orders` | Historial de órdenes del usuario |
| `POST` | `/api/voice/tts` | Síntesis ElevenLabs |
| `GET` | `/api/users/:id/settings` | Política de voz del usuario |
| `POST` | `/api/users/:id/settings` | Actualizar política |

### Ejemplo rápido

```bash
# Simular orden
curl -X POST http://localhost:3000/api/orders/simulate \
  -H "Content-Type: application/json" \
  -d '{"text":"compra 0.05 SOL","userId":"demo","asrConfidence":0.95}' | jq

# Healthcheck
curl http://localhost:3000/api/health
```

---

## Flujo principal (Happy Path)

1. Usuario abre la app y toca el botón de voz
2. Dice: **"compra 0.05 SOL"**
3. ASR transcribe → backend parsea intent → LI.FI devuelve ruta óptima
4. ElevenLabs narra: *"Vas a comprar 0.05 SOL. Estimado fees 0.0003 SOL. Di confirmar."*
5. Usuario dice "confirmar" → cliente firma localmente
6. Backend propaga tx a Devnet → Anchor registra recibo
7. App muestra TX hash + recibo on-chain

### Política de confirmación

| Condición | Flujo |
|---|---|
| Monto ≤ 0.1 SOL + confianza ≥ 0.8 | Voice-only — solo voz |
| Monto > 0.1 SOL o confianza < 0.8 | Double — voz + PIN/passkey |

---

## Tests

```bash
npm test                  # Jest: intentParser + policyEvaluator
npm run test:apis         # Verifica claves LI.FI y ElevenLabs
```

### Entorno Gabezo (Docker)

Laboratorio controlado con mocks de LI.FI, Solana RPC y TTS proxy:

```bash
# Levantar entorno
docker compose -f docker-compose.gabezo.yml up -d

# Ejecutar suite completa (7 test cases)
bash gabezo/run_tests.sh

# Ver logs y apagar
bash gabezo/collect-logs.sh
docker compose -f docker-compose.gabezo.yml down
```

**Test cases:**

| TC | Escenario |
|---|---|
| TC-01 | Happy Path completo (simulate + execute) |
| TC-02 | LI.FI timeout → fallback mock automático |
| TC-03 | ASR confianza baja → doble confirmación |
| TC-04 | Signature vacía → 400 |
| TC-05 | Stress: 10 requests concurrentes |
| TC-06 | LI.FI 503 → fallback mock |
| TC-07 | Intención desconocida → 422 |

---

## On-chain (Anchor)

```bash
cd onchain
anchor build
anchor deploy --provider.cluster devnet
# Copiar program ID → RECEIPT_PROGRAM_ID en .env
```

El programa `RecordReceipt` registra cada operación con: `simulation_id`, `amount_lamports`, `token_from`, `token_to`, `confirmation_type`, `timestamp`. Emite evento `ReceiptRecorded` visible en Solana Explorer.

Programa verificable en Solana Explorer:
https://explorer.solana.com/address/DLUY5F8d4TtRxWXgJQMXH7hhaDTDbnqtkZsVbWDtMsYx?cluster=devnet

---

## Estructura del proyecto

```
/
├── app/                    Next.js App Router
│   ├── api/orders/         simulate, execute, historial
│   ├── api/voice/tts/      ElevenLabs endpoint
│   ├── api/users/[id]/     settings de política
│   └── (pages)/            home, history, settings
├── backend/
│   ├── services/           intentParser, lifi, elevenlabs, solana, policyEvaluator
│   ├── db/                 pool PostgreSQL + migrations
│   └── config/policies.json
├── frontend/
│   ├── components/         VoiceButton, SimulationCard, ConfirmationModal...
│   └── hooks/              useSimulate, useExecute, useSpeech
├── onchain/                Anchor program (Rust)
├── gabezo/                 Entorno de pruebas Docker
│   └── mocks/              lifi-mock, rpc-mock, tts-proxy
└── __tests__/              Jest: intentParser + policyEvaluator
```

---

## Roadmap

- **v1 (este PR):** Web app, Solana Devnet, LI.FI mock + real, ElevenLabs TTS
- **v2:** React Native + Solana Mobile SDK (track Solana Mobile)
- **v3:** Robot físico con wake word + ElevenLabs bidireccional (track ElevenLabs)
- **Virtuals:** Integración con G.A.M.E framework para agente DeFi autónomo

---

> ⚠️ **Nota legal:** Vibe Broker es un prototipo educativo. Las operaciones por defecto se realizan en Solana Devnet y no representan valor financiero real. No es asesoría financiera.
