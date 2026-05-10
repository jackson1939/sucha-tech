# 🎙️ Vibe Broker

> **El "Alexa" de las transacciones Web3** — asistente conversacional por voz y texto que orquesta swaps y bridges cross-chain en Solana con confirmaciones habladas.

![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?logo=solana)
![LI.FI](https://img.shields.io/badge/LI.FI-Bridge%20%26%20Swap-00C2FF)
![ElevenLabs](https://img.shields.io/badge/ElevenLabs-TTS-orange)
![Next.js](https://img.shields.io/badge/Next.js-14-black)

---

## ¿Qué es?

Vibe Broker permite a usuarios novatos interactuar con DeFi usando voz o texto natural. Di "compra 0.1 SOL" y el sistema parsea la intención, consulta la ruta óptima en LI.FI, narra la simulación con ElevenLabs y ejecuta firmando localmente — todo sin tocar una sola UI compleja.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend + Backend | Next.js 14 (App Router), Tailwind CSS, GSAP |
| Orquestador | LI.FI SDK — rutas cross-chain + fallback mock |
| Voz entrada | Web Speech API (ASR nativo, interimResults en tiempo real) |
| Voz salida | ElevenLabs TTS (`eleven_multilingual_v2`) |
| On-chain | Solana Devnet, Anchor (`RecordReceipt`) |
| Base de datos | PostgreSQL (Neon en producción) |
| Test env | Gabezo: mocks LI.FI + RPC + TTS proxy |
| Animaciones | GSAP 3 + ScrollTrigger + ParticleCanvas |

---

## Quick start (local)

```bash
git clone https://github.com/jackson1939/sucha-tech.git
cd sucha-tech
npm install
cp .env.example .env.local    # rellenar claves — ver sección Variables
npm run dev                   # → http://localhost:3000
```

### Variables de entorno

```bash
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_NETWORK=devnet
RECEIPT_PROGRAM_ID=YourAnchorProgramIdHere
NEXT_PUBLIC_SOLANA_NETWORK=devnet

LIFI_API_KEY=YOUR_LIFI_KEY           # sin clave: usa mock automático
ELEVENLABS_API_KEY=YOUR_KEY          # sin clave: TTS silencioso
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL

DATABASE_URL=postgres://user:pass@host/vibebroker?sslmode=require

VOICE_CONFIDENCE_MIN=0.8
VOICE_ONLY_MAX_PER_OP=0.1
VOICE_ONLY_DAILY_CAP=0.5
SESSION_KEYS_ALLOWED=false
```

### Despliegue en Vercel

1. Importar repo en [vercel.com](https://vercel.com)
2. Agregar Neon PostgreSQL desde Storage → Connect
3. Copiar `DATABASE_URL` generado por Neon
4. Configurar las demás variables en Settings → Environment Variables
5. `node scripts/migrate.js` para inicializar las tablas

---

## Endpoints API

| Método | Ruta | Descripción |
|---|---|---|
| `GET`  | `/api/health` | Healthcheck |
| `POST` | `/api/orders/simulate` | Parsea intención → LI.FI quote → política |
| `POST` | `/api/orders/execute` | Propaga tx firmada → DB → recibo |
| `GET`  | `/api/orders` | Historial de órdenes del usuario |
| `POST` | `/api/voice/tts` | Síntesis ElevenLabs |
| `GET`  | `/api/users/:id/settings` | Política de voz del usuario |
| `POST` | `/api/users/:id/settings` | Actualizar política |

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
2. Dice: **"compra 0.05 SOL"** → transcripción en tiempo real mientras habla
3. ASR transcribe → backend parsea intent → LI.FI devuelve ruta óptima
4. ElevenLabs narra: *"Vas a comprar 0.05 SOL. Di confirmar."*
5. Micro se activa automáticamente → usuario dice "confirmar"
6. Cliente firma localmente → backend propaga tx a Devnet
7. Anchor registra recibo → app muestra TX hash

### Política de confirmación

| Condición | Flujo |
|---|---|
| Monto ≤ 0.1 SOL + confianza ≥ 0.8 | Voice-only — solo voz |
| Monto > 0.1 SOL o confianza < 0.8 | Double — voz + PIN/passkey |

---

## Tests

```bash
npm test              # Jest: intentParser + policyEvaluator (16 tests)
node scripts/test-apis.js   # Verifica claves LI.FI y ElevenLabs
```

### Entorno Gabezo

```bash
./gabezo/start.sh      # levanta backend + mocks
./gabezo/run_tests.sh  # ejecuta 7 test cases
./gabezo/stop.sh       # apaga y empaqueta logs
```

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

---

## Estructura del proyecto

```
/
├── app/                    Next.js App Router
│   ├── (public)/           Landing + Login (sin navbar)
│   ├── (dashboard)/        App con navbar (dashboard/*)
│   └── api/                API Routes serverless
├── backend/
│   ├── services/           intentParser, lifi, elevenlabs, solana, policyEvaluator
│   ├── db/                 pool PostgreSQL + migrations
│   └── config/policies.json
├── frontend/
│   ├── components/         VoiceButton, SimulationCard, ConfirmationModal...
│   ├── hooks/              useSimulate, useExecute, useSpeech, useVoiceSettings
│   └── styles/             globals.css (design system dark/light)
├── onchain/                Anchor program (Rust)
├── gabezo/                 Entorno de pruebas con mocks
├── scripts/                migrate.js, test-apis.js
└── types/                  Tipos TypeScript compartidos
```

> **Nota legal:** Prototipo educativo para hackathon. Todas las operaciones se realizan en Solana Devnet. No es asesoría financiera.
