/**
 * ConfirmModal — Confirmación de la operación.
 * Modo voice-only: el usuario dice "confirmar" y se firma localmente.
 * Modo double:     pide PIN de 4 dígitos además de la voz.
 */
import React, { useState, useCallback } from 'react';
import {
  Modal, View, Text, Pressable, TextInput, StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useVoice }  from '@/hooks/useVoice';
import type { SimulateResult } from '@/services/api';

interface Props {
  visible:   boolean;
  sim:       SimulateResult | null;
  onConfirm: (signature: string, type: 'voice' | 'pin') => Promise<void>;
  onCancel:  () => void;
  executing: boolean;
}

const CONFIRM_WORDS = ['confirmar', 'confirm', 'yes', 'sí', 'si', 'ok', 'ejecutar'];

export function ConfirmModal({ visible, sim, onConfirm, onCancel, executing }: Props) {
  const [pin,        setPin]        = useState('');
  const [voiceHeard, setVoiceHeard] = useState('');
  const [step,       setStep]       = useState<'voice' | 'pin'>('voice');

  const requiresDouble = sim?.requiresDoubleConfirmation ?? false;

  const { isListening, interim, start, stop } = useVoice({
    onResult: async (transcript, confidence) => {
      setVoiceHeard(transcript);
      const heard = transcript.toLowerCase().trim();
      if (CONFIRM_WORDS.some((w) => heard.includes(w))) {
        if (!requiresDouble) {
          // Voice-only: firmar con hash derivado del transcript
          const sig = btoa(`${sim?.simulationId}:${transcript}:${confidence}`);
          await onConfirm(sig, 'voice');
        } else {
          setStep('pin');   // Pedir PIN además
        }
      }
    },
  });

  const handlePinConfirm = useCallback(async () => {
    if (pin.length < 4) return;
    const sig = btoa(`${sim?.simulationId}:${voiceHeard}:pin:${pin}`);
    await onConfirm(sig, 'pin');
  }, [pin, sim, voiceHeard, onConfirm]);

  const handleClose = useCallback(() => {
    setPin('');
    setVoiceHeard('');
    setStep('voice');
    if (isListening) stop();
    onCancel();
  }, [isListening, stop, onCancel]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>
            {step === 'voice' ? '🎙️ Di "confirmar"' : '🔐 Ingresa tu PIN'}
          </Text>

          {step === 'voice' ? (
            <>
              {!!interim && <Text style={styles.interim}>"{interim}"</Text>}
              {!!voiceHeard && !CONFIRM_WORDS.some((w) => voiceHeard.toLowerCase().includes(w)) && (
                <Text style={styles.notHeard}>No entendí "confirmar" — intenta de nuevo</Text>
              )}

              <Pressable
                onPress={isListening ? stop : start}
                style={[styles.micBtn, isListening && styles.micBtnActive]}
              >
                <Text style={styles.micBtnText}>
                  {isListening ? '⏹ Escuchando...' : '🎙️ Hablar'}
                </Text>
              </Pressable>

              {requiresDouble && (
                <Text style={styles.hint}>Tras confirmar por voz, ingresarás tu PIN.</Text>
              )}
            </>
          ) : (
            <>
              <Text style={styles.hint}>PIN de 4 dígitos para operaciones de alto riesgo</Text>
              <TextInput
                style={styles.pinInput}
                value={pin}
                onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, 4))}
                keyboardType="numeric"
                secureTextEntry
                maxLength={4}
                placeholder="••••"
                placeholderTextColor="#606080"
                autoFocus
              />
              <Pressable
                onPress={handlePinConfirm}
                disabled={pin.length < 4 || executing}
                style={[styles.confirmBtn, (pin.length < 4 || executing) && styles.confirmBtnDisabled]}
              >
                {executing
                  ? <ActivityIndicator color="white" />
                  : <Text style={styles.confirmBtnText}>Ejecutar operación</Text>
                }
              </Pressable>
            </>
          )}

          {executing && step === 'voice' && <ActivityIndicator color="#7c3aed" style={{ marginTop: 12 }} />}

          <Pressable onPress={handleClose} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:            { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet:              { backgroundColor: '#0f0f1a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, gap: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  title:              { fontSize: 22, fontWeight: '700', color: '#f0f0ff', textAlign: 'center' },
  interim:            { fontSize: 14, color: '#a78bfa', textAlign: 'center', fontStyle: 'italic' },
  notHeard:           { fontSize: 12, color: '#f97316', textAlign: 'center' },
  hint:               { fontSize: 12, color: '#606080', textAlign: 'center' },
  micBtn:             { backgroundColor: '#7c3aed', borderRadius: 50, paddingVertical: 16, alignItems: 'center' },
  micBtnActive:       { backgroundColor: '#dc2626' },
  micBtnText:         { color: 'white', fontSize: 16, fontWeight: '600' },
  pinInput:           { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, fontSize: 28, color: '#f0f0ff', textAlign: 'center', letterSpacing: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  confirmBtn:         { backgroundColor: '#7c3aed', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  confirmBtnDisabled: { opacity: 0.4 },
  confirmBtnText:     { color: 'white', fontSize: 16, fontWeight: '700' },
  cancelBtn:          { alignItems: 'center', paddingVertical: 8 },
  cancelText:         { color: '#606080', fontSize: 14 },
});
