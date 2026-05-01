// All magic numbers and string constants live here.
// Never inline these values in business logic.

export const MESH_PAYLOAD_VERSION = 1;
export const ANCHOR_SCHEMA_VERSION = 1;
export const DID_METHOD = 'stellar';
export const DID_PREFIX = `did:${DID_METHOD}:`;

// CRDT trust levels — higher number = higher trust
export const TRUST_LEVEL = {
  PATIENT: 0,
  HEALTH_WORKER: 1,
  FACILITY: 2,
  DISTRICT: 3,
  MINISTRY: 4,
} as const;

// If two timestamps are within this window, use trust level as tiebreaker
export const CRDT_TIMESTAMP_TOLERANCE_MS = 60_000;

// Stellar memo is limited to 28 bytes for text; we use hash memo type
export const STELLAR_MEMO_TYPE = 'hash';

// NaCl box nonce length in bytes
export const NACL_NONCE_LENGTH = 24;

// SHA-256 output length in bytes
export const SHA256_LENGTH = 32;

// Conflict tag used in FHIR meta when CRDT cannot resolve
export const CONFLICT_TAG_SYSTEM = 'mediarelay:conflict';
export const CONFLICT_TAG_CODE = 'needs-review';

// Anchor schema record type prefix
export const ANCHOR_RECORD_TYPE = 'mediarelay:record';
