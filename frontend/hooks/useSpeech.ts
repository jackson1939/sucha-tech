'use client';

import { useCallback, useRef, useEffect } from 'react';
import type { VoiceConfig } from './useVoiceSettings';

export interface SpeechHandle {
  speak:            (text: string, useElevenLabs?: boolean) => Promise<void>;
  speakThenListen:  (text: string, startListening: () => void) => Promise<void>;
  stop:             () => void;
  isSpeaking:       () => boolean;
}

/**
 * useSpeech — TTS dual:
 * 1. Web Speech API  (nativo, gratuito, instantáneo)
 * 2. ElevenLabs      (premium, voz realista) si hay API key
 *
 * speakThenListen(): habla y cuando TERMINA activa el micrófono automáticamente.
 */
export function useSpeech(voiceConfig?: VoiceConfig): SpeechHandle {
  const audioRef    = useRef<HTMLAudioElement | null>(null);
  const speakingRef = useRef(false);

  useEffect(() => {
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).speechSynthesis?.cancel();
      audioRef.current?.pause();
    };
  }, []);

  const stop = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).speechSynthesis?.cancel();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    speakingRef.current = false;
  }, []);

  const isSpeaking = useCallback(() => speakingRef.current, []);

  // ── Web Speech API ─────────────────────────────────────────────────────────
  const speakNative = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const synth = (window as any).speechSynthesis;
      if (!synth) { resolve(); return; }

      synth.cancel();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const utterance = new (window as any).SpeechSynthesisUtterance(text);
      utterance.lang  = voiceConfig?.lang ? `${voiceConfig.lang}-MX` : 'es-MX';
      utterance.rate  = voiceConfig?.rate  ?? 0.92;
      utterance.pitch = voiceConfig?.pitch ?? 1.0;

      // Buscar la voz configurada o la mejor disponible
      const loadAndSpeak = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const voices = synth.getVoices() as any[];

        if (voiceConfig?.voiceName) {
          const picked = voices.find((v) => v.name === voiceConfig.voiceName);
          if (picked) utterance.voice = picked;
        } else {
          // fallback: mejor voz en español
          const priorities = ['es-MX', 'es-US', 'es-ES', 'es'];
          let best: unknown;
          for (const lang of priorities) {
            best = voices.find((v) => v.lang === lang && !v.name.toLowerCase().includes('compact'));
            if (best) break;
          }
          if (!best) best = voices.find((v: { lang: string }) => v.lang.startsWith('es'));
          if (best) utterance.voice = best;
        }

        utterance.onend   = () => { speakingRef.current = false; resolve(); };
        utterance.onerror = () => { speakingRef.current = false; resolve(); };

        speakingRef.current = true;
        synth.speak(utterance);

        // Chrome bug: síntesis se congela si la pestaña pierde foco
        // Re-touch cada 10s para mantenerla viva
        const keepAlive = setInterval(() => {
          if (!speakingRef.current) { clearInterval(keepAlive); return; }
          synth.pause(); synth.resume();
        }, 10_000);
        utterance.onend = () => { clearInterval(keepAlive); speakingRef.current = false; resolve(); };
        utterance.onerror = () => { clearInterval(keepAlive); speakingRef.current = false; resolve(); };
      };

      if (synth.getVoices().length) { loadAndSpeak(); }
      else { synth.addEventListener('voiceschanged', loadAndSpeak, { once: true }); }
    });
  }, [voiceConfig]);

  // ── ElevenLabs TTS ────────────────────────────────────────────────────────
  const speakElevenLabs = useCallback(async (text: string): Promise<void> => {
    try {
      const res = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ text }),
      });
      const ct = res.headers.get('Content-Type') ?? '';
      if (!res.ok || !ct.includes('audio/mpeg')) { await speakNative(text); return; }

      const blob  = await res.blob();
      const url   = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      return new Promise((resolve) => {
        audio.onended = () => { URL.revokeObjectURL(url); speakingRef.current = false; resolve(); };
        audio.onerror = async () => { await speakNative(text); resolve(); };
        speakingRef.current = true;
        audio.play().catch(async () => { await speakNative(text); resolve(); });
      });
    } catch { await speakNative(text); }
  }, [speakNative]);

  // ── Punto de entrada principal ────────────────────────────────────────────
  const speak = useCallback(async (text: string, useElevenLabs = true) => {
    stop();
    if (useElevenLabs) { await speakElevenLabs(text); }
    else               { await speakNative(text); }
  }, [stop, speakElevenLabs, speakNative]);

  /**
   * Habla el texto y cuando TERMINA activa el micrófono automáticamente.
   * Esto resuelve el problema de que el bot y el usuario se pisan.
   */
  const speakThenListen = useCallback(async (text: string, startListening: () => void) => {
    await speak(text, true);
    // Pequeña pausa natural antes de escuchar (~300ms)
    await new Promise((r) => setTimeout(r, 300));
    startListening();
  }, [speak]);

  return { speak, speakThenListen, stop, isSpeaking };
}

// ── Frases predefinidas del bot ───────────────────────────────────────────────
export const BotPhrases = {
  onListening:   ()                                            => 'Te escucho, di tu orden.',
  onSimulated:   (from: string, to: string, amount: string, double: boolean) =>
    double
      ? `Vas a convertir ${amount} ${from} a ${to}. Por seguridad necesito que confirmes con tu PIN.`
      : `Vas a convertir ${amount} ${from} a ${to}. ¿Confirmas la operación?`,
  onConfirming:  ()                                            => 'Procesando tu operación en Solana.',
  onSuccess:     ()                                            => 'Listo. Tu operación fue enviada a Devnet con éxito.',
  onError:       (msg: string)                                 => `Hubo un problema: ${msg}. Intenta de nuevo.`,
  onDoubleConf:  ()                                            => 'Ingresa tu PIN y presiona firmar para continuar.',
  onBalance:     ()                                            => 'Consultando tu saldo en Solana.',
};
