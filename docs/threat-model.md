# Threat Model

## Scope

This document covers adversarial threats to MediRelay's confidentiality, integrity, and availability. It does not cover physical threats to devices or facilities.

## Assets

| Asset | Sensitivity |
|---|---|
| Patient health records (FHIR bundles) | Critical — PHI |
| Patient DID private keys | Critical — identity |
| Health worker signing keys | High — record forgery if compromised |
| Facility keypair | High — can issue CHW credentials |
| Ministry root public key | Medium — public, but must not be spoofed |
| Stellar anchor transactions | Low — hashes only, no PHI |

## Threat Actors

| Actor | Capability |
|---|---|
| Passive network observer | Can intercept Bluetooth/WiFi-Direct traffic |
| Malicious mesh node | Can relay, drop, or replay payloads |
| Compromised health worker device | Has access to signing key and local records |
| Rogue facility | Can enroll fake health workers if facility key is compromised |
| Stellar ledger inspector | Full read access to on-chain data |

## Threat Analysis

### T1 — Passive interception of mesh traffic
**Mitigation:** All payloads are NaCl box encrypted (Curve25519/XSalsa20/Poly1305) with an ephemeral sender key. An interceptor sees only ciphertext. Forward secrecy is provided by the ephemeral key — compromise of the patient's long-term key does not expose past sessions.

### T2 — Malicious mesh node tampering with records
**Mitigation:** Records are signed with the health worker's keypair before broadcast. A tampered payload will fail signature verification at any receiving node. The content hash in the Stellar anchor provides a second integrity check on settlement.

### T3 — Compromised health worker device
**Mitigation:** On Android, private keys are stored in the Android Keystore and never exported. A compromised device can sign new records but cannot decrypt records encrypted to other patients' DIDs. Key revocation is queued locally and propagated on next mesh contact. **Known gap:** revocation latency window before the next connectivity event.

### T4 — Forged health worker credentials
**Mitigation:** A health worker keypair is only valid if it chains up to a facility key, which chains up to the Ministry root. Issuing a fake CHW credential requires compromising a facility keypair. Facility keys are Ministry-signed and their issuance is auditable on Stellar.

### T5 — Stellar ledger inspection
**Mitigation:** The ledger contains only SHA-256 hashes, patient DIDs (public keys), facility IDs, and timestamps. No names, diagnoses, or clinical data are ever written on-chain. An observer learns only that *a facility recorded something for a DID at a given time* — this is the minimum necessary for auditability.

### T6 — Stolen patient QR card
**Mitigation:** The QR card contains only the patient's public DID. It is useless without the corresponding private key, which never leaves the patient's device (or the health worker's device if the patient has no device).

### T7 — Replay attack (rebroadcasting old payloads)
**Mitigation:** Each `MeshStore` deduplicates by content hash. A replayed payload is silently dropped after the first delivery.

### T8 — Rogue district hub
**Mitigation:** The hub receives CBOR-encoded payloads and validates signatures before storing. It cannot forge records without a valid key in the trust chain. A rogue hub can drop records (availability attack) but cannot inject false ones.

## Known Limitations

- **Offline revocation latency** — a revoked key remains valid on isolated mesh segments until the next connectivity window. This is an open research problem. See [open issues](../../issues).
- **No biometric binding** — patients without devices rely on the health worker's device for key custody. Physical device theft is a residual risk.
- **Ministry root key compromise** — would allow forging the entire trust chain. The Ministry root key must be treated as the highest-value secret in the system and stored in an HSM.
