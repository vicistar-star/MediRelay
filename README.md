<div align="center">

# 🏥 MediRelay

### Offline-First Health Records & Care Coordination on Stellar

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built on Stellar](https://img.shields.io/badge/Built%20on-Stellar-7C3AED)](https://stellar.org)
[![Status: Early Development](https://img.shields.io/badge/Status-Early%20Development-orange)]()
[![Contributions Welcome](https://img.shields.io/badge/Contributions-Welcome-brightgreen)]()
[![FHIR R4](https://img.shields.io/badge/FHIR-R4-red)](https://hl7.org/fhir/R4/)
[![Node.js 20+](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js)](https://nodejs.org)
[![CI](https://github.com/your-org/mediarelay/actions/workflows/ci.yml/badge.svg)](.github/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/Tests-48%20passing-brightgreen)](.github/workflows/ci.yml)

<br/>

> **Medical infrastructure for the 1.4 billion people who live beyond the reach of reliable internet.**

<br/>

[Overview](#overview) · [Why It Matters](#why-it-matters) · [Architecture](#architecture) · [Data Model](#data-model) · [Protocol](#protocol-design) · [Getting Started](#getting-started) · [Security](#security--privacy) · [Roadmap](#roadmap) · [Contributing](#contributing)

</div>

---

## Overview

A community health worker in rural northern Nigeria finishes treating a child for malaria. She fills in a paper form. The form may reach the district health office in weeks — or never. No vaccination history. No drug interaction check. No epidemiological signal for the next outbreak.

**MediRelay fixes this.**

MediRelay is an open-source, offline-first health record and care coordination system. Signed health events propagate across a Bluetooth and WiFi-Direct mesh network between devices — phones, tablets, clinic kiosks — and are cryptographically anchored to the Stellar blockchain the moment any node in the mesh reaches connectivity.

Patients own their records as Stellar Decentralized Identifiers (DIDs). Records are tamper-proof. Care is continuous across facilities, even without a single byte of internet.

---

## Why It Matters

The global health data gap is not a technology problem — it's an infrastructure problem. Existing electronic health record systems assume persistent connectivity, reliable power, and institutional IT support. None of those exist at the last mile.

The consequences are severe:

- **Vaccine-preventable deaths** occur because a child's immunization history is on a paper card that was lost at a border crossing.
- **Drug resistance** spreads because no system tracks antibiotic prescriptions across informal clinics.
- **Epidemics go undetected** for weeks because case data never reaches the district health office in time to trigger a response.
- **Chronic disease management fails** because a patient with hypertension sees a different health worker at every visit, with no shared record.

MediRelay treats connectivity as a luxury, not a prerequisite. The system works in the hardest environments first — and gets better as infrastructure improves.

### Who This Is For

| Population | Problem MediRelay Solves |
|---|---|
| 🌍 Rural communities | No persistent patient records across visits or facilities |
| 🚶 Displaced persons & refugees | Vaccination history and chronic care records lost at borders |
| 🆘 Disaster relief zones | No record infrastructure after connectivity collapses |
| 👩‍⚕️ Community health workers | No real-time logging; paper records lost or delayed |
| 🏛️ Public health authorities | Zero epidemiological visibility from underserved areas |

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
| 📲 **Patient record delivery** | Patients receive their own records via QR code or NFC at the point of care |
| 🔍 **Verifiable provenance** | Every record carries a cryptographic chain of custody from health worker to Ministry root |

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

**Stellar is a notary, not a database.**
Only the SHA-256 hash of an encrypted FHIR record bundle is written on-chain, alongside patient DID and facility metadata. The full record lives in the mesh and eventually in a permissioned health data store. This keeps costs minimal, privacy intact, and the chain unbloated.

**The mesh is the system.**
Connectivity to Stellar is a settlement event, not an operational dependency. A clinic can record and share thousands of patient visits before any node goes online. When connectivity arrives — even briefly — the backlog settles automatically.

**Patients are first-class participants.**
A patient receives a copy of their own record on their phone (or a printed QR card) at the point of care. The cryptographic proof is theirs, not an institution's. They can walk into any MediRelay-enabled facility and present their record without depending on a central server.

**Trust is earned, not assumed.**
Every record carries a verifiable chain of custody. A health worker's signature is only valid if it chains up to a facility key, which chains up to a district authority, which chains up to the Ministry of Health root — a public key anchored on Stellar at network bootstrap. Forgery is cryptographically impossible without compromising the chain.

---

## Data Model

MediRelay records are [HL7 FHIR R4](https://hl7.org/fhir/R4/) bundles, serialized to compact [CBOR](https://cbor.io/) for efficient mesh transmission. FHIR R4 was chosen for its global adoption, extensibility, and compatibility with OpenMRS, DHIS2, and national health information systems.

### Core Record Types

| FHIR Resource | Use Case | Notes |
|---|---|---|
| `Patient` | Demographic record | Linked to Stellar DID; no PHI on-chain |
| `Encounter` | A clinical visit event | Timestamped, signed by attending CHW |
| `Observation` | Vitals, lab results, test outcomes | Supports LOINC codes |
| `MedicationRequest` | Prescription issuance | Tracks drug, dose, duration |
| `Immunization` | Vaccination record | Additive — never overwritten |
| `Condition` | Diagnosis | ICD-10 coded; flagged on conflict |
| `Practitioner` | Health worker identity | Linked to facility keypair |

### On-Chain Anchor Schema

Each Stellar transaction memo carries a minimal, non-identifying anchor payload:

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

> **Privacy note:** No Protected Health Information (PHI) is ever written to the Stellar ledger. The hash is a one-way fingerprint — it proves a record existed and has not been tampered with, without revealing its contents. An observer with full ledger access learns only that *a facility recorded something for a DID at a given time*.

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

Each level signs the level below. A forged health worker record is detectable by verifying the chain up to the Ministry root — a public key anchored on Stellar at network bootstrap. This means trust is decentralized but not trustless: the Ministry is the root of authority, and that root is publicly auditable.

### Record Signing Flow

```
1. Health worker creates a FHIR record on their device
2. Record is signed with the health worker's keypair
3. Counter-signed by the facility keypair (if facility device is in mesh range)
4. Encrypted with the patient's DID public key
5. Broadcast to the mesh as a signed, encrypted CBOR payload
6. Any node that reaches connectivity submits the anchor transaction to Stellar
```

Steps 3 and 6 are opportunistic — the record is valid and usable without them. Counter-signing and on-chain anchoring happen automatically when the conditions are met, with no action required from the health worker.

### Mesh Propagation

Records travel as signed, encrypted blobs. A node that receives a record it cannot decrypt still relays it — it acts as a dumb carrier, not a gatekeeper. This means:

- A CHW's phone can relay records from another CHW even without knowing their patient.
- A clinic hub aggregates records from dozens of CHWs who pass through its Bluetooth range.
- A district server, when it comes online, pulls the full backlog from any hub it can reach.

The mesh is store-and-forward. Records are never dropped — only delivered later.

### Conflict Resolution (CRDT Merge)

When two health workers create records for the same patient while offline, MediRelay uses a **Last-Write-Wins CRDT** strategy per field with the following tie-breaking rules:

| Scenario | Resolution |
|---|---|
| Conflicting field values | Higher-trust signer wins (facility > CHW) |
| Additive records (vaccinations, observations) | Both preserved — no conflict |
| Mutually exclusive state (e.g., two diagnoses) | Both preserved, flagged for clinician review on next sync |

The goal is to never silently discard clinical data. When in doubt, preserve both versions and surface the conflict to a human.

### Offline Revocation *(Pending Research)*

Revoking a record or access credential while offline is an unsolved hard problem in MediRelay. Current approach: revocations are queued locally, propagated on mesh contact, and take effect network-wide on the next connectivity window. This creates a revocation latency window.

This is a known limitation and an active area of research. If you have expertise in offline-capable revocation schemes (CRLs, OCSP stapling alternatives, or novel approaches), [we want to hear from you](../../issues).

---

## Getting Started

### Prerequisites

| Requirement | Purpose |
|---|---|
| Node.js 20+ | Core relay node and tooling |
| Android SDK | Mobile app development |
| [Stellar testnet account](https://laboratory.stellar.org) | On-chain anchoring during development |
| Second Android device or emulator | Mesh testing |

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
# Simulate a two-node mesh locally (two nodes, local TCP transport)
npm run mesh:sim

# Run the full integration test suite
npm test
```

The mesh simulator creates two virtual nodes that exchange signed records over a local socket, mimicking Bluetooth transport. It's the fastest way to develop and test mesh logic without physical devices.

### Stellar Configuration

Copy `.env.example` to `.env` and populate:

```env
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
MINISTRY_ROOT_PUBLIC_KEY=GABC...
FACILITY_KEYPAIR_SECRET=SABC...    # Never commit this
```

> ⚠️ **Never commit secret keys.** `.env` is in `.gitignore`. Use a secrets manager for production deployments. The `FACILITY_KEYPAIR_SECRET` is the most sensitive value — it signs all records from your facility and its compromise would allow record forgery.

### Generating Test Keys

```bash
# Generate a full test key hierarchy (MoH → District → Facility → CHW)
npm run keygen:hierarchy

# Generate a single keypair
npm run keygen -- --role chw --facility fac:ng:kano:rural-01
```

---

## Repository Structure

```
mediarelay/
├── core/                   # Mesh protocol, CRDT engine, crypto primitives
│   ├── mesh/               # Transport layer (store-and-forward, CBOR, payload signing)
│   ├── crdt/               # Conflict resolution engine
│   ├── crypto/             # Key management, signing, DID utilities
│   └── fhir/               # FHIR R4 record builders and validators
├── stellar/                # Stellar anchoring, DID registry, trust chain
├── mobile/                 # React Native + Expo Android app
│   └── src/
│       ├── screens/        # WalletScreen, PatientRegistration, EncounterForm, RecordHistory
│       ├── context/        # WalletContext (Stellar wallet state)
│       └── lib/            # wallet.ts (keypair generation, MMKV encrypted storage)
├── server/                 # District hub node (Node.js, optional)
├── scripts/                # Mesh simulation, key generation utilities
├── config/                 # env.ts — all environment variable access
├── docs/                   # Architecture deep-dives, protocol specs
│   ├── architecture.md     # Detailed system design
│   ├── protocol.md         # Wire format and signing spec
│   ├── threat-model.md     # Full adversarial analysis
│   └── regulatory.md       # Jurisdiction-specific compliance notes
└── tests/                  # Unit, integration, and mesh simulation tests
```

---

## Security & Privacy

MediRelay handles sensitive medical data. The following are design requirements, not optional features. Every architectural decision is evaluated against them.

| Property | Implementation |
|---|---|
| **No PHI on-chain** | Stellar stores only hashes and non-identifying metadata |
| **Cryptographic consent** | Patients can generate a new DID keypair to revoke all historical access grants |
| **Device-bound keys** | Private keys stored in Android Keystore; never leave the device |
| **Encrypted mesh transport** | All payloads use NaCl box encryption (Curve25519/XSalsa20/Poly1305) |
| **Immutable audit log** | Every record access and modification is anchored to Stellar on settlement |
| **Forward secrecy** | Per-session ephemeral keys for mesh transport; compromise of a long-term key does not expose past sessions |

### Threat Model

| Threat | Mitigation |
|---|---|
| Compromised health worker device | Key revocation propagates on next mesh contact; records remain encrypted to patient DID |
| Malicious mesh node relaying tampered records | Cannot forge records without a valid key in the trust chain; tampering detectable via hash verification |
| Stellar ledger inspection | Reveals only hashes and facility IDs; no clinical data recoverable from on-chain data alone |
| Stolen patient QR card | Card contains only the patient's public DID; useless without the corresponding private key |
| Rogue facility enrolling fake health workers | Facility keypair required to issue CHW credentials; facility keys are Ministry-signed |

For the full adversarial analysis, see [docs/threat-model.md](docs/threat-model.md).

### Regulatory Posture

MediRelay is designed for jurisdictions where FHIR and blockchain-based health records are either nascent or unregulated. Operators deploying in jurisdictions with active health data regulation must conduct their own legal review:

| Jurisdiction | Relevant Regulation |
|---|---|
| Nigeria | NDPR (Nigeria Data Protection Regulation) |
| South Africa | POPIA (Protection of Personal Information Act) |
| Kenya | Data Protection Act 2019 |
| United States | HIPAA |
| European Union | GDPR |

See [docs/regulatory.md](docs/regulatory.md) for jurisdiction-specific deployment guidance.

---

## Roadmap

MediRelay is built in public. Every milestone is a deployable, testable increment — not a feature dump.

### v0.1 — Foundation ✅ *Complete*
- [x] Core FHIR record builder (Patient, Encounter, Observation, Immunization)
- [x] Stellar DID issuance and resolution
- [x] Basic mesh propagation (two-node, local TCP simulator)
- [x] Record signing and verification (CHW keypair)
- [x] Stellar testnet anchoring

### v0.2 — Mesh Maturity *(In Progress)*
- [ ] WiFi-Direct transport layer
- [ ] Multi-hop mesh routing (store-and-forward)
- [x] CRDT conflict resolution engine
- [ ] Full trust hierarchy (MoH → Facility → CHW key chain)

### v0.3 — Patient Experience
- [ ] Patient DID issuance at first contact
- [ ] QR-code and NFC record delivery to patient device
- [ ] Patient-facing record viewer (read-only, offline)
- [ ] Biometric binding for patients without devices

### v0.4 — Field Readiness
- [x] District hub node (server-side aggregator)
- [ ] OpenMRS and DHIS2 export adapters
- [ ] Offline revocation propagation
- [ ] Independent security audit

### v1.0 — Pilot Deployment
- [ ] Field pilot with partner NGO (target: rural Nigeria or DRC)
- [ ] Ministry of Health integration documentation
- [ ] Full regulatory compliance documentation
- [ ] Localization: Hausa, Swahili, French, Arabic

---

## Contributing

MediRelay is early-stage and contributions are very welcome. The hardest problems are open — mesh routing, offline revocation, and the CRDT merge strategy in particular need rigorous thinking. You don't need to be a blockchain developer to contribute meaningfully.

### Areas Where We Need Help

| Domain | What's Needed | Difficulty |
|---|---|---|
| **Protocol design** | Offline revocation, multi-party consent, key recovery | 🔴 Hard |
| **Android development** | Bluetooth/WiFi-Direct mesh transport layer | 🟠 Medium |
| **FHIR expertise** | Record profile design for low-resource settings | 🟠 Medium |
| **Stellar development** | DID registry contracts, anchor optimization | 🟠 Medium |
| **Testing** | Mesh simulation, adversarial test cases | 🟢 Accessible |
| **Field research** | CHW workflow studies, device constraint research | 🟢 Accessible |
| **Translation** | Hausa, Swahili, French, Arabic for the mobile app | 🟢 Accessible |
| **Documentation** | Protocol specs, deployment guides, API docs | 🟢 Accessible |

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

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a PR. We follow [Conventional Commits](https://www.conventionalcommits.org/). All contributors are expected to uphold the [Code of Conduct](CODE_OF_CONDUCT.md).

Pull requests are validated automatically by [GitHub Actions CI](.github/workflows/ci.yml) — type check and all 48 tests must pass.

### Development Philosophy

We write code for the worst-case device: a 3-year-old Android phone with 2GB RAM, intermittent power, and no data plan. Performance, battery efficiency, and minimal storage footprint are first-class concerns — not afterthoughts.

---

## FAQ

**Q: Why Stellar and not Ethereum or another chain?**
Stellar's transaction fees are fractions of a cent, finality is ~5 seconds, and it has native support for DIDs and key management. For a system anchoring thousands of health records per day from low-income settings, cost and speed matter enormously. Ethereum gas fees would make this economically unviable.

**Q: What happens if the Stellar network is unreachable for weeks?**
Nothing breaks. Records are created, signed, and shared across the mesh entirely without Stellar. The blockchain is a settlement layer — it receives the backlog when connectivity returns. A clinic that has been offline for a month will anchor all its records in a batch the next time any device reaches the internet.

**Q: Can MediRelay replace a full EHR system?**
No, and it's not trying to. MediRelay is a record transport and anchoring layer for environments where no EHR exists. It is designed to feed into systems like OpenMRS and DHIS2, not replace them. In areas with existing infrastructure, MediRelay acts as a bridge for the offline periphery.

**Q: How does a patient access their records without a smartphone?**
At the point of care, the health worker can print a QR card containing the patient's DID and a signed record summary. The card is human-readable and machine-verifiable. Future versions will support NFC cards for patients in areas with feature phones.

**Q: Is this HIPAA compliant?**
MediRelay's architecture is designed with privacy-by-default principles that align with HIPAA's technical safeguards. However, HIPAA compliance is a legal determination that depends on deployment context, business associate agreements, and operational controls. Operators in US jurisdictions must conduct their own compliance review. See [docs/regulatory.md](docs/regulatory.md).

---

## Partners & Acknowledgements

MediRelay is inspired by [StellarConduit](https://github.com/stellarconduit) and builds on the work of the [Stellar Development Foundation](https://stellar.org/foundation), the [FHIR community](https://hl7.org/fhir/), and the many researchers who have studied offline-first systems for global health.

We are grateful to the community health workers, clinic staff, and field researchers whose constraints and feedback shaped this design. This system exists because of the problems they live with every day.

If you are an NGO, health ministry, or research institution interested in piloting MediRelay, reach out at **[hello@mediarelay.org](mailto:hello@mediarelay.org)** *(placeholder)*.

---

## License

MediRelay is released under the [MIT License](LICENSE) — Copyright © 2026 vicistar-star.

> Medical record data generated by MediRelay deployments belongs to patients and operating institutions — not to this project. We are infrastructure, not a data business.

---

<div align="center">

**Built for the clinics at the end of the road.**

*If you believe health records are a human right, star this repo and tell someone.*

<br/>

⭐ [Star on GitHub](https://github.com/your-org/mediarelay) · 🐛 [Report an Issue](../../issues/new) · 💬 [Start a Discussion](../../discussions) · 📧 [Contact Us](mailto:hello@mediarelay.org)

<br/>

*MediRelay is early-stage software. It is not yet approved for clinical use. Do not use in production health settings without independent security review.*

</div>
