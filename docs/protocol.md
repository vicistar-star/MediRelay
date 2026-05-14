# Protocol Specification

## Wire Format

All mesh payloads are CBOR-encoded `MeshPayload` objects:

```typescript
interface MeshPayload {
  version: 1;
  recordHash: Uint8Array;        // SHA-256(CBOR(fhirBundle))
  signature: Uint8Array;         // NaCl detached signature over recordHash
  signerDid: string;             // did:stellar:<publicKey>
  encryptedBundle: Uint8Array;   // NaCl box ciphertext
  nonce: Uint8Array;             // 24-byte NaCl nonce
  ephemeralPublicKey: Uint8Array; // Ephemeral Curve25519 public key
  timestamp: string;             // ISO 8601 UTC
  facilityId: string;            // e.g. "fac:ng:kano:rural-01"
}
```

## Signing Flow

1. Build FHIR R4 bundle
2. Serialize to CBOR (`cbor-x`)
3. `recordHash = SHA-256(cbor)`
4. `signature = nacl.sign.detached(recordHash, healthWorkerSecretKey)`
5. `encryptedBundle = nacl.box(cbor, nonce, patientPublicKey, ephemeralSecretKey)`
6. Wrap in `MeshPayload` and CBOR-encode for broadcast

## On-Chain Anchor Schema

```json
{
  "v": 1,
  "type": "mediarelay:record",
  "patient_did": "did:stellar:G...",
  "facility_id": "fac:ng:kano:rural-01",
  "record_hash": "sha256:<64-char hex>",
  "timestamp": "2026-01-15T09:00:00Z"
}
```

Stored in a Stellar `manageData` operation. The transaction memo carries the raw SHA-256 hash bytes.

## Trust Chain

```
Ministry of Health (Root Key) — anchored on Stellar at bootstrap
  └── District Health Authority
        └── Facility Keypair
              └── Health Worker Keypair
                    └── Patient DID
```

Each level signs the level below. Verification walks the chain up to the Ministry root.

## CRDT Merge Rules

| Resource Type | Rule |
|---|---|
| Immunization, Observation, MedicationRequest | Additive — both preserved |
| All others (Condition, Patient demographics) | Last-Write-Wins by timestamp |
| Tie within 60s | Higher trust level wins (facility > CHW) |
| Unresolvable tie | Both preserved, `meta.tag` conflict flag set |
