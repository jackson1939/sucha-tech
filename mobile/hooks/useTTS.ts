import { useState, useCallback, useRef } from 'react';
import { Audio }                         from 'expo-av';
import { fetchTTSAudio }                 from '@/services/api';

export function useTTS() {
  const [playing, setPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const speak = useCallback(async (text: string) => {
    try {
      // Detener reproducción anterior
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // Obtener URL de audio del backend (ElevenLabs)
      const url = await fetchTTSAudio(text);
      if (!url) return;

      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true },
      );
      soundRef.current = sound;
      setPlaying(true);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        if (status.didJustFinish) {
          setPlaying(false);
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
    } catch (e) {
      console.warn('[useTTS] Error reproduciendo TTS:', e);
      setPlaying(false);
    }
  }, []);

  const stop = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
      setPlaying(false);
    }
  }, []);

  return { playing, speak, stop };
}
