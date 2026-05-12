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

interface PatientForm {
  givenName: string;
  familyName: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other' | 'unknown';
}

const GENDERS: PatientForm['gender'][] = ['female', 'male', 'other', 'unknown'];

export default function PatientRegistrationScreen() {
  const { isConnected } = useWallet();
  const [form, setForm] = useState<PatientForm>({
    givenName: '',
    familyName: '',
    birthDate: '',
    gender: 'female',
  });
  const [registered, setRegistered] = useState<{ did: string } | null>(null);

  function handleRegister() {
    if (!form.givenName || !form.familyName || !form.birthDate) {
      Alert.alert('Missing fields', 'Please fill in all required fields.');
      return;
    }

    // In v0.1 we generate a DID locally; in v0.2 this will be anchored to Stellar
    const mockDid = `did:stellar:G${Math.random().toString(36).slice(2, 20).toUpperCase()}`;
    setRegistered({ did: mockDid });
  }

  if (!isConnected) {
    return (
      <View style={styles.center}>
        <Text style={styles.warning}>⚠️ Connect your wallet first (Identity tab)</Text>
      </View>
    );
  }

  if (registered) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>✅ Patient Registered</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Patient DID</Text>
          <Text style={styles.mono}>{registered.did}</Text>
          <Text style={styles.hint}>
            This DID is the patient's permanent identifier. Share it via QR code at the
            point of care.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setRegistered(null)}
          >
            <Text style={styles.buttonText}>Register Another Patient</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>👤 Register Patient</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Given Name *</Text>
        <TextInput
          style={styles.input}
          value={form.givenName}
          onChangeText={(v) => setForm((f) => ({ ...f, givenName: v }))}
          placeholder="e.g. Amina"
          autoCapitalize="words"
        />

        <Text style={styles.label}>Family Name *</Text>
        <TextInput
          style={styles.input}
          value={form.familyName}
          onChangeText={(v) => setForm((f) => ({ ...f, familyName: v }))}
          placeholder="e.g. Musa"
          autoCapitalize="words"
        />

        <Text style={styles.label}>Date of Birth * (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          value={form.birthDate}
          onChangeText={(v) => setForm((f) => ({ ...f, birthDate: v }))}
          placeholder="1990-03-22"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Gender</Text>
        <View style={styles.genderRow}>
          {GENDERS.map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.genderChip, form.gender === g && styles.genderChipActive]}
              onPress={() => setForm((f) => ({ ...f, gender: g }))}
            >
              <Text
                style={[
                  styles.genderChipText,
                  form.gender === g && styles.genderChipTextActive,
                ]}
              >
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Register Patient</Text>
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
  genderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  genderChip: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  genderChipActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  genderChipText: { fontSize: 14, color: '#374151' },
  genderChipTextActive: { color: '#FFFFFF', fontWeight: '600' },
  button: {
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  mono: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: '#374151',
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  hint: { fontSize: 13, color: '#6B7280', lineHeight: 20 },
});
