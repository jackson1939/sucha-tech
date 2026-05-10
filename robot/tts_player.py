from __future__ import annotations

import base64
import json
import logging
import os
import tempfile
from pathlib import Path
from typing import Any, Dict, Optional

import pygame
import requests

LOGGER = logging.getLogger(__name__)


class TTSPlayer:
    def __init__(self, api_base_url: str, disabled_playback: bool = False) -> None:
        self._api_base_url = api_base_url.rstrip("/")
        self._disabled_playback = disabled_playback
        self._pygame_ready = False

    def speak(self, text: str) -> bool:
        if not text.strip():
            LOGGER.warning("TTS recibió texto vacío")
            return False

        audio_bytes = self._fetch_tts_audio(text)
        if not audio_bytes:
            LOGGER.warning("Sin audio remoto, se usa fallback local: %s", text)
            return False

        if self._disabled_playback:
            LOGGER.info("Playback deshabilitado; texto narrado (mock): %s", text)
            return True

        return self._play_audio(audio_bytes)

    def _fetch_tts_audio(self, text: str) -> Optional[bytes]:
        endpoint = f"{self._api_base_url}/api/voice/tts"
        try:
            response = requests.post(endpoint, json={"text": text}, timeout=10)
            response.raise_for_status()
        except requests.RequestException as exc:
            LOGGER.error("Error llamando TTS backend: %s", exc)
            return None

        content_type = response.headers.get("Content-Type", "")
        if content_type.startswith("audio/"):
            return response.content

        data = self._parse_json_response(response.text)
        audio_url = str(data.get("audioUrl", "")).strip()
        if not audio_url:
            return None

        if audio_url.startswith("data:audio"):
            _, encoded = audio_url.split(",", 1)
            try:
                return base64.b64decode(encoded)
            except (ValueError, base64.binascii.Error) as exc:
                LOGGER.error("No se pudo decodificar data URL de TTS: %s", exc)
                return None

        try:
            audio_response = requests.get(audio_url, timeout=10)
            audio_response.raise_for_status()
            return audio_response.content
        except requests.RequestException as exc:
            LOGGER.error("No se pudo descargar audioUrl de TTS: %s", exc)
            return None

    @staticmethod
    def _parse_json_response(raw: str) -> Dict[str, Any]:
        try:
            parsed = json.loads(raw)
            return parsed if isinstance(parsed, dict) else {}
        except json.JSONDecodeError:
            return {}

    def _ensure_pygame(self) -> None:
        if self._pygame_ready:
            return

        if os.getenv("SDL_AUDIODRIVER") is None and os.getenv("PYGAME_HEADLESS", "").lower() == "true":
            os.environ["SDL_AUDIODRIVER"] = "dummy"

        pygame.mixer.init()
        self._pygame_ready = True

    def _play_audio(self, audio_bytes: bytes) -> bool:
        try:
            self._ensure_pygame()
            with tempfile.NamedTemporaryFile(prefix="vibebroker-", suffix=".mp3", delete=False) as tmp_file:
                tmp_file.write(audio_bytes)
                temp_path = Path(tmp_file.name)

            try:
                pygame.mixer.music.load(str(temp_path))
                pygame.mixer.music.play()
                while pygame.mixer.music.get_busy():
                    pygame.time.delay(100)
                return True
            finally:
                temp_path.unlink(missing_ok=True)
        except Exception as exc:  # pragma: no cover - depends on audio system
            LOGGER.error("No se pudo reproducir audio TTS: %s", exc)
            return False
