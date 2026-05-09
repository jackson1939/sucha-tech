/**
 * Solana RPC Mock — Gabezo
 * Responde a llamadas JSON-RPC básicas: getBalance, getLatestBlockhash, sendTransaction.
 */
const http = require("http");
const { randomBytes } = require("crypto");

const PORT = 8899;
const FAKE_BALANCE_LAMPORTS = 5_000_000_000; // 5 SOL

const server = http.createServer((req, res) => {
  if (req.method !== "POST") {
    return respond(res, 405, { error: "Method not allowed" });
  }

  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    let rpc;
    try {
      rpc = JSON.parse(body);
    } catch {
      return respond(res, 400, { error: "Invalid JSON" });
    }

    const { id = 1, method, params = [] } = rpc;

    switch (method) {
      case "getBalance":
        return respond(res, 200, {
          jsonrpc: "2.0", id,
          result: { context: { slot: 1 }, value: FAKE_BALANCE_LAMPORTS },
        });

      case "getLatestBlockhash":
        return respond(res, 200, {
          jsonrpc: "2.0", id,
          result: {
            context: { slot: 1 },
            value: {
              blockhash: randomBytes(32).toString("base64").slice(0, 44),
              lastValidBlockHeight: 999999,
            },
          },
        });

      case "sendTransaction":
        return respond(res, 200, {
          jsonrpc: "2.0", id,
          result: randomBytes(32).toString("base64").slice(0, 88),
        });

      case "getSignatureStatuses":
        return respond(res, 200, {
          jsonrpc: "2.0", id,
          result: {
            context: { slot: 1 },
            value: (params[0] ?? []).map(() => ({
              slot: 1, confirmations: 10, confirmationStatus: "confirmed", err: null,
            })),
          },
        });

      case "getAccountInfo":
        return respond(res, 200, {
          jsonrpc: "2.0", id,
          result: { context: { slot: 1 }, value: null },
        });

      default:
        console.warn(`[rpc-mock] Método no implementado: ${method}`);
        return respond(res, 200, { jsonrpc: "2.0", id, result: null });
    }
  });
});

function respond(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

server.listen(PORT, () => console.log(`[rpc-mock] Escuchando en puerto ${PORT}`));
