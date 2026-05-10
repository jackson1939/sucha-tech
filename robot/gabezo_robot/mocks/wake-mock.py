from __future__ import annotations

import json
import logging
import threading
import time
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any, Dict

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s [wake-mock] %(message)s")
LOGGER = logging.getLogger(__name__)

STATE_LOCK = threading.Lock()
STATE_EVENT = threading.Event()
TRIGGERED = False


def json_response(handler: BaseHTTPRequestHandler, status: int, payload: Dict[str, Any]) -> None:
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


class WakeMockHandler(BaseHTTPRequestHandler):
    def log_message(self, format: str, *args: Any) -> None:
        LOGGER.info("%s - %s", self.address_string(), format % args)

    def do_GET(self) -> None:  # noqa: N802
        global TRIGGERED
        if self.path == "/status":
            with STATE_LOCK:
                value = TRIGGERED
            json_response(self, HTTPStatus.OK, {"triggered": value})
            return

        if self.path == "/wait":
            completed = STATE_EVENT.wait(timeout=30)
            with STATE_LOCK:
                value = TRIGGERED
                if completed and TRIGGERED:
                    TRIGGERED = False
                    STATE_EVENT.clear()
            json_response(self, HTTPStatus.OK, {"triggered": value})
            return

        json_response(self, HTTPStatus.NOT_FOUND, {"error": "not_found"})

    def do_POST(self) -> None:  # noqa: N802
        global TRIGGERED
        if self.path == "/trigger":
            with STATE_LOCK:
                TRIGGERED = True
                STATE_EVENT.set()
            json_response(self, HTTPStatus.OK, {"ok": True})
            return

        if self.path == "/reset":
            with STATE_LOCK:
                TRIGGERED = False
                STATE_EVENT.clear()
            json_response(self, HTTPStatus.OK, {"ok": True})
            return

        json_response(self, HTTPStatus.NOT_FOUND, {"error": "not_found"})


def main() -> None:
    server = ThreadingHTTPServer(("0.0.0.0", 4001), WakeMockHandler)
    LOGGER.info("wake-mock listening on 0.0.0.0:4001")
    try:
        server.serve_forever(poll_interval=0.5)
    except KeyboardInterrupt:
        LOGGER.info("wake-mock detenido por señal")
    finally:
        server.server_close()
        time.sleep(0.2)


if __name__ == "__main__":
    main()
