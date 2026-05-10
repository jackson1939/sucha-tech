'use client';

import { useState, useEffect, useCallback } from 'react';

export interface VoiceConfig {
  voiceName: string;   // nombre de SpeechSynthesisVoice
  rate:      number;   // 0.5 – 2.0  (default 0.92)
  pitch:     number;   // 0.5 – 2.0  (default 1.0)
  lang:      string;   // filtro de idioma, default 'es'
}

const STORAGE_KEY = 'vb_voice_config';

const DEFAULT_CONFIG: VoiceConfig = {
  voiceName: '',
  rate:      0.92,
  pitch:     1.0,
  lang:      'es',
};

function load(): VoiceConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) } : DEFAULT_CONFIG;
  } catch { return DEFAULT_CONFIG; }
}

function save(cfg: VoiceConfig): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg)); } catch { /* ignore */ }
}

export function useVoiceSettings() {
  const [config,   setConfig]   = useState<VoiceConfig>(DEFAULT_CONFIG);
  const [voices,   setVoices]   = useState<SpeechSynthesisVoice[]>([]);
  const [mounted,  setMounted]  = useState(false);

  // Cargar config guardada
  useEffect(() => {
    setConfig(load());
    setMounted(true);
  }, []);

  // Cargar voces disponibles (Chrome las carga async)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const synth = (window as any).speechSynthesis;
    if (!synth) return;

    function loadVoices() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const v = (window as any).speechSynthesis.getVoices() as SpeechSynthesisVoice[];
      setVoices(v);
    }

    loadVoices();
    synth.addEventListener('voiceschanged', loadVoices);
    return () => synth.removeEventListener('voiceschanged', loadVoices);
  }, []);

  const update = useCallback((partial: Partial<VoiceConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...partial };
      save(next);
      return next;
    });
  }, []);

  // Voces filtradas por idioma seleccionado
  const filteredVoices = voices.filter((v) => v.lang.startsWith(config.lang));

  // Obtener el objeto de voz seleccionado
  const selectedVoice = voices.find((v) => v.name === config.voiceName) ?? filteredVoices[0] ?? voices[0];

  return { config, update, voices, filteredVoices, selectedVoice, mounted };
}
