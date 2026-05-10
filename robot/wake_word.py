from __future__ import annotations

import logging
import os
import time
from contextlib import suppress
from dataclasses import dataclass
from typing import Optional

import requests

LOGGER = logging.getLogger(__name__)


@dataclass
class WakeWordConfig:
    access_key: str
    wake_word: str = "Hey Broker"
    mock_url: Optional[str] = None
    wait_timeout_seconds: int = 30


class WakeWordDetector:
    def __init__(self, config: WakeWordConfig) -> None:
        self._config = config

    def wait_for_wake_word(self) -> bool:
        if self._config.mock_url:
            return self._wait_from_mock()
        return self._wait_from_microphone()

    def _wait_from_mock(self) -> bool:
        endpoint = f"{self._config.mock_url.rstrip('/')}/wait"
        try:
            response = requests.get(endpoint, timeout=self._config.wait_timeout_seconds + 2)
            response.raise_for_status()
            payload = response.json()
            triggered = bool(payload.get("triggered", False))
            LOGGER.info("Wake mock responded triggered=%s", triggered)
            return triggered
        except requests.RequestException as exc:
            LOGGER.error("No se pudo consultar wake mock: %s", exc)
            return False

    def _wait_from_microphone(self) -> bool:
        try:
            import pvporcupine  # pylint: disable=import-error
            from pvrecorder import PvRecorder  # pylint: disable=import-error
        except Exception as exc:  # pragma: no cover - depends on platform audio drivers
            LOGGER.error("No se pudieron importar librerías de wake word: %s", exc)
            return False

        porcupine = None
        recorder = None
        try:
            keyword = self._config.wake_word.strip().lower()
            builtin_keywords = {"alexa", "americano", "blueberry", "bumblebee", "computer", "grapefruit", "grasshopper", "hey google", "hey siri", "jarvis", "ok google", "picovoice", "porcupine", "terminator"}

            kwargs = {"access_key": self._config.access_key}
            if keyword in builtin_keywords:
                kwargs["keywords"] = [keyword]
            else:
                LOGGER.warning(
                    "Wake word '%s' no es built-in de Porcupine; se usará 'porcupine'. "
                    "Para producción define una keyword personalizada.",
                    self._config.wake_word,
                )
                kwargs["keywords"] = ["porcupine"]

            porcupine = pvporcupine.create(**kwargs)
            recorder = PvRecorder(device_index=-1, frame_length=porcupine.frame_length)
            recorder.start()
            LOGGER.info("Escuchando wake word...")

            start = time.time()
            while True:
                pcm = recorder.read()
                if porcupine.process(pcm) >= 0:
                    LOGGER.info("Wake word detectada")
                    return True

                if time.time() - start > self._config.wait_timeout_seconds:
                    LOGGER.debug("Timeout esperando wake word, reintentando loop principal")
                    return False
        except Exception as exc:  # pragma: no cover - hardware dependent
            LOGGER.error("Error en detector wake word: %s", exc)
            return False
        finally:
            if recorder is not None:
                with suppress(Exception):
                    recorder.stop()
                with suppress(Exception):
                    recorder.delete()
            if porcupine is not None:
                with suppress(Exception):
                    porcupine.delete()


def load_wake_word_config() -> WakeWordConfig:
    return WakeWordConfig(
        access_key=os.getenv("PICOVOICE_KEY", ""),
        wake_word=os.getenv("WAKE_WORD", "Hey Broker"),
        mock_url=os.getenv("WAKE_MOCK_URL"),
        wait_timeout_seconds=int(os.getenv("WAKE_WAIT_TIMEOUT_SECONDS", "30")),
    )
