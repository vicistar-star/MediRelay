# Regulatory Notes

> **This document is informational, not legal advice.** Operators deploying MediRelay in any jurisdiction must conduct their own legal review and engage qualified counsel.

## MediRelay's Privacy Architecture

MediRelay is designed with privacy-by-default:

- No PHI is written to the Stellar ledger
- Records are encrypted end-to-end; only the patient's DID keypair can decrypt them
- Patient identity on-chain is a pseudonymous public key, not a name or national ID
- Audit logs are append-only and anchored to Stellar

These properties align with the technical safeguard requirements of most health data regulations, but **technical alignment is not legal compliance**. Compliance depends on deployment context, operational controls, and jurisdiction-specific requirements.

## Jurisdiction Notes

### Nigeria — NDPR (Nigeria Data Protection Regulation)
- NDPR requires a lawful basis for processing personal data and mandates data minimisation.
- MediRelay's on-chain data (hashes + pseudonymous DIDs) is designed to minimise identifiability.
- Operators must appoint a Data Protection Officer if processing data at scale.
- Cross-border data transfer restrictions apply to the full FHIR records stored off-chain.

### South Africa — POPIA (Protection of Personal Information Act)
- Health information is a special category under POPIA requiring explicit consent.
- The patient DID model supports consent by design — patients hold their own keys.
- Operators must register as responsible parties with the Information Regulator.

### Kenya — Data Protection Act 2019
- Requires registration with the Office of the Data Protection Commissioner for large-scale health data processing.
- Sensitive personal data (health records) requires explicit consent and heightened security measures.

### United States — HIPAA
- HIPAA applies to Covered Entities and Business Associates handling Protected Health Information.
- MediRelay's architecture aligns with HIPAA's Technical Safeguards (encryption, access controls, audit logs).
- Operators must execute Business Associate Agreements with any third-party services.
- A formal HIPAA risk assessment is required before deployment in US health settings.

### European Union — GDPR
- Health data is a special category under Article 9 requiring explicit consent or another Article 9(2) basis.
- Data subjects have rights of access, rectification, and erasure. The patient DID keypair rotation mechanism supports erasure by making historical records inaccessible, but does not delete them from mesh nodes — operators must address this gap.
- Data Protection Impact Assessments (DPIA) are required for large-scale health data processing.
- Cross-border transfers outside the EEA require appropriate safeguards (SCCs, adequacy decisions).

## Blockchain-Specific Considerations

The immutability of the Stellar ledger creates tension with "right to erasure" requirements (GDPR Article 17, POPIA). MediRelay's mitigation is that the ledger contains only pseudonymous hashes — erasure of the off-chain record renders the on-chain hash meaningless. Whether this satisfies erasure requirements is a legal question that varies by jurisdiction and has not been definitively resolved by regulators.

Operators should document this design decision and obtain legal opinion before deployment in GDPR or POPIA jurisdictions.

## Not Yet Addressed

- Formal HIPAA risk assessment
- GDPR Data Protection Impact Assessment template
- Consent management UI for patients
- Data retention and deletion policies
- Cross-border transfer mechanisms

These are planned for v0.4 (Field Readiness). Contributions from legal and compliance experts are welcome.
