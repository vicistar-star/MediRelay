/**
 * In-memory keystore for development and server-side use.
 * On Android, keys are stored in the Android Keystore and never leave the device.
 * This implementation is for the Node.js relay node and test environments only.
 */
import { generateSigningKeypair, generateBoxKeypair, sign, Keypair } from './crypto';
import { ErrorCode, MediRelayError } from '../errors';

export type KeyRole = 'ministry' | 'district' | 'facility' | 'health-worker' | 'patient';

export interface KeyEntry {
  id: string;
  role: KeyRole;
  signingKeypair: Keypair;
  boxKeypair: Keypair;
  issuerId?: string; // DID of the issuing key
}

export class InMemoryKeystore {
  private readonly keys = new Map<string, KeyEntry>();

  store(entry: KeyEntry): void {
    this.keys.set(entry.id, entry);
  }

  get(id: string): KeyEntry {
    const entry = this.keys.get(id);
    if (!entry) {
      throw new MediRelayError(ErrorCode.KEY_NOT_FOUND, `Key not found: ${id}`);
    }
    return entry;
  }

  has(id: string): boolean {
    return this.keys.has(id);
  }

  sign(data: Uint8Array, keyId: string): Uint8Array {
    const entry = this.get(keyId);
    return sign(data, entry.signingKeypair.secretKey);
  }

  generateAndStore(id: string, role: KeyRole, issuerId?: string): KeyEntry {
    const entry: KeyEntry = {
      id,
      role,
      signingKeypair: generateSigningKeypair(),
      boxKeypair: generateBoxKeypair(),
      issuerId,
    };
    this.store(entry);
    return entry;
  }
}
