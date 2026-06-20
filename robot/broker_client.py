from __future__ import annotations

import hashlib
import logging
from dataclasses import dataclass
from typing import Any, Dict, Optional

import requests

LOGGER = logging.getLogger(__name__)

REQUEST_TIMEOUT_SECONDS = 10


@dataclass
class BrokerResponse:
    ok: bool
    payload: Dict[str, Any]
    error_message: Optional[str] = None


class BrokerClient:
    def __init__(self, api_base_url: str, user_id: str = "demo") -> None:
        self._api_base_url = api_base_url.rstrip("/")
        self._user_id = user_id

    def simulate_order(self, transcript: str, asr_confidence: float) -> BrokerResponse:
        endpoint = f"{self._api_base_url}/api/orders/simulate"
        payload = {"text": transcript, "userId": self._user_id, "asrConfidence": asr_confidence}
        try:
            response = requests.post(endpoint, json=payload, timeout=REQUEST_TIMEOUT_SECONDS)
        except requests.RequestException as exc:
            LOGGER.error("Error de red en /simulate: %s", exc)
            return BrokerResponse(ok=False, payload={}, error_message="Sin conexión, verifica tu red")

        data = self._safe_json(response)
        if response.status_code == 422 and data.get("code") == "UNKNOWN_INTENT":
            return BrokerResponse(ok=False, payload=data, error_message="No entendí, intenta de nuevo")
        if response.status_code >= 400:
            code = data.get("code", "UNKNOWN_ERROR")
            LOGGER.warning("Error de backend en /simulate status=%s code=%s", response.status_code, code)
            return BrokerResponse(ok=False, payload=data, error_message=f"No pude simular la orden ({code})")

        return BrokerResponse(ok=True, payload=data)

    def execute_order(self, simulation_id: str, transcript: str) -> BrokerResponse:
        endpoint = f"{self._api_base_url}/api/orders/execute"
        signature = build_signature(simulation_id, transcript)
        payload = {
            "simulationId": simulation_id,
            "userId": self._user_id,
            "confirmation": {"type": "voice", "signature": signature},
        }

        try:
            response = requests.post(endpoint, json=payload, timeout=REQUEST_TIMEOUT_SECONDS)
        except requests.RequestException as exc:
            LOGGER.error("Error de red en /execute: %s", exc)
            return BrokerResponse(ok=False, payload={}, error_message="Sin conexión, verifica tu red")

        data = self._safe_json(response)
        if response.status_code >= 400:
            code = data.get("code", "UNKNOWN_ERROR")
            LOGGER.warning("Error de backend en /execute status=%s code=%s", response.status_code, code)
            return BrokerResponse(ok=False, payload=data, error_message=f"No pude ejecutar la orden ({code})")
        return BrokerResponse(ok=True, payload=data)

    @staticmethod
    def _safe_json(response: requests.Response) -> Dict[str, Any]:
        try:
            data = response.json()
            return data if isinstance(data, dict) else {}
        except ValueError:
            return {}


def build_signature(simulation_id: str, transcript: str) -> str:
    digest = hashlib.sha256(f"{simulation_id}{transcript}".encode("utf-8")).hexdigest()
    return digest
