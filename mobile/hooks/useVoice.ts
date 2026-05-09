/**
 * useVoice — Wrapper sobre @react-native-voice/voice
 * Expone: isListening, transcript (interim), start(), stop()
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import Voice, {
  SpeechResultsEvent,
  SpeechErrorEvent,
} from '@react-native-voice/voice';

interface UseVoiceOptions {
  onResult:  (transcript: string, confidence: number) => void;
  onInterim?: (text: string) => void;
  locale?:   string;
}

export function useVoice({ onResult, onInterim, locale = 'es-MX' }: UseVoiceOptions) {
  const [isListening, setIsListening]   = useState(false);
  const [interim,     setInterim]       = useState('');
  const [error,       setError]         = useState<string | null>(null);
  const onResultRef  = useRef(onResult);
  const onInterimRef = useRef(onInterim);

  useEffect(() => { onResultRef.current  = onResult;  }, [onResult]);
  useEffect(() => { onInterimRef.current = onInterim; }, [onInterim]);

  useEffect(() => {
    // Resultados intermedios (parciales)
    Voice.onSpeechPartialResults = (e: SpeechResultsEvent) => {
      const text = e.value?.[0] ?? '';
      setInterim(text);
      onInterimRef.current?.(text);
    };

    // Resultado final
    Voice.onSpeechResults = (e: SpeechResultsEvent) => {
      const transcripts  = e.value ?? [];
      const best         = transcripts[0] ?? '';
      const confidence   = 0.9;  // RN Voice no expone confianza en Android ≤ 13
      if (best) {
        setInterim('');
        setIsListening(false);
        onResultRef.current(best, confidence);
      }
    };

    Voice.onSpeechEnd   = () => setIsListening(false);
    Voice.onSpeechError = (e: SpeechErrorEvent) => {
      setError(e.error?.message ?? 'Voice error');
      setIsListening(false);
    };

    return () => { Voice.destroy().then(Voice.removeAllListeners); };
  }, []);

  const start = useCallback(async () => {
    try {
      setError(null);
      setInterim('');
      await Voice.start(locale);
      setIsListening(true);
    } catch (e: unknown) {
      setError(String(e));
    }
  }, [locale]);

  const stop = useCallback(async () => {
    try {
      await Voice.stop();
      setIsListening(false);
    } catch { /* ignorar */ }
  }, []);

  return { isListening, interim, error, start, stop };
}
