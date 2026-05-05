import { toHex } from '../crypto/crypto';
import { ErrorCode, MediRelayError } from '../errors';
import { MeshPayload, MeshRecord } from './types';

/**
 * Store-and-forward record store.
 * Holds records that have not yet been delivered to all peers or anchored to Stellar.
 * Uses the record hash (hex) as the deduplication key.
 */
export class MeshStore {
  private readonly records = new Map<string, MeshRecord>();

  /**
   * Add a record to the store.
   * Throws PAYLOAD_DUPLICATE if the hash has already been seen.
   */
  add(payload: MeshPayload): MeshRecord {
    const key = toHex(payload.recordHash);

    if (this.records.has(key)) {
      throw new MediRelayError(
        ErrorCode.PAYLOAD_DUPLICATE,
        `Record already stored: ${key}`
      );
    }

    const record: MeshRecord = {
      payload,
      receivedAt: new Date().toISOString(),
      relayedTo: [],
      anchored: false,
    };

    this.records.set(key, record);
    return record;
  }

  /** Returns true if a record with this hash is already stored. */
  has(recordHash: Uint8Array): boolean {
    return this.records.has(toHex(recordHash));
  }

  /** Mark a record as relayed to a peer. */
  markRelayed(recordHash: Uint8Array, peerId: string): void {
    const record = this.getByHash(recordHash);
    if (!record.relayedTo.includes(peerId)) {
      record.relayedTo.push(peerId);
    }
  }

  /** Mark a record as anchored to Stellar. */
  markAnchored(recordHash: Uint8Array): void {
    this.getByHash(recordHash).anchored = true;
  }

  /** Get all records not yet anchored to Stellar. */
  getPendingAnchor(): MeshRecord[] {
    return Array.from(this.records.values()).filter((r) => !r.anchored);
  }

  /** Get all records not yet relayed to a specific peer. */
  getPendingForPeer(peerId: string): MeshRecord[] {
    return Array.from(this.records.values()).filter(
      (r) => !r.relayedTo.includes(peerId)
    );
  }

  get size(): number {
    return this.records.size;
  }

  private getByHash(recordHash: Uint8Array): MeshRecord {
    const key = toHex(recordHash);
    const record = this.records.get(key);
    if (!record) {
      throw new MediRelayError(ErrorCode.KEY_NOT_FOUND, `Record not found: ${key}`);
    }
    return record;
  }
}
