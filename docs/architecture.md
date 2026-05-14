# Architecture

## System Overview

MediRelay is composed of three layers:

1. **Mesh Layer** — offline-first, store-and-forward record propagation over Bluetooth and WiFi-Direct
2. **Core Layer** — FHIR R4 record building, CRDT merge, cryptographic signing and encryption
3. **Settlement Layer** — Stellar blockchain anchoring (notarization only, no PHI on-chain)

## Module Responsibilities

### `core/crypto`
- NaCl keypair generation (signing + box)
- Detached signature creation and verification
- Ephemeral-key NaCl box encryption/decryption
- SHA-256 hashing
- DID derivation and parsing (`did:stellar:`)
- In-memory keystore (server/test use only)

### `core/fhir`
- FHIR R4 resource builders: Patient, Encounter, Observation, Immunization, Condition, MedicationRequest, Practitioner, Bundle
- Bundle and resource validation (ISO 8601 UTC timestamps, required fields)

### `core/mesh`
- `MeshPayload` envelope type (version, hash, signature, encrypted bundle, nonce, ephemeral key)
- CBOR serialization/deserialization via `cbor-x`
- `MeshStore` — deduplication by content hash, relay tracking, anchor state
- `buildMeshPayload` — implements the signing flow from `agentic.md`
- `assertPayloadValid` — transport-layer rejection of unsigned/malformed payloads

### `core/crdt`
- `mergeRecords` — Last-Write-Wins with trust-level tiebreaker
- Additive resource preservation (Immunization, Observation, MedicationRequest)
- Conflict flagging via `meta.tag` for unresolvable cases

### `stellar`
- `issueDid` — Stellar keypair → `did:stellar:` DID
- `resolveDid` — DID → Stellar public key
- `AnchorQueue` — in-memory queue with retry on failure
- `buildAnchorSchema` — constructs the on-chain anchor object (no PHI)
- `StellarClient` — loads facility account, builds and submits anchor transactions

### `mobile`
- `WalletContext` — React context for wallet state (connect/disconnect)
- `wallet.ts` — Stellar keypair generation, MMKV encrypted storage
- Screens: WalletScreen, PatientRegistrationScreen, EncounterFormScreen, RecordHistoryScreen

### `server`
- District hub node (Node.js HTTP)
- `POST /relay` — accepts CBOR-encoded MeshPayloads, validates, stores, queues for anchoring
- `GET /health` — returns record count and pending anchor count

## Data Flow

```
Health Worker Device
  │
  ├─ buildPatient / buildEncounter (FHIR R4)
  ├─ buildBundle
  ├─ encodeCBOR
  ├─ sha256 → recordHash
  ├─ sign(recordHash, hwSecretKey)
  ├─ encryptForRecipient(cbor, patientPublicKey)
  └─ buildMeshPayload → MeshPayload
       │
       ▼ Bluetooth / WiFi-Direct
  Relay Node (another device or hub)
       │
       ├─ deserializePayload
       ├─ assertPayloadValid
       ├─ verifyPayloadSignature
       ├─ MeshStore.add (dedup by hash)
       └─ (when online) StellarClient.anchor
            │
            ▼
       Stellar Testnet
       manageData: anchor schema (no PHI)
       memo: sha256 hash
```

## Key Invariants

- Records are immutable once signed. New versions get new signatures.
- No PHI ever reaches the Stellar ledger.
- A node that cannot decrypt a payload still relays it (dumb carrier).
- Deduplication is by content hash — a node never relays the same hash twice.
- All timestamps are ISO 8601 UTC.
