'use client';

import { useCallback, useRef, useEffect } from 'react';

/**
 * useSpeech — TTS con dos niveles:
 * 1. Web Speech API (nativo, instantáneo, sin costo) — siempre disponible
 * 2. ElevenLabs via /api/voice/tts (premium, voz realista) — si API key configurada
 *
 * La app habla automáticamente al mostrar simulaciones y al confirmar/rechazar.
 */
export function useSpeech() {
  const audioRef   = useRef<HTMLAudioElement | null>(null);
  const isSpeaking = useRef(false);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).speechSynthesis?.cancel();
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    };
  }, []);

  /** Para todo audio en curso */
  const stop = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).speechSynthesis?.cancel();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    isSpeaking.current = false;
  }, []);

  /**
   * Habla con Web Speech API (navegador).
   * Prioriza voces en español si están disponibles.
   */
  const speakNative = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const synth = typeof window !== 'undefined' ? (window as any).speechSynthesis : null;
      if (!synth) { resolve(); return; }

      synth.cancel();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const utterance    = new (window as any).SpeechSynthesisUtterance(text);
      utterance.lang     = 'es-MX';
      utterance.rate     = 0.92;
      utterance.pitch    = 1.0;
      utterance.volume   = 1.0;

      // Buscar la mejor voz en español disponible
      const loadVoices = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const voices   = synth.getVoices() as any[];
        const priorities = ['es-MX', 'es-US', 'es-ES', 'es'];
        let best: unknown;
        for (const lang of priorities) {
          best = voices.find((v) => v.lang === lang && !v.name.includes('compact'));
          if (best) break;
        }
        if (!best) best = voices.find((v: { lang: string }) => v.lang.startsWith('es'));
        if (best) utterance.voice = best;
      };

      // Chrome carga voces async
      if (synth.getVoices().length) {
        loadVoices();
      } else {
        synth.addEventListener('voiceschanged', loadVoices, { once: true });
      }

      utterance.onend   = () => { isSpeaking.current = false; resolve(); };
      utterance.onerror = () => { isSpeaking.current = false; resolve(); };

      isSpeaking.current = true;
      synth.speak(utterance);
    });
  }, []);

  /**
   * Habla con ElevenLabs (premium).
   * Si el servidor no tiene API key, cae a Web Speech API.
   */
  const speakElevenLabs = useCallback(async (text: string): Promise<void> => {
    try {
      const res = await fetch('/api/voice/tts', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ text }),
      });

      // Si devolvió JSON (modo mock), usar Web Speech
      const ct = res.headers.get('Content-Type') ?? '';
      if (!res.ok || !ct.includes('audio/mpeg')) {
        await speakNative(text);
        return;
      }

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      return new Promise((resolve) => {
        audio.onended = () => { URL.revokeObjectURL(url); isSpeaking.current = false; resolve(); };
        audio.onerror = () => { speakNative(text).then(resolve); };
        isSpeaking.current = true;
        audio.play().catch(() => { speakNative(text).then(resolve); });
      });
    } catch {
      await speakNative(text);
    }
  }, [speakNative]);

  /**
   * Punto de entrada principal.
   * Intenta ElevenLabs primero; si falla o no hay key, usa Web Speech.
   */
  const speak = useCallback(async (text: string, useElevenLabs = true) => {
    stop();
    if (useElevenLabs) {
      await speakElevenLabs(text);
    } else {
      await speakNative(text);
    }
  }, [stop, speakElevenLabs, speakNative]);

  // Frases predefinidas para cada momento del flujo
  const phrases = {
    onSimulated: (from: string, to: string, amount: string, double: boolean) =>
      double
        ? `Vas a convertir ${amount} ${from} a ${to}. Por seguridad, esta operación requiere confirmación adicional.`
        : `Vas a convertir ${amount} ${from} a ${to}. ¿Quieres confirmar esta transacción?`,
    onConfirming:  () => 'Procesando tu operación en la red de Solana...',
    onSuccess:     () => 'Operación completada con éxito. Tu recibo quedó registrado en la blockchain.',
    onError:       (msg: string) => `Hubo un problema: ${msg}. Por favor intenta de nuevo.`,
    onListening:   () => 'Te escucho, di tu orden.',
    onDoubleConf:  () => 'Ingresa tu PIN y presiona firmar para continuar.',
    onBalanceAsk:  () => 'Consultando tu saldo en Solana Devnet.',
  };

  return { speak, stop, phrases };
}
