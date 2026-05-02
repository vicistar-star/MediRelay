import {
  buildPatient,
  buildEncounter,
  buildObservation,
  buildImmunization,
  buildCondition,
  buildMedicationRequest,
  buildBundle,
} from '../../core/fhir/builders';
import { validateResource, validateBundle, isIso8601Utc } from '../../core/fhir/validator';
import { ErrorCode, MediRelayError } from '../../core/errors';

const PATIENT_DID = 'did:stellar:GABCDXYZ';
const PRACTITIONER_DID = 'did:stellar:GPRACTITIONER';
const FACILITY_ID = 'fac:ng:kano:rural-01';
const NOW = '2026-01-15T09:00:00Z';

describe('buildPatient', () => {
  it('builds a valid Patient resource', () => {
    const patient = buildPatient({
      did: PATIENT_DID,
      givenName: 'Amina',
      familyName: 'Musa',
      birthDate: '1990-03-22',
      gender: 'female',
      facilityId: FACILITY_ID,
    });
    expect(patient.resourceType).toBe('Patient');
    expect(patient.id).toBe(PATIENT_DID);
    expect(patient.gender).toBe('female');
    expect(patient.identifier?.[0].value).toBe(PATIENT_DID);
  });
});

describe('buildEncounter', () => {
  it('builds a valid Encounter resource', () => {
    const enc = buildEncounter({
      id: 'enc-001',
      patientDid: PATIENT_DID,
      practitionerDid: PRACTITIONER_DID,
      facilityId: FACILITY_ID,
      startTime: NOW,
      reasonCode: 'B54',
      reasonDisplay: 'Unspecified malaria',
    });
    expect(enc.resourceType).toBe('Encounter');
    expect(enc.status).toBe('finished');
    expect(enc.reasonCode?.[0].coding?.[0].code).toBe('B54');
  });
});

describe('buildObservation', () => {
  it('builds an Observation with a quantity value', () => {
    const obs = buildObservation({
      id: 'obs-001',
      patientDid: PATIENT_DID,
      encounterId: 'enc-001',
      loincCode: '8310-5',
      loincDisplay: 'Body temperature',
      valueQuantity: { value: 38.5, unit: 'Cel' },
      effectiveTime: NOW,
    });
    expect(obs.resourceType).toBe('Observation');
    expect((obs.valueQuantity as fhir4.Quantity).value).toBe(38.5);
  });
});

describe('buildImmunization', () => {
  it('builds an Immunization resource', () => {
    const imm = buildImmunization({
      id: 'imm-001',
      patientDid: PATIENT_DID,
      encounterId: 'enc-001',
      vaccineCode: '03',
      vaccineDisplay: 'MMR',
      occurrenceTime: NOW,
      doseNumber: 1,
    });
    expect(imm.resourceType).toBe('Immunization');
    expect(imm.status).toBe('completed');
    expect(imm.protocolApplied?.[0].doseNumberPositiveInt).toBe(1);
  });
});

describe('buildCondition', () => {
  it('builds a Condition resource', () => {
    const cond = buildCondition({
      id: 'cond-001',
      patientDid: PATIENT_DID,
      encounterId: 'enc-001',
      icd10Code: 'B54',
      icd10Display: 'Unspecified malaria',
      onsetTime: NOW,
    });
    expect(cond.resourceType).toBe('Condition');
    expect(cond.code?.coding?.[0].code).toBe('B54');
  });
});

describe('buildMedicationRequest', () => {
  it('builds a MedicationRequest resource', () => {
    const rx = buildMedicationRequest({
      id: 'rx-001',
      patientDid: PATIENT_DID,
      encounterId: 'enc-001',
      practitionerDid: PRACTITIONER_DID,
      medicationCode: '308460',
      medicationDisplay: 'Artemether 20mg',
      dosageInstruction: '1 tablet twice daily for 3 days',
      authoredOn: NOW,
    });
    expect(rx.resourceType).toBe('MedicationRequest');
    expect(rx.status).toBe('active');
  });
});

describe('buildBundle', () => {
  it('wraps resources in a Bundle', () => {
    const patient = buildPatient({
      did: PATIENT_DID,
      givenName: 'Amina',
      familyName: 'Musa',
      birthDate: '1990-03-22',
      gender: 'female',
      facilityId: FACILITY_ID,
    });
    const bundle = buildBundle([patient]);
    expect(bundle.resourceType).toBe('Bundle');
    expect(bundle.entry).toHaveLength(1);
    expect(bundle.timestamp).toBeDefined();
  });
});

describe('validateResource', () => {
  it('passes for a valid resource', () => {
    const patient = buildPatient({
      did: PATIENT_DID,
      givenName: 'A',
      familyName: 'B',
      birthDate: '2000-01-01',
      gender: 'male',
      facilityId: FACILITY_ID,
    });
    expect(() => validateResource(patient)).not.toThrow();
  });

  it('throws when resourceType is missing', () => {
    expect(() => validateResource({} as fhir4.Resource)).toThrow(
      expect.objectContaining({ errorCode: ErrorCode.FHIR_VALIDATION_FAILED })
    );
  });

  it('throws when id is missing', () => {
    expect(() =>
      validateResource({ resourceType: 'Patient' } as fhir4.Resource)
    ).toThrow(expect.objectContaining({ errorCode: ErrorCode.FHIR_VALIDATION_FAILED }));
  });
});

describe('validateBundle', () => {
  it('passes for a valid bundle', () => {
    const patient = buildPatient({
      did: PATIENT_DID,
      givenName: 'A',
      familyName: 'B',
      birthDate: '2000-01-01',
      gender: 'male',
      facilityId: FACILITY_ID,
    });
    const bundle = buildBundle([patient]);
    expect(() => validateBundle(bundle)).not.toThrow();
  });

  it('throws for a non-UTC timestamp', () => {
    const bundle = buildBundle([]);
    bundle.timestamp = '2026-01-15T09:00:00+01:00';
    expect(() => validateBundle(bundle)).toThrow(MediRelayError);
  });
});

describe('isIso8601Utc', () => {
  it('accepts valid UTC timestamps', () => {
    expect(isIso8601Utc('2026-01-15T09:00:00Z')).toBe(true);
    expect(isIso8601Utc('2026-01-15T09:00:00.123Z')).toBe(true);
  });

  it('rejects non-UTC timestamps', () => {
    expect(isIso8601Utc('2026-01-15T09:00:00+01:00')).toBe(false);
    expect(isIso8601Utc('2026-01-15')).toBe(false);
  });
});
