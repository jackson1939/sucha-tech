from __future__ import annotations

import json
import logging
from collections import deque
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any, Deque, Dict
from urllib.parse import parse_qs, urlparse

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s [asr-mock] %(message)s")
LOGGER = logging.getLogger(__name__)

PRESETS: Dict[str, Dict[str, Any]] = {
    "happy_path": {"text": "compra 0.05 SOL", "confidence": 0.95},
    "low_conf": {"text": "compra 0.05 SOL", "confidence": 0.65},
    "unknown": {"text": "hola qué tal", "confidence": 0.90},
    "confirm": {"text": "confirmar", "confidence": 0.98},
    "cancel": {"text": "cancelar", "confidence": 0.97},
}
ACTIVE_PRESET = "happy_path"
SEQUENCE: Deque[str] = deque()


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


class AsrMockHandler(BaseHTTPRequestHandler):
    def log_message(self, format: str, *args: Any) -> None:
        LOGGER.info("%s - %s", self.address_string(), format % args)

    def do_GET(self) -> None:  # noqa: N802
        global ACTIVE_PRESET
        parsed = urlparse(self.path)
        if parsed.path == "/transcribe":
            params = parse_qs(parsed.query)
            preset = params.get("preset", [None])[0]
            if not preset:
                preset = SEQUENCE.popleft() if SEQUENCE else ACTIVE_PRESET
            data = PRESETS.get(preset, PRESETS["unknown"])
            json_response(self, HTTPStatus.OK, data)
            return

        if parsed.path == "/status":
            json_response(self, HTTPStatus.OK, {"activePreset": ACTIVE_PRESET, "pendingSequence": list(SEQUENCE)})
            return

        json_response(self, HTTPStatus.NOT_FOUND, {"error": "not_found"})

    def do_POST(self) -> None:  # noqa: N802
        global ACTIVE_PRESET
        if self.path == "/preset":
            payload = parse_json_body(self)
            preset = str(payload.get("preset", "")).strip()
            if preset not in PRESETS:
                json_response(self, HTTPStatus.BAD_REQUEST, {"error": "invalid_preset"})
                return
            ACTIVE_PRESET = preset
            SEQUENCE.clear()
            json_response(self, HTTPStatus.OK, {"ok": True, "activePreset": ACTIVE_PRESET})
            return

        if self.path == "/sequence":
            payload = parse_json_body(self)
            presets = payload.get("presets", [])
            if not isinstance(presets, list) or any(item not in PRESETS for item in presets):
                json_response(self, HTTPStatus.BAD_REQUEST, {"error": "invalid_sequence"})
                return
            SEQUENCE.clear()
            for item in presets:
                SEQUENCE.append(item)
            json_response(self, HTTPStatus.OK, {"ok": True, "pendingSequence": list(SEQUENCE)})
            return

        if self.path == "/reset":
            ACTIVE_PRESET = "happy_path"
            SEQUENCE.clear()
            json_response(self, HTTPStatus.OK, {"ok": True})
            return

        json_response(self, HTTPStatus.NOT_FOUND, {"error": "not_found"})


def main() -> None:
    server = ThreadingHTTPServer(("0.0.0.0", 4002), AsrMockHandler)
    LOGGER.info("asr-mock listening on 0.0.0.0:4002")
    try:
        server.serve_forever(poll_interval=0.5)
    except KeyboardInterrupt:
        LOGGER.info("asr-mock detenido por señal")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
