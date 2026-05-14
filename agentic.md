# AGENTS.md — MediRelay

This file is written for AI coding agents (Claude Code, Cursor, Copilot Workspace, Devin, etc.).
Read it fully before writing any code, creating any file, or modifying any existing module.
It overrides general coding instincts wherever they conflict.

---

## What This Project Is

MediRelay is an **offline-first health record system** built on the Stellar blockchain. It propagates cryptographically signed FHIR R4 records across a Bluetooth/WiFi-Direct mesh and anchors content hashes to Stellar when connectivity is available.

The target environment is a **low-end Android device in a rural clinic with no internet**. Every architectural decision flows from that constraint.

---

## Project Structure

```
mediarelay/
├── core/
│   ├── mesh/        # Bluetooth & WiFi-Direct transport
│   ├── crdt/        # Conflict resolution engine
│   ├── crypto/      # Key management, signing, DID utilities
│   └── fhir/        # FHIR R4 record builders and validators
├── stellar/         # Anchoring, DID registry, trust chain verification
├── mobile/          # React Native + Expo Android app
│   ├── screens/
│   └── components/
├── server/          # District hub node (Node.js, optional)
├── scripts/         # Mesh simulation, key generation, test utilities
├── docs/            # Architecture specs
└── tests/           # Unit, integration, mesh simulation
```

Always create files in the correct directory. Never create ad-hoc utility files at the repo root.

---

## Hard Rules — Never Violate These

### Security

- **Never store private keys outside the Android Keystore.** Do not write keypair secrets to AsyncStorage, SQLite, the filesystem, or any JS-accessible variable that persists beyond a signing operation.
- **Never log private keys, raw record plaintext, or patient identifiers** — not even at debug level.
- **Never put PHI (Protected Health Information) on-chain.** The Stellar ledger receives only: content hash, patient DID, facility ID, record type, and timestamp. Nothing else. No names, diagnoses, medication details, or demographics.
- **Never transmit unencrypted FHIR payloads** over the mesh. All mesh payloads must be NaCl box encrypted (Curve25519/XSalsa20/Poly1305) before broadcast.
- **Never trust an incoming mesh record without verifying its signature chain** up to the Ministry root public key.

### Data Format

- **Always serialize mesh payloads as CBOR**, not JSON. JSON is too verbose for Bluetooth bandwidth constraints. Use the `cbor-x` library.
- **Always validate FHIR records against R4 schemas** before signing or storing. Use `fhir-kit-client` or the local validator in `core/fhir/validator.ts`.
- **Always use ISO 8601 UTC timestamps** (`2025-03-14T09:22:00Z`). Never use local time or Unix epoch integers in record fields.
- **Always use `did:stellar:` as the DID method prefix** for patient identifiers. Example: `did:stellar:GABCDXYZ...`

### Stellar

- **Stellar is a notary, not a database.** Never store full records or record fragments on-chain. Only anchor the SHA-256 hash.
- **Always use the Stellar testnet** (`https://horizon-testnet.stellar.org`) unless the environment variable `STELLAR_NETWORK=mainnet` is explicitly set.
- **Always check connectivity before submitting** a Stellar transaction. Queue transactions in `stellar/anchorQueue.ts` if offline; flush on reconnect.
- **Always use the memo field** for the anchor schema object (see README). Never use custom assets or data entries for anchoring.
- **Transaction fees:** use `StellarSdk.BASE_FEE` — never hardcode a fee value.

### Mesh Protocol

- **Records are immutable once signed.** Never mutate a signed record. Create a new version with a new signature instead.
- **Mesh routing is store-and-forward.** A node that receives a record it cannot immediately deliver must store it and forward it on next peer contact. Never drop a record silently.
- **Deduplication:** use the record's content hash as the dedup key. A node that has already relayed a hash must not relay it again.
- **Never broadcast a record without a valid health worker signature.** Unsigned or self-signed payloads must be rejected at the transport layer.

---

## Key Architectural Patterns

### Record Signing (always follow this flow)

```typescript
// 1. Build the FHIR bundle
const bundle = buildEncounterBundle(patientDid, encounterData);

// 2. Serialize to CBOR
const cbor = encodeCBOR(bundle);

// 3. Hash it
const hash = sha256(cbor);

// 4. Sign the hash with the health worker keypair (from Android Keystore)
const signature = await keystore.sign(hash, healthWorkerKeyId);

// 5. Wrap in a MeshPayload envelope
const payload: MeshPayload = {
  version: 1,
  recordHash: hash,
  signature,
  signerDid: healthWorkerDid,
  encryptedBundle: nacl.box(cbor, patientPublicKey, ephemeralKeypair),
  timestamp: new Date().toISOString(),
};

// 6. Broadcast
mesh.broadcast(encodeCBOR(payload));
```

