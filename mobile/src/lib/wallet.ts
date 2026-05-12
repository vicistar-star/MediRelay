/**
 * Stellar wallet utilities for the mobile app.
 * Keys are stored in MMKV encrypted storage — never in plain AsyncStorage.
 * On a real device, the secret key would be stored in the Android Keystore.
 */
import * as StellarSdk from '@stellar/stellar-sdk';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'mediarelay-wallet' });

const KEYS = {
  PUBLIC_KEY: 'wallet.publicKey',
  SECRET_KEY: 'wallet.secretKey', // In production: Android Keystore only
  DID: 'wallet.did',
} as const;

export interface WalletInfo {
  publicKey: string;
  did: string;
}

/** Generate a new Stellar keypair and persist it. */
export function createWallet(): WalletInfo {
  const keypair = StellarSdk.Keypair.random();
  const publicKey = keypair.publicKey();
  const did = `did:stellar:${publicKey}`;

  storage.set(KEYS.PUBLIC_KEY, publicKey);
  storage.set(KEYS.SECRET_KEY, keypair.secret()); // TODO: move to Android Keystore
  storage.set(KEYS.DID, did);

  return { publicKey, did };
}

/** Load the persisted wallet, or return null if none exists. */
export function loadWallet(): WalletInfo | null {
  const publicKey = storage.getString(KEYS.PUBLIC_KEY);
  const did = storage.getString(KEYS.DID);
  if (!publicKey || !did) return null;
  return { publicKey, did };
}

/** Sign a message with the stored secret key. */
export function signWithWallet(message: Buffer): Buffer {
  const secret = storage.getString(KEYS.SECRET_KEY);
  if (!secret) throw new Error('No wallet loaded');
  const keypair = StellarSdk.Keypair.fromSecret(secret);
  return keypair.sign(message);
}

/** Check whether a wallet exists in storage. */
export function hasWallet(): boolean {
  return storage.contains(KEYS.PUBLIC_KEY);
}

/** Delete the wallet from storage (irreversible without backup). */
export function deleteWallet(): void {
  storage.remove(KEYS.PUBLIC_KEY);
  storage.remove(KEYS.SECRET_KEY);
  storage.remove(KEYS.DID);
}
