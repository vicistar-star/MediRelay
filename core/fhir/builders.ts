import { DID_PREFIX } from '../constants';

/** Build a FHIR R4 Patient resource linked to a Stellar DID. */
export function buildPatient(params: {
  did: string;
  givenName: string;
  familyName: string;
  birthDate: string; // ISO 8601 date: YYYY-MM-DD
  gender: 'male' | 'female' | 'other' | 'unknown';
  facilityId: string;
}): fhir4.Patient {
  return {
    resourceType: 'Patient',
    id: params.did,
    identifier: [
      {
        system: `${DID_PREFIX}`,
        value: params.did,
      },
    ],
    name: [
      {
        use: 'official',
        family: params.familyName,
        given: [params.givenName],
      },
    ],
    birthDate: params.birthDate,
    gender: params.gender,
    managingOrganization: {
      reference: `Organization/${params.facilityId}`,
    },
  };
}

/** Build a FHIR R4 Encounter resource for a clinical visit. */
export function buildEncounter(params: {
  id: string;
  patientDid: string;
  practitionerDid: string;
  facilityId: string;
  startTime: string; // ISO 8601 UTC
  endTime?: string;
  reasonCode?: string; // ICD-10 or SNOMED code
  reasonDisplay?: string;
}): fhir4.Encounter {
  return {
    resourceType: 'Encounter',
    id: params.id,
    status: 'finished',
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: 'AMB',
      display: 'ambulatory',
    },
    subject: { reference: `Patient/${params.patientDid}` },
    participant: [
      {
        individual: { reference: `Practitioner/${params.practitionerDid}` },
      },
    ],
    serviceProvider: { reference: `Organization/${params.facilityId}` },
    period: {
      start: params.startTime,
      ...(params.endTime ? { end: params.endTime } : {}),
    },
    ...(params.reasonCode
      ? {
          reasonCode: [
            {
              coding: [
                {
                  system: 'http://hl7.org/fhir/sid/icd-10',
                  code: params.reasonCode,
                  display: params.reasonDisplay,
                },
              ],
            },
          ],
        }
      : {}),
  };
}

/** Build a FHIR R4 Observation resource (vitals, lab results, test outcomes). */
export function buildObservation(params: {
  id: string;
  patientDid: string;
  encounterId: string;
  loincCode: string;
  loincDisplay: string;
  valueQuantity?: { value: number; unit: string; system?: string };
  valueString?: string;
  effectiveTime: string; // ISO 8601 UTC
  status?: fhir4.Observation['status'];
}): fhir4.Observation {
  return {
    resourceType: 'Observation',
    id: params.id,
    status: params.status ?? 'final',
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: params.loincCode,
          display: params.loincDisplay,
        },
      ],
    },
    subject: { reference: `Patient/${params.patientDid}` },
    encounter: { reference: `Encounter/${params.encounterId}` },
    effectiveDateTime: params.effectiveTime,
    ...(params.valueQuantity
      ? {
          valueQuantity: {
            value: params.valueQuantity.value,
            unit: params.valueQuantity.unit,
            system: params.valueQuantity.system ?? 'http://unitsofmeasure.org',
          },
        }
      : {}),
    ...(params.valueString ? { valueString: params.valueString } : {}),
  };
}

/** Build a FHIR R4 Immunization resource. Immunizations are additive — never overwritten. */
export function buildImmunization(params: {
  id: string;
  patientDid: string;
  encounterId: string;
  vaccineCode: string; // CVX code
  vaccineDisplay: string;
  occurrenceTime: string; // ISO 8601 UTC
  lotNumber?: string;
  doseNumber?: number;
}): fhir4.Immunization {
  return {
    resourceType: 'Immunization',
    id: params.id,
    status: 'completed',
    vaccineCode: {
      coding: [
        {
          system: 'http://hl7.org/fhir/sid/cvx',
          code: params.vaccineCode,
          display: params.vaccineDisplay,
        },
      ],
    },
    patient: { reference: `Patient/${params.patientDid}` },
    encounter: { reference: `Encounter/${params.encounterId}` },
    occurrenceDateTime: params.occurrenceTime,
    ...(params.lotNumber ? { lotNumber: params.lotNumber } : {}),
    ...(params.doseNumber !== undefined
      ? {
          protocolApplied: [
            {
              doseNumberPositiveInt: params.doseNumber,
            },
          ],
        }
      : {}),
  };
}

/** Build a FHIR R4 Condition resource (diagnosis). */
export function buildCondition(params: {
  id: string;
  patientDid: string;
  encounterId: string;
  icd10Code: string;
  icd10Display: string;
  onsetTime: string; // ISO 8601 UTC
  clinicalStatus?: 'active' | 'resolved' | 'inactive';
}): fhir4.Condition {
  return {
    resourceType: 'Condition',
    id: params.id,
    clinicalStatus: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
          code: params.clinicalStatus ?? 'active',
        },
      ],
    },
    code: {
      coding: [
        {
          system: 'http://hl7.org/fhir/sid/icd-10',
          code: params.icd10Code,
          display: params.icd10Display,
        },
      ],
    },
    subject: { reference: `Patient/${params.patientDid}` },
    encounter: { reference: `Encounter/${params.encounterId}` },
    onsetDateTime: params.onsetTime,
  };
}

/** Build a FHIR R4 MedicationRequest resource. */
export function buildMedicationRequest(params: {
  id: string;
  patientDid: string;
  encounterId: string;
  practitionerDid: string;
  medicationCode: string; // RxNorm code
  medicationDisplay: string;
  dosageInstruction: string;
  authoredOn: string; // ISO 8601 UTC
}): fhir4.MedicationRequest {
  return {
    resourceType: 'MedicationRequest',
    id: params.id,
    status: 'active',
    intent: 'order',
    medicationCodeableConcept: {
      coding: [
        {
          system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
          code: params.medicationCode,
          display: params.medicationDisplay,
        },
      ],
    },
    subject: { reference: `Patient/${params.patientDid}` },
    encounter: { reference: `Encounter/${params.encounterId}` },
    requester: { reference: `Practitioner/${params.practitionerDid}` },
    authoredOn: params.authoredOn,
    dosageInstruction: [{ text: params.dosageInstruction }],
  };
}

/** Build a FHIR R4 Practitioner resource (health worker). */
export function buildPractitioner(params: {
  did: string;
  givenName: string;
  familyName: string;
  facilityId: string;
}): fhir4.Practitioner {
  return {
    resourceType: 'Practitioner',
    id: params.did,
    identifier: [{ system: DID_PREFIX, value: params.did }],
    name: [
      {
        use: 'official',
        family: params.familyName,
        given: [params.givenName],
      },
    ],
  };
}

/** Wrap one or more FHIR resources into a transaction Bundle. */
export function buildBundle(
  resources: fhir4.Resource[],
  type: fhir4.Bundle['type'] = 'collection'
): fhir4.Bundle {
  return {
    resourceType: 'Bundle',
    type,
    timestamp: new Date().toISOString(),
    entry: resources.map((resource) => ({ resource: resource as fhir4.FhirResource })),
  };
}