### CRDT Merge Rules

When merging two records for the same patient from offline sources:

- **Additive resources** (Immunization, Observation, MedicationRequest) — always append both; never deduplicate by content.
- **Singular state resources** (Condition status, Patient demographics) — Last-Write-Wins per field, using `timestamp` as the tiebreaker.
- **Trust-based tiebreaker** — if timestamps are equal or within 60 seconds, the record signed by the higher-trust key wins: `facility keypair > health worker keypair`.
- **Conflict flag** — if neither rule resolves the conflict cleanly, set `meta.tag` with `{ system: "mediarelay:conflict", code: "needs-review" }` and preserve both versions.

Never silently discard either version of a conflicting record.

### Trust Chain Verification

```typescript
// Always verify the full chain before accepting a record
async function verifyTrustChain(payload: MeshPayload): Promise<boolean> {
  const hwCert = await resolveDID(payload.signerDid);
  const facilityCert = await resolveDID(hwCert.issuerId);
  const districtCert = await resolveDID(facilityCert.issuerId);
  const ministryKey = await getMinistryRootKey(); // anchored on Stellar at bootstrap

  return (
    verifySignature(payload.signature, payload.recordHash, hwCert.publicKey) &&
    verifySignature(hwCert.proof, hwCert.publicKey, facilityCert.publicKey) &&
    verifySignature(facilityCert.proof, facilityCert.publicKey, districtCert.publicKey) &&
    verifySignature(districtCert.proof, districtCert.publicKey, ministryKey)
  );
}
```

---

## Dependencies — Approved Libraries

Use only these for the listed purposes. Do not introduce alternatives without updating this file.

| Purpose | Library |
|---|---|
| CBOR serialization | `cbor-x` |
| Cryptography (NaCl) | `tweetnacl` |
| FHIR R4 types | `@types/fhir` |
| FHIR validation | `fhir-kit-client` |
| Stellar SDK | `@stellar/stellar-sdk` |
| Bluetooth mesh (Android) | `react-native-ble-plx` |
| WiFi-Direct (Android) | `react-native-wifi-p2p` |
| Local storage (encrypted) | `react-native-mmkv` (never AsyncStorage for sensitive data) |
| QR code generation | `react-native-qrcode-svg` |
| NFC | `react-native-nfc-manager` |
| Testing | `jest` + `@testing-library/react-native` |

---

## Testing Requirements

- **Every function in `core/`** must have a unit test.
- **Every mesh protocol interaction** must have an integration test using the mesh simulator in `scripts/mesh-sim.ts`.
- **Crypto functions** must be tested with known vectors — do not test only against their own output.
- **CRDT merge** must have tests for all three cases: additive, LWW, and conflict-flagged.
- Run `npm test` before considering any task complete. Do not present code as done if tests are failing.

---

## Code Style

- **TypeScript strict mode** — no `any`, no `as unknown`, no `@ts-ignore`.
- **No side effects at module load time** — all initialization is explicit and async.
- **Errors are typed** — use a `MediRelayError` base class with an `errorCode` enum. Never throw raw strings.
- **Functions are small** — if a function exceeds ~40 lines, it is doing too much. Split it.
- **No magic numbers** — all constants live in `core/constants.ts`.
- **Comments explain why, not what** — code should be self-explanatory; comments are for non-obvious decisions.

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `STELLAR_NETWORK` | No | `testnet` | `testnet` or `mainnet` |
| `STELLAR_HORIZON_URL` | No | testnet URL | Horizon endpoint |
| `MINISTRY_ROOT_PUBLIC_KEY` | Yes | — | Stellar public key of MoH root |
| `FACILITY_KEYPAIR_SECRET` | Yes (server only) | — | Never on mobile |
| `LOG_LEVEL` | No | `info` | `debug`, `info`, `warn`, `error` |

Never read env vars directly in business logic. Always go through `config/env.ts`.

---

## What Is Currently Unimplemented (Do Not Fake It)

These are open research problems. If a task requires them, flag it and stop — do not invent a placeholder implementation that silently does the wrong thing.

- **Offline revocation propagation** — the mechanism to propagate a key revocation across the mesh before any node goes online is not yet designed.
- **Biometric binding** — linking a patient DID to a fingerprint or iris scan on devices without a secure enclave.
- **Multi-party consent** — a patient authorizing multiple facilities simultaneously while offline.

---

## When in Doubt

1. Re-read the relevant section of `README.md`.
2. Check `docs/` for a deeper spec.
3. If still ambiguous, write a comment in the code as `// AGENT-QUESTION: <your question>` and stop. Do not guess on security or protocol decisions.