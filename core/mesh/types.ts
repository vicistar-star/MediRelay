import { MESH_PAYLOAD_VERSION } from '../constants';

/** The signed, encrypted envelope broadcast across the mesh. */
export interface MeshPayload {
  version: typeof MESH_PAYLOAD_VERSION;
  recordHash: Uint8Array;       // SHA-256 of the encrypted bundle
  signature: Uint8Array;        // Detached NaCl signature over recordHash
  signerDid: string;            // did:stellar: of the signing health worker
  encryptedBundle: Uint8Array;  // NaCl box ciphertext
  nonce: Uint8Array;            // NaCl box nonce
  ephemeralPublicKey: Uint8Array; // Ephemeral sender public key for box decryption
  timestamp: string;            // ISO 8601 UTC
  facilityId: string;
}

/** Metadata stored locally for deduplication and routing. */
export interface MeshRecord {
  payload: MeshPayload;
  receivedAt: string;   // ISO 8601 UTC
  relayedTo: string[];  // peer IDs already forwarded to
  anchored: boolean;    // true once submitted to Stellar
}
