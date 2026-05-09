<<<<<<< HEAD
# Vibe Broker 🎙️
### El "Alexa" de las transacciones Web3

Asistente conversacional por voz y texto que orquesta swaps y bridges cross-chain en Solana con confirmaciones habladas. Construido con **Next.js 14** y desplegado en **Vercel**.

> **Nota legal:** Prototipo educativo. Todas las operaciones se realizan en Solana Devnet. No es asesoría financiera.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend + Backend | **Next.js 14** (App Router) — desplegado en Vercel |
| API Routes | `/app/api/*` — reemplazan Express, corren en Edge/Node en Vercel |
| Base de datos | **Neon PostgreSQL** (integración nativa Vercel) |
| Orquestador DeFi | LI.FI SDK (rutas cross-chain) |
| Voz | Web Speech API (ASR nativo) + ElevenLabs TTS |
| On-chain | Solana Devnet + Anchor (Rust) para RecordReceipt |
| Estilos | Tailwind CSS |

---

## Estructura del proyecto

```
vibe-broker/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Layout raíz (Navbar)
│   ├── page.tsx                # Página principal — voz + swap
│   ├── settings/page.tsx       # Ajustes de política voice-only
│   ├── history/page.tsx        # Historial de órdenes
│   └── api/                    # API Routes (backend serverless)
│       ├── health/route.ts
│       ├── orders/
│       │   ├── route.ts        # GET /api/orders (historial)
│       │   ├── simulate/route.ts
│       │   └── execute/route.ts
│       ├── users/[id]/settings/route.ts
│       └── voice/tts/route.ts
├── components/                 # Componentes React reutilizables
│   ├── ui/                     # Primitivos (Button, Card, Badge)
│   ├── VoiceButton.tsx
│   ├── SimulationCard.tsx
│   ├── ConfirmationModal.tsx
│   ├── DailyUsageBar.tsx
│   └── Navbar.tsx
├── lib/                        # Lógica del servidor (importable en API routes)
│   ├── db/                     # Pool PostgreSQL + migraciones
│   ├── services/               # intentParser, policyEvaluator, lifi, elevenlabs, solana
│   └── config/policies.json
├── types/index.ts              # Tipos TypeScript compartidos
├── __tests__/                  # Tests unitarios Jest
├── scripts/                    # migrate.js, test-apis.js
├── onchain/                    # Programa Anchor (Rust) — RecordReceipt
├── gabezo/                     # Entorno de pruebas controlado
├── next.config.ts
├── vercel.json
└── .env.example
```

---

## Despliegue en Vercel

### 1. Clonar e instalar
```bash
git clone https://github.com/tu-usuario/vibe-broker.git
cd vibe-broker
npm install
```

### 2. Configurar base de datos en Vercel
1. Ve a tu proyecto en **vercel.com → Storage → Create → Neon**
2. Conecta la base de datos — Vercel inyecta `DATABASE_URL` automáticamente
3. Corre las migraciones:
```bash
npx vercel env pull .env.local   # descarga las vars de Vercel a local
node scripts/migrate.js
```

### 3. Variables de entorno en Vercel
En **Settings → Environment Variables** agrega:

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Auto-inyectada por Neon |
| `LIFI_API_KEY` | Tu key de li.quest |
| `ELEVENLABS_API_KEY` | Tu key de ElevenLabs |
| `ELEVENLABS_VOICE_ID` | ID de la voz ElevenLabs |
| `SOLANA_RPC_URL` | `https://api.devnet.solana.com` |
| `RECEIPT_PROGRAM_ID` | Program ID del Anchor deploy |
| `VOICE_ONLY_MAX_PER_OP` | `0.1` |
| `VOICE_ONLY_DAILY_CAP` | `0.5` |
| `VOICE_CONFIDENCE_MIN` | `0.8` |

### 4. Deploy
```bash
npx vercel --prod
# o conecta el repo y Vercel hace deploy automático en cada push
```

---

## Desarrollo local

```bash
cp .env.example .env.local    # edita tus API keys
npm run dev                   # → http://localhost:3000

# Tests unitarios
npm test

# Validar API keys
node scripts/test-apis.js

# Migrar DB local
node scripts/migrate.js
```

---

## API Routes

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET  | `/api/health` | Healthcheck |
| POST | `/api/orders/simulate` | Parsear intención y simular ruta LI.FI |
| POST | `/api/orders/execute` | Propagar tx firmada a Solana |
| GET  | `/api/orders?userId=x` | Historial de órdenes |
| GET  | `/api/users/:id/settings` | Política del usuario |
| POST | `/api/users/:id/settings` | Actualizar política |
| POST | `/api/voice/tts` | Generar audio ElevenLabs |

---

## On-chain (Anchor)

```bash
cd onchain
anchor build
anchor deploy --provider.cluster devnet
# Copia el Program ID al .env: RECEIPT_PROGRAM_ID=...
```

---

## Entorno de pruebas Gabezo

```bash
chmod +x gabezo/start.sh gabezo/stop.sh gabezo/run_tests.sh
./gabezo/start.sh      # levanta backend + mocks
./gabezo/run_tests.sh  # ejecuta 7 test-cases
./gabezo/stop.sh       # apaga y empaqueta logs
```
=======
# sucha-tech
un asistente de solana
>>>>>>> 58c40ea5fc3d5fb96b1d6eac7fd786518b05f2d5
