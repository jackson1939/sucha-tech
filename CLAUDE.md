# Vibe Broker — Contexto del proyecto para Claude

## ¿Qué es?

Asistente conversacional por voz y texto que permite a usuarios novatos interactuar con DeFi en Solana sin tocar una UI compleja. El usuario dice "compra 0.05 SOL" y el sistema parsea la intención, consulta la ruta óptima en LI.FI, narra la simulación con ElevenLabs y ejecuta firmando localmente.

**Hackathon:** Dev3pack Global — pista Solana
**Tracks activos:** Solana · LI.FI · ElevenLabs · Virtuals · Solana Mobile

---

## Las 3 interfaces (visión completa)

| Interface | Estado | Tech |
|---|---|---|
| Web admin (este PR) | ✅ MVP | Next.js 14, Tailwind, GSAP |
| Mobile app (v2) | Roadmap | React Native + Solana Mobile SDK |
| Robot/Alexa (v3) | Roadmap | ElevenLabs bidireccional + Raspberry Pi |

**Importante:** La web NO ejecuta operaciones directamente — es el panel admin y demo. Las operaciones reales van en la app móvil (v2). La web funciona como demo mobile-first (max-width 480px) en el browser.

---

## Objetivos del MVP (web, este PR)

1. **Voz de entrada** — Web Speech API (ASR nativo), sin dependencias externas
2. **Parseo de intención** — regex en español/inglés (sin ML externo, ElevenLabs cubre TTS)
3. **Routing cross-chain** — LI.FI SDK con fallback automático a mock si falla
4. **Voz de salida** — ElevenLabs TTS (`eleven_multilingual_v2`)
5. **Confirmación por política** — voice-only si monto ≤ 0.1 SOL y confianza ≥ 0.8, sino doble confirmación
6. **Recibo on-chain** — Anchor `RecordReceipt` en Solana Devnet
7. **Historial** — PostgreSQL (Neon en prod)

---

## Lo que NO se hace en el MVP

- No HuggingFace — ElevenLabs cubre TTS, el regex parser es suficiente
- No ML propio para ASR — Web Speech API es suficiente
- No operaciones reales en mainnet — todo en Devnet
- No wallet custodial — non-custodial + passkey

---

## Arquitectura

```
Next.js 14 (puerto 3000)
├── app/api/orders/simulate   → parseIntent → policyEvaluator → LI.FI
├── app/api/orders/execute    → broadcastTx → DB → update daily limit
├── app/api/orders            → GET historial
├── app/api/voice/tts         → ElevenLabs TTS
├── app/api/users/[id]/settings
└── app/api/health

Docker Gabezo (test env)
├── backend  (Next.js, 3000)
├── postgres (5432)
├── lifi-mock (3001)   — con /gabezo/fail-next y /gabezo/timeout-next
├── rpc-mock  (8899)
└── tts-proxy (3002)
```

---

## Política de confirmación

| Condición | Flujo |
|---|---|
| Monto ≤ 0.1 SOL + confianza ASR ≥ 0.8 | Voice-only — solo voz |
| Monto > 0.1 SOL o confianza < 0.8 | Double — voz + PIN/passkey |

Variables configurables en `.env`: `VOICE_CONFIDENCE_MIN`, `VOICE_ONLY_MAX_PER_OP`, `VOICE_ONLY_DAILY_CAP`

---

## Competencia (validado con Colosseum Copilot)

Cluster v1-c22 "AI-Powered Solana DeFi Assistants" — 270 proyectos, 11 ganadores.
HeySolana y Lexana AI son competencia directa pero no ganaron premios.

**Ventajas diferenciadoras:**
- LI.FI cross-chain routing (ningún competidor lo tiene)
- ElevenLabs TTS (voz de salida real)
- Anchor receipt on-chain (trazabilidad)
- Política voice-only configurable

---

## Comandos clave

```bash
npm install          # instalar dependencias
npm run dev          # → http://localhost:3000
npm test             # Jest: intentParser + policyEvaluator (16 tests)

# Docker Gabezo (entorno de pruebas)
docker compose -f docker-compose.gabezo.yml up -d
bash gabezo/run_tests.sh   # 7 test cases
docker compose -f docker-compose.gabezo.yml down
```

---

## Estado del PR

**PR:** https://github.com/jackson1939/sucha-tech/pull/1
**Rama:** `claude/happy-blackwell-b47cbb` → `main`

Archivos clave modificados en el PR:
- `backend/Dockerfile.dev` — creado (faltaba)
- `docker-compose.gabezo.yml` — puerto, healthcheck, variables
- `gabezo/run_tests.sh` — TC-02, TC-05, TC-06 implementados
- `backend/services/intentParser.ts` — manejo de "de", comas, verbos españoles
- `frontend/components/VoiceButton.tsx` — transcripción en tiempo real, countdown ring, auto-stop
- `app/layout.tsx` — favicon SVG
- `README.md` — reescrito sin conflictos de merge

---

## Variables de entorno necesarias

```bash
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_NETWORK=devnet
RECEIPT_PROGRAM_ID=DLUY5F8d4TtRxWXgJQMXH7hhaDTDbnqtkZsVbWDtMsYx
NEXT_PUBLIC_SOLANA_NETWORK=devnet
SOLANA_SIGNER_KEYPAIR=<array JSON>
EXPO_PUBLIC_API_BASE_URL=https://sucha-tech.vercel.app
LIFI_API_KEY=YOUR_LIFI_KEY           # sin clave: mock automático
ELEVENLABS_API_KEY=YOUR_KEY
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL
DATABASE_URL=postgres://user:pass@host/vibebroker?sslmode=require
VOICE_CONFIDENCE_MIN=0.8
VOICE_ONLY_MAX_PER_OP=0.1
VOICE_ONLY_DAILY_CAP=0.5
```
