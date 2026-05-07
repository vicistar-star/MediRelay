import { toHex } from '../core/crypto/crypto';
import { ANCHOR_RECORD_TYPE, ANCHOR_SCHEMA_VERSION } from '../core/constants';

export interface AnchorPayload {
  recordHash: Uint8Array;
  patientDid: string;
  facilityId: string;
  timestamp: string; // ISO 8601 UTC
}

export interface QueuedAnchor extends AnchorPayload {
  queuedAt: string;
  attempts: number;
  lastError?: string;
}

export interface AnchorSchema {
  v: number;
  type: string;
  patient_did: string;
  facility_id: string;
  record_hash: string; // "sha256:<hex>"
  timestamp: string;
}

/** Build the on-chain anchor schema object from an anchor payload. */
export function buildAnchorSchema(payload: AnchorPayload): AnchorSchema {
  return {
    v: ANCHOR_SCHEMA_VERSION,
    type: ANCHOR_RECORD_TYPE,
    patient_did: payload.patientDid,
    facility_id: payload.facilityId,
    record_hash: `sha256:${toHex(payload.recordHash)}`,
    timestamp: payload.timestamp,
  };
}

/**
 * In-memory anchor queue.
 * Persists pending anchors across connectivity gaps.
 * In production this would be backed by encrypted local storage.
 */
export class AnchorQueue {
  private readonly queue: QueuedAnchor[] = [];

  enqueue(payload: AnchorPayload): void {
    this.queue.push({
      ...payload,
      queuedAt: new Date().toISOString(),
      attempts: 0,
    });
  }

  peek(): QueuedAnchor | undefined {
    return this.queue[0];
  }

  dequeue(): QueuedAnchor | undefined {
    return this.queue.shift();
  }

  recordFailure(anchor: QueuedAnchor, error: string): void {
    anchor.attempts += 1;
    anchor.lastError = error;
    // Re-enqueue at the back for retry
    this.queue.push(anchor);
  }

  get size(): number {
    return this.queue.length;
  }

  isEmpty(): boolean {
    return this.queue.length === 0;
  }
}
