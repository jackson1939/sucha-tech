/**
 * TTS Proxy — Gabezo
 * Cachea respuestas de ElevenLabs para evitar llamadas repetidas durante las pruebas.
 * Si no hay API key, devuelve un MP3 vacío.
 */
const http  = require("http");
const https = require("https");
const fs    = require("fs");
const path  = require("path");
const crypto = require("crypto");

const PORT      = 3002;
const CACHE_DIR = path.join(__dirname, "tmp", "tts");
const VOICE_ID  = process.env.ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL";
const API_KEY   = process.env.ELEVENLABS_API_KEY   || "";

if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

const server = http.createServer((req, res) => {
  if (req.method !== "POST" || req.url !== "/tts") {
    res.writeHead(404);
    return res.end();
  }

  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    let text = "";
    try { text = JSON.parse(body).text || ""; } catch { text = body; }

    const key      = crypto.createHash("sha256").update(`${VOICE_ID}:${text}`).digest("hex");
    const filePath = path.join(CACHE_DIR, `${key}.mp3`);

    if (fs.existsSync(filePath)) {
      console.log(`[tts-proxy] Cache HIT: ${text.slice(0, 30)}...`);
      const data = fs.readFileSync(filePath);
      res.writeHead(200, { "Content-Type": "audio/mpeg", "Content-Length": data.length, "X-Cache": "HIT" });
      return res.end(data);
    }

    if (!API_KEY || API_KEY === "mock") {
      console.warn("[tts-proxy] Sin API key — devolviendo audio vacío");
      res.writeHead(200, { "Content-Type": "audio/mpeg", "X-Cache": "MOCK" });
      return res.end(Buffer.alloc(0));
    }

    const payload = JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    });

    const options = {
      hostname: "api.elevenlabs.io",
      path: `/v1/text-to-speech/${VOICE_ID}`,
      method: "POST",
      headers: {
        "xi-api-key": API_KEY,
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    const upstream = https.request(options, (upRes) => {
      const chunks = [];
      upRes.on("data", (c) => chunks.push(c));
      upRes.on("end", () => {
        const data = Buffer.concat(chunks);
        fs.writeFileSync(filePath, data);
        console.log(`[tts-proxy] Cache MISS → guardado: ${key}.mp3`);
        res.writeHead(200, { "Content-Type": "audio/mpeg", "Content-Length": data.length, "X-Cache": "MISS" });
        res.end(data);
      });
    });

    upstream.on("error", (err) => {
      console.error("[tts-proxy] Error ElevenLabs:", err.message);
      res.writeHead(502);
      res.end();
    });

    upstream.write(payload);
    upstream.end();
  });
});

server.listen(PORT, () => console.log(`[tts-proxy] Escuchando en puerto ${PORT}`));
