# Vibe Broker 🎙️
### El "Alexa" de las transacciones Web3 en Solana

> **Nota legal:** Prototipo educativo para hackathon. Todas las operaciones se realizan en Solana Devnet. No es asesoría financiera.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend + Backend | **Next.js 14** App Router — desplegado en Vercel |
| Base de datos | **Neon PostgreSQL** (integración nativa Vercel) |
| Orquestador DeFi | LI.FI (rutas cross-chain) |
| Voz | Web Speech API (ASR) + ElevenLabs TTS |
| On-chain | Solana Devnet + Anchor (Rust) RecordReceipt |
| Animaciones | GSAP 3 + ScrollTrigger |

## Desarrollo local

```bash
cp .env.example .env.local   # edita tus API keys
npm install
npm run dev                  # → http://localhost:3000
```

## Deploy en Vercel

```bash
npx vercel --prod
```
