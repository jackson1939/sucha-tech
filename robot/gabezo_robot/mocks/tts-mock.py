from __future__ import annotations

import json
import logging
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any, Dict, List

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s [tts-mock-robot] %(message)s")
LOGGER = logging.getLogger(__name__)

SILENCE_MP3_BASE64 = (
    "SUQzAwAAAAAAFlRFTkMAAAAPAAADTGF2ZjU2LjM2LjEwMQAAAAAAAAAAAAAA//uQxAAADhAAACwAAAAAAAASW5mbwAAAA8AAAAFAAAArgD/"
    "///+5AAAAAAATGF2YzU2LjYwAAAAAAAAAAAAAAAAJAAAAAAAAAAAq4U+QAAAAAAAAAAAAAAAAAAAAAAA//uQxAADBQAAHkAAAAAAAACAAADSAAAAAEAAACs"
    "tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tA=="
)

TTS_LOGS: List[str] = []


def json_response(handler: BaseHTTPRequestHandler, status: int, payload: Dict[str, Any]) -> None:
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def parse_json_body(handler: BaseHTTPRequestHandler) -> Dict[str, Any]:
    length = int(handler.headers.get("Content-Length", "0"))
    if length <= 0:
        return {}
    raw = handler.rfile.read(length).decode("utf-8")
    try:
        data = json.loads(raw)
        return data if isinstance(data, dict) else {}
    except json.JSONDecodeError:
        return {}


class TtsMockHandler(BaseHTTPRequestHandler):
    def log_message(self, format: str, *args: Any) -> None:
        LOGGER.info("%s - %s", self.address_string(), format % args)

    def do_GET(self) -> None:  # noqa: N802
        if self.path == "/logs":
            json_response(self, HTTPStatus.OK, {"items": list(TTS_LOGS)})
            return
        json_response(self, HTTPStatus.NOT_FOUND, {"error": "not_found"})

    def do_POST(self) -> None:  # noqa: N802
        if self.path == "/api/voice/tts":
            payload = parse_json_body(self)
            text = str(payload.get("text", "")).strip()
            if text:
                TTS_LOGS.append(text)
            json_response(
                self,
                HTTPStatus.OK,
                {"audioUrl": f"data:audio/mp3;base64,{SILENCE_MP3_BASE64}"},
            )
            return

        if self.path == "/reset":
            TTS_LOGS.clear()
            json_response(self, HTTPStatus.OK, {"ok": True})
            return

        json_response(self, HTTPStatus.NOT_FOUND, {"error": "not_found"})


def main() -> None:
    server = ThreadingHTTPServer(("0.0.0.0", 4003), TtsMockHandler)
    LOGGER.info("tts-mock-robot listening on 0.0.0.0:4003")
    try:
        server.serve_forever(poll_interval=0.5)
    except KeyboardInterrupt:
        LOGGER.info("tts-mock-robot detenido por señal")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
