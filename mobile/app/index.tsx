/**
 * Pantalla principal — Voz + Simulación + Confirmación
 */
import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert,
  TextInput, Pressable, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView }   from 'react-native-safe-area-context';
import { router }         from 'expo-router';

import { VoiceButton }    from '@/components/VoiceButton';
import { SimCard }        from '@/components/SimCard';
import { ConfirmModal }   from '@/components/ConfirmModal';
import { useVoice }       from '@/hooks/useVoice';
import { useSimulate }    from '@/hooks/useSimulate';
import { useExecute }     from '@/hooks/useExecute';
import { useTTS }         from '@/hooks/useTTS';

const USER_ID = 'demo';   // TODO: wallet address real tras autenticación

const MAX_LISTEN_SEC = 10;

export default function HomeScreen() {
  const [timeLeft,    setTimeLeft]    = useState(MAX_LISTEN_SEC);
  const [textInput,   setTextInput]   = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [interimText, setInterimText] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { result: sim, loading: simLoading, error: simError, run: runSimulate, reset: resetSim } = useSimulate(USER_ID);
  const { result: exec, loading: execLoading, run: runExecute } = useExecute(USER_ID);
  const { speak } = useTTS();

  // ── Limpiar timers ──────────────────────────────────────────────────────────
  const clearTimers = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timerRef.current)    clearTimeout(timerRef.current);
    intervalRef.current = null;
    timerRef.current    = null;
  }, []);

  // ── ASR: resultado final ────────────────────────────────────────────────────
  const handleVoiceResult = useCallback(async (transcript: string, confidence: number) => {
    clearTimers();
    setInterimText('');
    setTimeLeft(MAX_LISTEN_SEC);

    const data = await runSimulate(transcript, confidence);
    if (!data) return;

    // ElevenLabs narra el resultado
    const narration = buildNarration(data.intent, data.quote, data.requiresDoubleConfirmation);
    speak(narration);

    setShowConfirm(true);
  }, [clearTimers, runSimulate, speak]);

  // ── ASR: resultados intermedios ─────────────────────────────────────────────
  const handleInterim = useCallback((text: string) => setInterimText(text), []);

  const { isListening, start: startVoice, stop: stopVoice } = useVoice({
    onResult:  handleVoiceResult,
    onInterim: handleInterim,
  });

  // ── Toggle voz ──────────────────────────────────────────────────────────────
  const toggleVoice = useCallback(async () => {
    if (isListening) {
      await stopVoice();
      clearTimers();
      setTimeLeft(MAX_LISTEN_SEC);
      setInterimText('');
      return;
    }

    resetSim();
    setTimeLeft(MAX_LISTEN_SEC);
    await startVoice();

    // Countdown
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(intervalRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);

    // Max timeout
    timerRef.current = setTimeout(async () => {
      await stopVoice();
      clearTimers();
      setTimeLeft(MAX_LISTEN_SEC);
      setInterimText('');
    }, MAX_LISTEN_SEC * 1000);
  }, [isListening, startVoice, stopVoice, clearTimers, resetSim]);

  // ── Entrada de texto manual ─────────────────────────────────────────────────
  const handleTextSubmit = useCallback(async () => {
    if (!textInput.trim()) return;
    const data = await runSimulate(textInput.trim(), 1.0);
    if (!data) return;
    speak(buildNarration(data.intent, data.quote, data.requiresDoubleConfirmation));
    setTextInput('');
    setShowConfirm(true);
  }, [textInput, runSimulate, speak]);

  // ── Confirmar ejecución ─────────────────────────────────────────────────────
  const handleConfirm = useCallback(async (signature: string, type: 'voice' | 'pin') => {
    if (!sim) return;
    const result = await runExecute(sim.simulationId, signature, type);
    setShowConfirm(false);
    if (result?.status === 'submitted') {
      speak('Operación enviada. Puedes ver el estado en el historial.');
      Alert.alert('✅ Enviado', `TX: ${result.txHash.slice(0, 16)}...`, [
        { text: 'Ver historial', onPress: () => router.push('/history') },
        { text: 'OK' },
      ]);
      resetSim();
    }
  }, [sim, runExecute, speak, resetSim]);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Hero tagline */}
          <Text style={styles.tagline}>El Alexa de las transacciones Web3</Text>

          {/* Botón de voz */}
          <View style={styles.voiceSection}>
            <VoiceButton
              listening={isListening}
              processing={simLoading}
              timeLeft={timeLeft}
              interimText={interimText}
              onPress={toggleVoice}
              disabled={execLoading}
            />
          </View>

          {/* Separador "o" */}
          <View style={styles.separator}>
            <View style={styles.line} />
            <Text style={styles.separatorText}>o escribe</Text>
            <View style={styles.line} />
          </View>

          {/* Entrada texto */}
          <View style={styles.textRow}>
            <TextInput
              style={styles.input}
              value={textInput}
              onChangeText={setTextInput}
              placeholder='Ej: "compra 0.05 SOL"'
              placeholderTextColor="#606080"
              onSubmitEditing={handleTextSubmit}
              returnKeyType="send"
              blurOnSubmit={false}
            />
            <Pressable
              onPress={handleTextSubmit}
              style={[styles.sendBtn, !textInput.trim() && styles.sendBtnDisabled]}
              disabled={!textInput.trim() || simLoading}
            >
              <Text style={styles.sendBtnText}>→</Text>
            </Pressable>
          </View>

          {/* Error — solo si no hay simulación exitosa */}
          {!!simError && !sim && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {simError}</Text>
            </View>
          )}

          {/* Resultado simulación */}
          {!!sim && !showConfirm && (
            <>
              <SimCard sim={sim} />
              <Pressable style={styles.confirmBtn} onPress={() => setShowConfirm(true)}>
                <Text style={styles.confirmBtnText}>Confirmar operación</Text>
              </Pressable>
            </>
          )}

          {/* Resultado ejecución */}
          {!!exec && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>✅ TX enviada</Text>
              <Text style={styles.successSub}>{exec.txHash.slice(0, 32)}...</Text>
            </View>
          )}

          {/* Ejemplos de comandos */}
          {!sim && !simLoading && (
            <View style={styles.examples}>
              <Text style={styles.examplesTitle}>Ejemplos</Text>
              {[
                'compra 0.05 SOL',
                'swap 10 USDC por SOL',
                'vende 5 USDC',
                'mi saldo',
              ].map((ex) => (
                <Pressable key={ex} style={styles.exampleChip} onPress={() => {
                  setTextInput(ex);
                }}>
                  <Text style={styles.exampleText}>{ex}</Text>
                </Pressable>
              ))}
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal confirmación */}
      <ConfirmModal
        visible={showConfirm}
        sim={sim}
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
        executing={execLoading}
      />
    </SafeAreaView>
  );
}

