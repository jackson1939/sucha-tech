import React, { useEffect, useState } from 'react';
import {
  View, Text, Switch, TextInput, Pressable,
  StyleSheet, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchUserSettings, saveUserSettings } from '@/services/api';

const USER_ID = 'demo';

interface Settings {
  voice_only_enabled:   boolean;
  voice_only_max_per_op: string;
  voice_only_daily_cap:  string;
}

const DEFAULT: Settings = {
  voice_only_enabled:    true,
  voice_only_max_per_op: '0.1',
  voice_only_daily_cap:  '0.5',
};

export default function SettingsScreen() {
  const [settings, setSettings] = useState<Settings>(DEFAULT);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    fetchUserSettings(USER_ID)
      .then((data) => { if (data) setSettings({ ...DEFAULT, ...data }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await saveUserSettings(USER_ID, settings);
      Alert.alert('✅ Guardado', 'Configuración actualizada.');
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ActivityIndicator color="#7c3aed" style={{ marginTop: 60 }} />;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Política de voz</Text>

          <Row label="Voice-only habilitado">
            <Switch
              value={settings.voice_only_enabled}
              onValueChange={(v) => setSettings((s) => ({ ...s, voice_only_enabled: v }))}
              trackColor={{ false: '#1a1a2e', true: '#7c3aed' }}
              thumbColor="white"
            />
          </Row>

          <Row label="Máx. por operación (SOL)">
            <TextInput
              style={styles.numInput}
              value={settings.voice_only_max_per_op}
              onChangeText={(v) => setSettings((s) => ({ ...s, voice_only_max_per_op: v }))}
              keyboardType="decimal-pad"
              placeholderTextColor="#606080"
            />
          </Row>

          <Row label="Límite diario (SOL)">
            <TextInput
              style={styles.numInput}
              value={settings.voice_only_daily_cap}
              onChangeText={(v) => setSettings((s) => ({ ...s, voice_only_daily_cap: v }))}
              keyboardType="decimal-pad"
              placeholderTextColor="#606080"
            />
          </Row>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>¿Qué es voice-only?</Text>
          <Text style={styles.infoText}>
            Operaciones por debajo del límite con confianza ASR ≥ 80% se ejecutan solo con confirmación de voz.{'\n'}
            Operaciones mayores o con baja confianza requieren voz + PIN.
          </Text>
        </View>

        <Pressable onPress={save} style={[styles.saveBtn, saving && styles.saveBtnDisabled]} disabled={saving}>
          {saving
            ? <ActivityIndicator color="white" />
            : <Text style={styles.saveBtnText}>Guardar configuración</Text>
          }
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: '#05050f' },
  scroll:         { padding: 20, gap: 20 },
  section:        { backgroundColor: '#0f0f1a', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  sectionTitle:   { fontSize: 12, fontWeight: '700', color: '#606080', letterSpacing: 1, textTransform: 'uppercase', padding: 16, paddingBottom: 8 },
  row:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  rowLabel:       { fontSize: 14, color: '#f0f0ff', flex: 1 },
  numInput:       { backgroundColor: '#1a1a2e', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: '#a78bfa', fontSize: 14, width: 80, textAlign: 'right', borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)' },
  infoBox:        { backgroundColor: 'rgba(124,58,237,0.08)', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(124,58,237,0.2)', gap: 6 },
  infoTitle:      { fontSize: 13, fontWeight: '700', color: '#a78bfa' },
  infoText:       { fontSize: 12, color: '#a0a0c0', lineHeight: 18 },
  saveBtn:        { backgroundColor: '#7c3aed', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  saveBtnDisabled:{ opacity: 0.5 },
  saveBtnText:    { color: 'white', fontSize: 16, fontWeight: '700' },
});
