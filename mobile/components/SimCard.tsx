/**
 * SimCard — Muestra el resultado de la simulación antes de confirmar.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { SimulateResult }    from '@/services/api';

interface Props {
  sim: SimulateResult;
}

const ACTION_LABEL: Record<string, string> = {
  buy:     '🛒 Compra',
  sell:    '📤 Venta',
  swap:    '🔄 Swap',
  bridge:  '🌉 Bridge',
  balance: '💰 Balance',
};

export function SimCard({ sim }: Props) {
  const { intent, quote, fees, requiresDoubleConfirmation, route, asrConfidence } = sim;

  return (
    <View style={styles.card}>
      {/* Acción */}
      <Text style={styles.action}>
        {ACTION_LABEL[intent.action] ?? intent.action.toUpperCase()}
      </Text>

      {/* Ruta */}
      <View style={styles.row}>
        <View style={styles.token}>
          <Text style={styles.tokenLabel}>Pagas</Text>
          <Text style={styles.tokenValue}>{quote.amount} {intent.tokenFrom}</Text>
        </View>
        <Text style={styles.arrow}>→</Text>
        <View style={styles.token}>
          <Text style={styles.tokenLabel}>Recibes ~</Text>
          <Text style={styles.tokenValue}>{parseFloat(quote.estimatedReceive).toFixed(6)} {intent.tokenTo}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Fees */}
      <View style={styles.meta}>
        <MetaRow label="Red"       value={fees.network} />
        <MetaRow label="Protocolo" value={fees.protocol} />
        <MetaRow label="Proveedor" value={route.provider} />
        <MetaRow label="Confianza ASR" value={`${Math.round(asrConfidence * 100)}%`} />
      </View>

      {/* Alerta doble confirmación */}
      {requiresDoubleConfirmation && (
        <View style={styles.alert}>
          <Text style={styles.alertText}>
            ⚠️ Requiere confirmación adicional (monto alto o baja confianza)
          </Text>
        </View>
      )}
    </View>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card:       { backgroundColor: '#0f0f1a', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 12 },
  action:     { fontSize: 20, fontWeight: '700', color: '#f0f0ff' },
  row:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  token:      { flex: 1, alignItems: 'center' },
  tokenLabel: { fontSize: 11, color: '#606080', marginBottom: 4 },
  tokenValue: { fontSize: 16, fontWeight: '700', color: '#a78bfa' },
  arrow:      { fontSize: 20, color: '#606080', marginHorizontal: 8 },
  divider:    { height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  meta:       { gap: 6 },
  metaRow:    { flexDirection: 'row', justifyContent: 'space-between' },
  metaLabel:  { fontSize: 12, color: '#606080' },
  metaValue:  { fontSize: 12, color: '#a0a0c0', fontWeight: '500' },
  alert:      { backgroundColor: 'rgba(245,158,11,0.12)', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' },
  alertText:  { fontSize: 12, color: '#fbbf24', textAlign: 'center' },
});
