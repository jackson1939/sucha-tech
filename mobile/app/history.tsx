import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchOrders, Order } from '@/services/api';

const USER_ID = 'demo';

const STATUS_COLOR: Record<string, string> = {
  submitted: '#86efac',
  failed:    '#fca5a5',
  pending:   '#fbbf24',
};

export default function HistoryScreen() {
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchOrders(USER_ID);
      setOrders(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {loading ? (
        <ActivityIndicator color="#7c3aed" style={{ marginTop: 40 }} />
      ) : error ? (
        <Text style={styles.error}>⚠️ {error}</Text>
      ) : orders.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>Sin operaciones aún</Text>
          <Text style={styles.emptyHint}>Usa el botón de voz en la pantalla principal</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          onRefresh={load}
          refreshing={loading}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.action}>{item.action.toUpperCase()}</Text>
                <Text style={[styles.status, { color: STATUS_COLOR[item.status] ?? '#a0a0c0' }]}>
                  {item.status}
                </Text>
              </View>
              <Text style={styles.route}>
                {item.amount} {item.token_from} → {item.token_to}
              </Text>
              {!!item.tx_hash && (
                <Text style={styles.hash} numberOfLines={1}>
                  {item.tx_hash}
                </Text>
              )}
              <Text style={styles.date}>
                {new Date(item.created_at).toLocaleString('es')}
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: '#05050f' },
  error:      { color: '#fca5a5', textAlign: 'center', marginTop: 40, fontSize: 14 },
  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyIcon:  { fontSize: 48 },
  emptyText:  { fontSize: 18, color: '#f0f0ff', fontWeight: '600' },
  emptyHint:  { fontSize: 13, color: '#606080' },
  card:       { backgroundColor: '#0f0f1a', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', gap: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  action:     { fontSize: 13, fontWeight: '700', color: '#a78bfa', letterSpacing: 0.5 },
  status:     { fontSize: 12, fontWeight: '600' },
  route:      { fontSize: 16, fontWeight: '700', color: '#f0f0ff' },
  hash:       { fontSize: 11, color: '#606080', fontFamily: 'monospace' },
  date:       { fontSize: 11, color: '#606080' },
});
