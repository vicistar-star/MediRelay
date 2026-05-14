<div align="center">

# 🏥 MediRelay

### Offline-First Health Records & Care Coordination on Stellar

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built on Stellar](https://img.shields.io/badge/Built%20on-Stellar-7C3AED)](https://stellar.org)
[![Status: Early Development](https://img.shields.io/badge/Status-Early%20Development-orange)]()
[![Contributions Welcome](https://img.shields.io/badge/Contributions-Welcome-brightgreen)]()
[![FHIR R4](https://img.shields.io/badge/FHIR-R4-red)](https://hl7.org/fhir/R4/)
[![Node.js 20+](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js)](https://nodejs.org)

**Medical infrastructure for the 1.4 billion people who live beyond the reach of reliable internet.**

[Overview](#overview) · [Architecture](#architecture) · [Data Model](#data-model) · [Protocol](#protocol-design) · [Getting Started](#getting-started) · [Security](#security--privacy) · [Roadmap](#roadmap) · [Contributing](#contributing)

</div>

---

## Overview

A community health worker in rural northern Nigeria finishes treating a child for malaria. She fills in a paper form. The form may reach the district health office in weeks — or never. No vaccination history. No drug interaction check. No epidemiological signal for the next outbreak.

**MediRelay fixes this.**

MediRelay is an open-source, offline-first health record and care coordination system. Signed health events propagate across a Bluetooth and WiFi-Direct mesh network between devices — phones, tablets, clinic kiosks — and are cryptographically anchored to the Stellar blockchain the moment any node in the mesh reaches connectivity.

Patients own their records as Stellar Decentralized Identifiers (DIDs). Records are tamper-proof. Care is continuous across facilities, even without a single byte of internet.

### Who This Is For

| Population | Problem MediRelay Solves |
|---|---|
| Rural communities | No persistent patient records across visits or facilities |
| Displaced persons & refugees | Vaccination history and chronic care records lost at borders |
| Disaster relief zones | No record infrastructure after connectivity collapses |
| Community health workers | No real-time logging; paper records lost or delayed |
| Public health authorities | Zero epidemiological visibility from underserved areas |

---

## Key Features

| Feature | Description |
|---|---|
| 🔌 **Offline-first by design** | Full functionality with zero internet; connectivity is an optimization, not a requirement |
| 📡 **Mesh propagation** | Signed health records hop between nearby devices via Bluetooth & WiFi-Direct automatically |
| ⛓️ **Stellar anchoring** | Content hashes anchored on-chain for tamper-evident, auditable records |
| 🪪 **Patient-owned identity** | Every patient gets a Stellar DID; they control their own record access |
| 🏥 **FHIR R4 compatible** | Records follow HL7 FHIR R4 for interoperability with existing health systems |
| 🔐 **Trust hierarchy** | Ministry of Health → Facility → Health Worker key signing chains prevent forged records |
| 🔒 **End-to-end encryption** | Records encrypted at rest and in transit; the blockchain sees only a content hash |
| 🔀 **CRDT-based merge** | Concurrent offline edits by multiple health workers resolve without data loss |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MESH LAYER (Offline)                         │
│                                                                     │
│  [CHW Android App] ←──BT──→ [Clinic Tablet] ←──WiFi-Direct──→ [Hub]│
│         │                          │                          │     │
│   Signs record               Relays + stores            Aggregates  │
│   with keypair               encrypted blob             records     │
│         │                          │                          │     │
│  Patient receives                  │                    Settles to  │
│  record via QR/NFC                 │                    Stellar ───►│
└─────────────────────────────────────────────────────────────────────┘
                                                              │
                                              ┌───────────────▼──────┐
                                              │   STELLAR NETWORK    │
                                              │  (Notarization only) │
                                              │  Hash + metadata     │
                                              │  anchored on-chain   │
                                              │  Patient DID stored  │
                                              └──────────────────────┘
```

### Design Principles

**Stellar is a notary, not a database.** Only the SHA-256 hash of an encrypted FHIR record bundle is written on-chain, alongside patient DID and facility metadata. The full record lives in the mesh and eventually in a permissioned health data store. This keeps costs minimal, privacy intact, and the chain unbloated.

**The mesh is the system.** Connectivity to Stellar is a settlement event, not an operational dependency. A clinic can record and share thousands of patient visits before any node goes online.

**Patients are first-class participants.** A patient receives a copy of their own record on their phone (or a printed QR card) at the point of care. The cryptographic proof is theirs, not an institution's.

---

## Data Model

MediRelay records are [HL7 FHIR R4](https://hl7.org/fhir/R4/) bundles, serialized to compact CBOR for mesh transmission.

### Core Record Types

| FHIR Resource | Use Case |
|---|---|
| `Patient` | Demographic record, linked to Stellar DID |
| `Encounter` | A clinical visit event |
| `Observation` | Vitals, lab results, test outcomes |
| `MedicationRequest` | Prescription issuance |
| `Immunization` | Vaccination record |
| `Condition` | Diagnosis |
| `Practitioner` | Health worker identity (linked to facility keypair) |

### On-Chain Anchor Schema

Each Stellar transaction memo carries:

```json
{
  "v": 1,
  "type": "mediarelay:record",
  "patient_did": "did:stellar:GABCD...XYZ",
  "facility_id": "fac:ng:kano:rural-01",
  "record_hash": "sha256:e3b0c44298fc...",
  "timestamp": "2025-03-14T09:22:00Z"
}
```

> **Privacy note:** No Protected Health Information (PHI) is ever written to the Stellar ledger. The hash is a one-way fingerprint — it proves a record existed and has not been tampered with, without revealing its contents.

---

## Protocol Design

### Identity & Key Hierarchy

```
Ministry of Health (Root Key)
    └── District Health Authority (Intermediate Key)
            └── Facility Keypair
                    └── Health Worker Keypair (issued on device enrollment)
                            └── Patient DID (created at first contact)
```

Each level signs the level below. A forged health worker record is detectable by verifying the chain up to the Ministry root — a public key anchored on Stellar at network bootstrap.

### Record Signing Flow

```
1. Health worker creates a FHIR record on their device
2. Record is signed with the health worker's keypair
3. Counter-signed by the facility keypair (if facility device is in mesh range)
4. Encrypted with the patient's DID public key
5. Broadcast to the mesh as a signed, encrypted CBOR payload
6. Any node that reaches connectivity submits the anchor transaction to Stellar
```

### Conflict Resolution (CRDT Merge)

When two health workers create records for the same patient while offline, MediRelay uses a **Last-Write-Wins CRDT** strategy per field with the following tie-breaking rules:

| Scenario | Resolution |
|---|---|
| Conflicting field values | Higher-trust signer wins (facility > CHW) |
| Additive records (vaccinations, observations) | Both preserved — no conflict |
| Mutually exclusive state (e.g., two diagnoses) | Both preserved, flagged for clinician review on next sync |

### Offline Revocation *(Pending Research)*

Revoking a record or access credential while offline is an unsolved hard problem in MediRelay. Current approach: revocations are queued locally, propagated on mesh contact, and take effect network-wide on the next connectivity window. This creates a revocation latency window — see [open issues](../../issues).

---

## Getting Started

### Prerequisites

- Node.js 20+
- Android SDK (for mobile app development)
- Stellar testnet account ([Stellar Laboratory](https://laboratory.stellar.org))
- A second Android device or emulator (for mesh testing)

### Installation

```bash
git clone https://github.com/your-org/mediarelay.git
cd mediarelay
npm install
```

### Running the Development Server

```bash
# Start the relay node (local simulation)
npm run dev:node

# Start the mobile app in Expo
cd mobile
npx expo start
```

### Setting Up a Test Mesh

```bash
# Simulate a two-node mesh locally
npm run mesh:sim -- --nodes 2

# Run the full integration test suite
npm test
```

### Stellar Configuration

Copy `.env.example` to `.env` and populate:

```env
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
MINISTRY_ROOT_PUBLIC_KEY=GABC...
FACILITY_KEYPAIR_SECRET=SABC...    # Never commit this
```

> ⚠️ **Never commit secret keys.** `.env` is in `.gitignore`. Use a secrets manager for production deployments.

---

## Repository Structure

```
mediarelay/
├── core/                   # Mesh protocol, CRDT engine, crypto primitives
│   ├── mesh/               # Bluetooth & WiFi-Direct transport layer
│   ├── crdt/               # Conflict resolution engine
│   ├── crypto/             # Key management, signing, DID utilities
│   └── fhir/               # FHIR R4 record builders and validators
├── stellar/                # Stellar anchoring, DID registry, trust chain
├── mobile/                 # React Native + Expo Android app
│   ├── screens/            # Patient registration, encounter forms, history
│   └── components/         # Shared UI components
├── server/                 # Optional: district hub node (Node.js)
├── scripts/                # Mesh simulation, key generation, test utilities
├── docs/                   # Architecture deep-dives, protocol specs
└── tests/                  # Unit, integration, and mesh simulation tests
```

---

## Security & Privacy

MediRelay handles sensitive medical data. The following are design requirements, not optional features.

| Property | Implementation |
|---|---|
| **No PHI on-chain** | Stellar stores only hashes and non-identifying metadata |
| **Cryptographic consent** | Patients can generate a new DID keypair to revoke all historical access grants |
| **Device-bound keys** | Private keys stored in Android Keystore; never leave the device |
| **Encrypted mesh transport** | All payloads use NaCl box encryption (Curve25519/XSalsa20/Poly1305) |
| **Immutable audit log** | Every record access and modification is anchored to Stellar on settlement |

### Threat Model

- **Compromised health worker device** — key revocation propagates on next mesh contact; records remain encrypted to patient DID
- **Malicious mesh node** — cannot forge records without a valid key in the trust chain; tampering is detectable via hash verification
- **Stellar ledger inspection** — reveals only hashes and facility IDs; no clinical data is recoverable from on-chain data alone

### Regulatory Posture

MediRelay is designed for jurisdictions where FHIR and blockchain-based health records are either nascent or unregulated. Operators deploying in jurisdictions with active health data regulation (NDPR in Nigeria, POPIA in South Africa, HIPAA in the US, etc.) must conduct their own legal review. See [docs/regulatory.md](docs/regulatory.md).

---

## Roadmap

### v0.1 — Foundation *(In Progress)*
- [ ] Core FHIR record builder (Patient, Encounter, Observation, Immunization)
- [ ] Stellar DID issuance and resolution
- [ ] Basic Bluetooth mesh propagation (two-node)
- [ ] Record signing and verification (CHW keypair)
- [ ] Stellar testnet anchoring

### v0.2 — Mesh Maturity
- [ ] WiFi-Direct transport layer
- [ ] Multi-hop mesh routing (store-and-forward)
- [ ] CRDT conflict resolution engine
- [ ] Full trust hierarchy (MoH → Facility → CHW key chain)

### v0.3 — Patient Experience
- [ ] Patient DID issuance at first contact
- [ ] QR-code and NFC record delivery to patient device
- [ ] Patient-facing record viewer (read-only, offline)
- [ ] Biometric binding for patients without devices

### v0.4 — Field Readiness
- [ ] District hub node (server-side aggregator)
- [ ] OpenMRS and DHIS2 export adapters
- [ ] Offline revocation propagation
- [ ] Security audit

### v1.0 — Pilot Deployment
- [ ] Field pilot with partner NGO (target: rural Nigeria or DRC)
- [ ] Ministry of Health integration documentation
- [ ] Full regulatory compliance documentation

---

## Contributing

MediRelay is early-stage and contributions are very welcome. The hardest problems are open — mesh routing, offline revocation, and the CRDT merge strategy in particular need rigorous thinking.

### Areas Where We Need Help

| Domain | What's Needed |
|---|---|
| **Protocol design** | Offline revocation, multi-party consent, key recovery |
| **Android development** | Bluetooth/WiFi-Direct mesh transport layer |
| **FHIR expertise** | Record profile design for low-resource settings |
| **Stellar development** | DID registry contracts, anchor optimization |
| **Field research** | CHW workflow studies, device constraint research |
| **Translation** | Hausa, Swahili, French, Arabic for the mobile app |

### How to Contribute

```bash
# Fork the repo, then:
git checkout -b feature/your-feature-name
npm test                          # All tests must pass
git commit -m "feat: description" # Conventional Commits
git push origin feature/your-feature-name
# Open a pull request
```

Look for issues tagged [`good-first-issue`](../../issues?q=label%3Agood-first-issue) for well-scoped entry points that don't require deep protocol knowledge.

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a PR. We follow [Conventional Commits](https://www.conventionalcommits.org/).

---

## Partners & Acknowledgements

MediRelay is inspired by [StellarConduit](https://github.com/stellarconduit) and builds on the work of the [Stellar Development Foundation](https://stellar.org/foundation), the [FHIR community](https://hl7.org/fhir/), and the many researchers who have studied offline-first systems for global health.

If you are an NGO, health ministry, or research institution interested in piloting MediRelay, reach out at **[hello@mediarelay.org](mailto:hello@mediarelay.org)** *(placeholder)*.

---

## License

MediRelay is released under the [MIT License](LICENSE).

> Medical record data generated by MediRelay deployments belongs to patients and operating institutions — not to this project.

---

<div align="center">

**Built for the clinics at the end of the road.**

*If you believe health records are a human right, star this repo and tell someone.*

⭐ [Star on GitHub](https://github.com/your-org/mediarelay) · 🐛 [Report an Issue](../../issues/new) · 💬 [Start a Discussion](../../discussions)

</div>