function buildNarration(
  intent: { action: string; tokenFrom: string; tokenTo: string; amount: number },
  quote:  { estimatedReceive: string },
  double: boolean,
): string {
  const base = `Vas a ${intent.action === 'buy' ? 'comprar' : intent.action === 'sell' ? 'vender' : 'hacer un swap de'} ${intent.amount} ${intent.tokenFrom} por aproximadamente ${parseFloat(quote.estimatedReceive).toFixed(4)} ${intent.tokenTo}.`;
  return double
    ? `${base} Esta operación requiere confirmación adicional. Di confirmar y luego ingresa tu PIN.`
    : `${base} Di confirmar para ejecutar.`;
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: '#05050f' },
  scroll:         { padding: 20, gap: 20, paddingBottom: 40 },
  tagline:        { fontSize: 14, color: '#606080', textAlign: 'center', letterSpacing: 0.5 },
  voiceSection:   { alignItems: 'center', paddingVertical: 24 },
  separator:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  line:           { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  separatorText:  { fontSize: 12, color: '#606080' },
  textRow:        { flexDirection: 'row', gap: 8 },
  input:          { flex: 1, backgroundColor: '#0f0f1a', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: '#f0f0ff', fontSize: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  sendBtn:        { width: 52, backgroundColor: '#7c3aed', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled:{ opacity: 0.4 },
  sendBtnText:    { color: 'white', fontSize: 22, fontWeight: '700' },
  errorBox:       { backgroundColor: 'rgba(220,38,38,0.12)', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: 'rgba(220,38,38,0.3)' },
  errorText:      { color: '#fca5a5', fontSize: 13, textAlign: 'center' },
  confirmBtn:     { backgroundColor: '#7c3aed', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  confirmBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  successBox:     { backgroundColor: 'rgba(22,163,74,0.12)', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(22,163,74,0.3)', alignItems: 'center', gap: 4 },
  successText:    { fontSize: 18, fontWeight: '700', color: '#86efac' },
  successSub:     { fontSize: 11, color: '#606080' },
  examples:       { gap: 10 },
  examplesTitle:  { fontSize: 13, color: '#606080', fontWeight: '600' },
  exampleChip:    { backgroundColor: '#0f0f1a', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)' },
  exampleText:    { color: '#a78bfa', fontSize: 14 },
});
