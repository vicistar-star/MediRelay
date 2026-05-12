import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useWallet } from '../context/WalletContext';

// Placeholder records — in v0.2 these will come from the MeshStore
const MOCK_RECORDS = [
  {
    id: 'enc-001',
    type: 'Encounter',
    date: '2026-01-15T09:00:00Z',
    summary: 'Malaria treatment — B54',
    anchored: true,
  },
  {
    id: 'imm-001',
    type: 'Immunization',
    date: '2026-01-10T11:30:00Z',
    summary: 'MMR — Dose 1',
    anchored: true,
  },
  {
    id: 'enc-002',
    type: 'Encounter',
    date: '2026-01-20T08:15:00Z',
    summary: 'Follow-up visit',
    anchored: false,
  },
];

type HistoryRecord = (typeof MOCK_RECORDS)[number];

function RecordCard({ item }: { item: HistoryRecord }) {
  const typeColors: Record<string, string> = {
    Encounter: '#7C3AED',
    Immunization: '#059669',
    Observation: '#2563EB',
  };
  const color = typeColors[item.type] ?? '#6B7280';

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={[styles.typeBadge, { backgroundColor: color + '20' }]}>
          <Text style={[styles.typeText, { color }]}>{item.type}</Text>
        </View>
        <View style={[styles.anchorBadge, item.anchored ? styles.anchored : styles.pending]}>
          <Text style={styles.anchorText}>{item.anchored ? '⛓ Anchored' : '⏳ Pending'}</Text>
        </View>
      </View>
      <Text style={styles.summary}>{item.summary}</Text>
      <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
    </TouchableOpacity>
  );
}

export default function RecordHistoryScreen() {
  const { isConnected } = useWallet();

  if (!isConnected) {
    return (
      <View style={styles.center}>
        <Text style={styles.warning}>⚠️ Connect your wallet first (Identity tab)</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📁 Record History</Text>
      <FlatList
        data={MOCK_RECORDS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <RecordCard item={item} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No records yet. Create an encounter to get started.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 16 },
  warning: { fontSize: 16, color: '#D97706', textAlign: 'center' },
  list: { gap: 12 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  typeBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeText: { fontSize: 12, fontWeight: '700' },
  anchorBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  anchored: { backgroundColor: '#D1FAE5' },
  pending: { backgroundColor: '#FEF3C7' },
  anchorText: { fontSize: 11, fontWeight: '600', color: '#374151' },
  summary: { fontSize: 15, color: '#111827', fontWeight: '500', marginBottom: 4 },
  date: { fontSize: 13, color: '#9CA3AF' },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40, fontSize: 15 },
});
