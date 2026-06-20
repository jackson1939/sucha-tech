from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from typing import Optional

import requests
import speech_recognition as sr

LOGGER = logging.getLogger(__name__)


@dataclass
class TranscriptResult:
    text: str
    confidence: float


class SpeechTranscriber:
    def __init__(self, mock_url: Optional[str] = None, language: str = "es-ES") -> None:
        self._mock_url = mock_url
        self._language = language
        self._recognizer = sr.Recognizer()

    def transcribe(self, duration_seconds: int = 5, preset: Optional[str] = None) -> TranscriptResult:
        if self._mock_url:
            return self._transcribe_from_mock(preset)
        return self._transcribe_from_microphone(duration_seconds)

    def _transcribe_from_mock(self, preset: Optional[str]) -> TranscriptResult:
        endpoint = f"{self._mock_url.rstrip('/')}/transcribe"
        params = {"preset": preset} if preset else None
        try:
            response = requests.get(endpoint, params=params, timeout=10)
            response.raise_for_status()
            payload = response.json()
            text = str(payload.get("text", "")).strip()
            confidence = float(payload.get("confidence", 0.0))
            LOGGER.info("ASR mock devolvió '%s' (conf=%.2f)", text, confidence)
            return TranscriptResult(text=text, confidence=confidence)
        except (requests.RequestException, ValueError) as exc:
            LOGGER.error("Error consultando ASR mock: %s", exc)
            return TranscriptResult(text="", confidence=0.0)

    def _transcribe_from_microphone(self, duration_seconds: int) -> TranscriptResult:
        try:
            with sr.Microphone() as source:
                self._recognizer.adjust_for_ambient_noise(source, duration=0.5)
                audio = self._recognizer.listen(source, timeout=duration_seconds, phrase_time_limit=duration_seconds)
        except Exception as exc:  # pragma: no cover - hardware dependent
            LOGGER.error("No se pudo capturar audio para ASR: %s", exc)
            return TranscriptResult(text="", confidence=0.0)

        try:
            raw = self._recognizer.recognize_google(audio, language=self._language, show_all=True)
            if not isinstance(raw, dict):
                text = str(raw).strip() if raw else ""
                return TranscriptResult(text=text, confidence=0.90 if text else 0.0)

            alternatives = raw.get("alternative", [])
            if not alternatives:
                return TranscriptResult(text="", confidence=0.0)

            primary = alternatives[0]
            text = str(primary.get("transcript", "")).strip()
            confidence = float(primary.get("confidence", 0.90 if text else 0.0))
            LOGGER.info("ASR detectó '%s' (conf=%.2f)", text, confidence)
            return TranscriptResult(text=text, confidence=confidence)
        except sr.UnknownValueError:
            LOGGER.warning("ASR no pudo entender el audio")
            return TranscriptResult(text="", confidence=0.0)
        except sr.RequestError as exc:
            LOGGER.error("Fallo del servicio de reconocimiento: %s", exc)
            return TranscriptResult(text="", confidence=0.0)


def load_asr_preset(key: str) -> Optional[str]:
    value = os.getenv(key, "").strip()
    return value if value else None
