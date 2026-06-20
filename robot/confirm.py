from __future__ import annotations

import logging
from typing import Literal, Optional

from asr import SpeechTranscriber

LOGGER = logging.getLogger(__name__)

Confirmation = Literal["confirmar", "cancelar", "desconocido"]


def listen_confirmation(transcriber: SpeechTranscriber, preset: Optional[str] = None) -> Confirmation:
    result = transcriber.transcribe(duration_seconds=4, preset=preset)
    normalized = result.text.strip().lower()
    if "confirm" in normalized:
        LOGGER.info("Usuario confirmó operación por voz")
        return "confirmar"
    if "cancel" in normalized:
        LOGGER.info("Usuario canceló operación por voz")
        return "cancelar"

    LOGGER.warning("Respuesta de confirmación no reconocida: '%s'", result.text)
    return "desconocido"
