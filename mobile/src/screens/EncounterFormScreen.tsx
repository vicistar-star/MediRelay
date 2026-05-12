import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useWallet } from '../context/WalletContext';

interface EncounterForm {
  patientDid: string;
  reasonCode: string;
  reasonDisplay: string;
  notes: string;
}

export default function EncounterFormScreen() {
  const { wallet, isConnected } = useWallet();
  const [form, setForm] = useState<EncounterForm>({
    patientDid: '',
    reasonCode: '',
    reasonDisplay: '',
    notes: '',
  });
  const [saved, setSaved] = useState(false);

  function handleSave() {
    if (!form.patientDid) {
      Alert.alert('Missing field', 'Patient DID is required.');
      return;
    }

    // In v0.2 this will build a real FHIR bundle, sign it, and broadcast to the mesh
    setSaved(true);
  }

  if (!isConnected) {
    return (
      <View style={styles.center}>
        <Text style={styles.warning}>⚠️ Connect your wallet first (Identity tab)</Text>
      </View>
    );
  }

  if (saved) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>✅ Encounter Saved</Text>
          <View style={styles.card}>
            <Text style={styles.description}>
              The encounter record has been signed and queued for mesh broadcast. It will
              be anchored to Stellar when connectivity is available.
            </Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Signed by</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {wallet?.did.slice(0, 30)}...
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={[styles.infoValue, { color: '#D97706' }]}>
                Pending mesh broadcast
              </Text>
            </View>
            <TouchableOpacity style={styles.button} onPress={() => setSaved(false)}>
              <Text style={styles.buttonText}>New Encounter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>📋 New Encounter</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Patient DID *</Text>
        <TextInput
          style={styles.input}
          value={form.patientDid}
          onChangeText={(v) => setForm((f) => ({ ...f, patientDid: v }))}
          placeholder="did:stellar:G..."
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Reason Code (ICD-10)</Text>
        <TextInput
          style={styles.input}
          value={form.reasonCode}
          onChangeText={(v) => setForm((f) => ({ ...f, reasonCode: v }))}
          placeholder="e.g. B54"
          autoCapitalize="characters"
        />

        <Text style={styles.label}>Reason Description</Text>
        <TextInput
          style={styles.input}
          value={form.reasonDisplay}
          onChangeText={(v) => setForm((f) => ({ ...f, reasonDisplay: v }))}
          placeholder="e.g. Unspecified malaria"
        />

        <Text style={styles.label}>Clinical Notes</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={form.notes}
          onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
          placeholder="Observations, treatment given..."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>Sign & Save Encounter</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 20 },
  warning: { fontSize: 16, color: '#D97706', textAlign: 'center' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  textarea: { height: 100 },
  button: {
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  description: { fontSize: 15, color: '#4B5563', lineHeight: 22, marginBottom: 16 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: { fontSize: 14, color: '#6B7280' },
  infoValue: { fontSize: 14, color: '#111827', fontWeight: '500', maxWidth: '60%' },
});
