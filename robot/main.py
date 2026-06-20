from __future__ import annotations

import logging
import os
import time
from typing import Any, Dict

from dotenv import load_dotenv

from asr import SpeechTranscriber, load_asr_preset
from broker_client import BrokerClient
from confirm import listen_confirmation
from tts_player import TTSPlayer
from wake_word import WakeWordDetector, load_wake_word_config


def configure_logging() -> None:
    logging.basicConfig(
        level=getattr(logging, os.getenv("ROBOT_LOG_LEVEL", "INFO").upper(), logging.INFO),
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    )


def build_simulation_message(payload: Dict[str, Any]) -> str:
    intent = payload.get("intent", {})
    action = str(intent.get("action", "operación")).strip()
    amount = intent.get("amount", "0")
    token_to = intent.get("tokenTo", "token")
    return f"Simulación lista: {action} {amount} {token_to}. Di confirmar o cancelar."


def main() -> None:
    load_dotenv()
    configure_logging()
    logger = logging.getLogger("robot.main")

    api_base_url = os.getenv("API_BASE_URL", "http://localhost:3000")
    tts_base_url = os.getenv("TTS_BASE_URL", api_base_url)
    user_id = os.getenv("ROBOT_USER_ID", "demo")
    max_cycles = int(os.getenv("ROBOT_MAX_CYCLES", "0"))
    disable_audio = os.getenv("ROBOT_DISABLE_AUDIO_PLAYBACK", "false").lower() == "true"

    wake_detector = WakeWordDetector(load_wake_word_config())
    transcriber = SpeechTranscriber(mock_url=os.getenv("ASR_MOCK_URL"))
    broker = BrokerClient(api_base_url=api_base_url, user_id=user_id)
    tts = TTSPlayer(api_base_url=tts_base_url, disabled_playback=disable_audio)

    asr_preset = load_asr_preset("ASR_PRESET")
    confirm_preset = load_asr_preset("ASR_CONFIRM_PRESET")
    cycles = 0

    logger.info("Robot v3 iniciado. API=%s wakeWord=%s", api_base_url, os.getenv("WAKE_WORD", "Hey Broker"))

    while True:
        if max_cycles > 0 and cycles >= max_cycles:
            logger.info("Se alcanzó ROBOT_MAX_CYCLES=%s. Saliendo.", max_cycles)
            break

        logger.info("Esperando wake word...")
        if not wake_detector.wait_for_wake_word():
            time.sleep(0.2)
            continue

        logger.info("Wake detectada. Beep/LED virtual activado.")
        transcript = transcriber.transcribe(duration_seconds=5, preset=asr_preset)
        if not transcript.text:
            tts.speak("No te escuché bien. Intenta de nuevo.")
            cycles += 1
            continue

        simulation = broker.simulate_order(transcript=transcript.text, asr_confidence=transcript.confidence or 0.92)
        if not simulation.ok:
            tts.speak(simulation.error_message or "No pude simular la orden")
            cycles += 1
            continue

        sim_payload = simulation.payload
        tts.speak(build_simulation_message(sim_payload))

        if bool(sim_payload.get("requiresDoubleConfirmation", False)):
            tts.speak("Operación bloqueada, usa el móvil")
            cycles += 1
            continue

        confirmation = listen_confirmation(transcriber, preset=confirm_preset)
        if confirmation != "confirmar":
            tts.speak("Operación cancelada")
            cycles += 1
            continue

        simulation_id = str(sim_payload.get("simulationId", "")).strip()
        if not simulation_id:
            logger.error("Simulación sin simulationId, no se puede ejecutar")
            tts.speak("No pude ejecutar la operación")
            cycles += 1
            continue

        execution = broker.execute_order(simulation_id=simulation_id, transcript=transcript.text)
        if execution.ok and execution.payload.get("status") == "submitted":
            tts.speak("Operación enviada")
        else:
            tts.speak(execution.error_message or "No pude ejecutar la operación")

        cycles += 1


if __name__ == "__main__":
    main()
