import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useWallet } from '../context/WalletContext';

export default function WalletScreen() {
  const { wallet, isConnected, isLoading, connect, disconnect } = useWallet();

  function handleConnect() {
    try {
      const info = connect();
      Alert.alert('Wallet Connected', `DID: ${info.did.slice(0, 40)}...`);
    } catch (err) {
      Alert.alert('Error', 'Failed to connect wallet');
    }
  }

  function handleDisconnect() {
    Alert.alert('Disconnect Wallet', 'This will remove your local wallet. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: disconnect,
      },
    ]);
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🪪 Identity</Text>

      {isConnected && wallet ? (
        <View style={styles.card}>
          <Text style={styles.label}>Status</Text>
          <View style={styles.statusRow}>
            <View style={styles.dot} />
            <Text style={styles.statusText}>Connected</Text>
          </View>

          <Text style={styles.label}>DID</Text>
          <Text style={styles.mono} numberOfLines={2}>
            {wallet.did}
          </Text>

          <Text style={styles.label}>Stellar Public Key</Text>
          <Text style={styles.mono} numberOfLines={2}>
            {wallet.publicKey}
          </Text>

          <TouchableOpacity style={styles.dangerButton} onPress={handleDisconnect}>
            <Text style={styles.dangerButtonText}>Disconnect Wallet</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.description}>
            Your identity is a Stellar Decentralized Identifier (DID). It lets you own
            your health records and control who can access them — even without internet.
          </Text>
          <TouchableOpacity style={styles.button} onPress={handleConnect}>
            <Text style={styles.buttonText}>Connect / Create Wallet</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
  },
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
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '600',
  },
  mono: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: '#374151',
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 6,
  },
  description: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '600',
  },
});
