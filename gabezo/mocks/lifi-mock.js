/**
 * LI.FI Mock Server — Gabezo
 * Simula el endpoint /v1/quote con latencia configurable y fallos controlados.
 */
const http = require("http");

const PORT = 3001;
let requestCount = 0;
let failNext = false;
let simulateTimeout = false;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  requestCount++;

  // Control hooks para tests
  if (url.pathname === "/gabezo/fail-next") {
    failNext = true;
    return respond(res, 200, { ok: true, mode: "fail-next" });
  }
  if (url.pathname === "/gabezo/timeout-next") {
    simulateTimeout = true;
    return respond(res, 200, { ok: true, mode: "timeout-next" });
  }
  if (url.pathname === "/gabezo/reset") {
    failNext = false;
    simulateTimeout = false;
    requestCount = 0;
    return respond(res, 200, { ok: true, requestCount });
  }
  if (url.pathname === "/gabezo/stats") {
    return respond(res, 200, { requestCount, failNext, simulateTimeout });
  }

  // Fallo simulado
  if (failNext) {
    failNext = false;
    return respond(res, 503, { error: "LI.FI temporarily unavailable (mock)" });
  }

  // Timeout simulado (8 001 ms para disparar el timeout del backend)
  if (simulateTimeout) {
    simulateTimeout = false;
    return setTimeout(() => respond(res, 200, {}), 8001);
  }

  // Quote mock normal
  if (url.pathname === "/v1/quote") {
    const fromToken = url.searchParams.get("fromToken") || "USDC";
    const toToken   = url.searchParams.get("toToken")   || "SOL";
    const amount    = parseFloat(url.searchParams.get("fromAmount") || "100000") / 1e6;

    return respond(res, 200, {
      routeId:          `mock-route-${Date.now()}`,
      fromToken,
      toToken,
      fromAmount:       String(amount),
      estimatedReceive: String((amount * 0.98).toFixed(6)),
      toAmountMin:      String((amount * 0.975).toFixed(6)),
      executionDuration: 28,
      feeCosts:  [{ name: "Protocol Fee", amountUSD: "0.02" }],
      gasCosts:  [{ amountUSD: "0.05" }],
      transactionRequest: {
        to:       "MockLifiRouter1111111111111111111111111111",
        data:     "0xmockdata",
        value:    "0",
        gasPrice: "1000000000",
        gasLimit: "200000",
      },
    });
  }

  if (url.pathname === "/v1/chains") {
    return respond(res, 200, { chains: [{ id: "SOL", name: "Solana" }, { id: "ETH", name: "Ethereum" }] });
  }

  respond(res, 404, { error: "Not found" });
});

function respond(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

server.listen(PORT, () => console.log(`[lifi-mock] Escuchando en puerto ${PORT}`));
