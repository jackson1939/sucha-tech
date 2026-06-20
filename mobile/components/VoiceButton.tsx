/**
 * VoiceButton — Botón de micrófono animado para React Native
 * PTT (push-to-talk) con waveform de barras y countdown ring.
 */
import React, { useEffect, useRef, useCallback } from 'react';
import {
  View, Pressable, Text, StyleSheet, Animated,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';

const BAR_COUNT      = 7;
const MAX_LISTEN_SEC = 10;

interface Props {
  listening:   boolean;
  processing:  boolean;
  timeLeft:    number;
  interimText: string;
  onPress:     () => void;
  disabled?:   boolean;
}

export function VoiceButton({ listening, processing, timeLeft, interimText, onPress, disabled }: Props) {
  const bars      = useRef(Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.2))).current;
  const ringAnim  = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const loopRef   = useRef<Animated.CompositeAnimation | null>(null);
  const pulseRef  = useRef<Animated.CompositeAnimation | null>(null);

  // Animación barras waveform (mientras escucha)
  useEffect(() => {
    if (listening) {
      const animations = bars.map((bar, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(i * 60),
            Animated.timing(bar, { toValue: 0.3 + Math.random() * 0.7, duration: 200, useNativeDriver: true }),
            Animated.timing(bar, { toValue: 0.2,                        duration: 200, useNativeDriver: true }),
          ]),
        ),
      );
      loopRef.current = Animated.parallel(animations);
      loopRef.current.start();
    } else {
      loopRef.current?.stop();
      bars.forEach((b) => b.setValue(0.2));
    }
    return () => loopRef.current?.stop();
  }, [listening, bars]);

  // Pulso idle
  useEffect(() => {
    if (!listening && !processing) {
      pulseRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.00, duration: 1200, useNativeDriver: true }),
        ]),
      );
      pulseRef.current.start();
    } else {
      pulseRef.current?.stop();
      pulseAnim.setValue(1);
    }
    return () => pulseRef.current?.stop();
  }, [listening, processing, pulseAnim]);

  // Ring progreso según timeLeft
  useEffect(() => {
    const progress = timeLeft / MAX_LISTEN_SEC;
    Animated.timing(ringAnim, { toValue: progress, duration: 800, useNativeDriver: false }).start();
  }, [timeLeft, ringAnim]);

  const handlePress = useCallback(async () => {
    if (disabled || processing) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  }, [disabled, processing, onPress]);

  const btnBg = listening ? '#dc2626' : '#7c3aed';

  // Color del countdown ring
  const progress = timeLeft / MAX_LISTEN_SEC;
  const ringColor = progress > 0.5 ? '#a78bfa' : progress > 0.25 ? '#f97316' : '#dc2626';

  const circumference = 2 * Math.PI * 44;
  const dashOffset    = ringAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={styles.container}>
      {/* Pulse rings (idle) */}
      {!listening && !processing && (
        <Animated.View style={[styles.ring, { transform: [{ scale: pulseAnim }] }]} />
      )}

      {/* SVG-like countdown ring en RN: usamos un borde circular animado */}
      {listening && (
        <View style={styles.svgRing} pointerEvents="none">
          <View style={[styles.trackRing]} />
          {/* Ring real con border animado usando transform */}
          <Animated.View style={[
            styles.progressRing,
            { borderColor: ringColor },
          ]} />
        </View>
      )}

      {/* Botón principal */}
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Pressable
          onPress={handlePress}
          disabled={disabled}
          style={[styles.btn, { backgroundColor: btnBg, opacity: disabled ? 0.4 : 1 }]}
          accessibilityLabel={listening ? 'Detener grabación' : 'Iniciar grabación de voz'}
          accessibilityRole="button"
        >
          {processing ? (
            <ActivityIndicator color="white" size="large" />
          ) : listening ? (
            <View style={styles.bars}>
              {bars.map((bar, i) => (
                <Animated.View
                  key={i}
                  style={[styles.bar, { transform: [{ scaleY: bar }] }]}
                />
              ))}
            </View>
          ) : (
            <Text style={styles.micIcon}>🎙️</Text>
          )}
        </Pressable>
      </Animated.View>

      {/* Transcripción en tiempo real */}
      {!!interimText && listening && (
        <View style={styles.interimBox}>
          <Text style={styles.interimText} numberOfLines={3}>{interimText}</Text>
        </View>
      )}

      {/* Label */}
      <Text style={styles.label}>
        {processing
          ? 'Procesando...'
          : listening
            ? `Escuchando… ${timeLeft > 0 ? `${timeLeft}s` : ''}`
            : 'Toca para hablar'}
      </Text>
    </View>
  );
}

const BTN = 96;

const styles = StyleSheet.create({
  container:   { alignItems: 'center', gap: 16 },
  ring:        { position: 'absolute', width: BTN + 32, height: BTN + 32, borderRadius: (BTN + 32) / 2, borderWidth: 1, borderColor: '#7c3aed', opacity: 0.4 },
  svgRing:     { position: 'absolute', width: BTN + 16, height: BTN + 16, alignItems: 'center', justifyContent: 'center' },
  trackRing:   { position: 'absolute', width: BTN + 16, height: BTN + 16, borderRadius: (BTN + 16) / 2, borderWidth: 3, borderColor: 'rgba(255,255,255,0.08)' },
  progressRing:{ position: 'absolute', width: BTN + 16, height: BTN + 16, borderRadius: (BTN + 16) / 2, borderWidth: 3, borderTopColor: 'transparent', borderRightColor: 'transparent' },
  btn:         { width: BTN, height: BTN, borderRadius: BTN / 2, alignItems: 'center', justifyContent: 'center', shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 20, elevation: 12 },
  bars:        { flexDirection: 'row', alignItems: 'center', gap: 3, height: 32 },
  bar:         { width: 4, height: 32, backgroundColor: 'white', borderRadius: 2 },
  micIcon:     { fontSize: 36 },
  interimBox:  { maxWidth: 260, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  interimText: { fontSize: 13, color: '#a0a0c0', fontStyle: 'italic', textAlign: 'center' },
  label:       { color: '#a0a0c0', fontSize: 12, fontWeight: '500', letterSpacing: 0.8 },
});
