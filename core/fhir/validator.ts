import { ErrorCode, MediRelayError } from '../errors';

const REQUIRED_RESOURCE_TYPES = new Set([
  'Patient',
  'Encounter',
  'Observation',
  'Immunization',
  'Condition',
  'MedicationRequest',
  'Practitioner',
  'Bundle',
]);

/** Validate that a FHIR resource has the minimum required fields. */
export function validateResource(resource: fhir4.Resource): void {
  if (!resource.resourceType) {
    throw new MediRelayError(
      ErrorCode.FHIR_VALIDATION_FAILED,
      'Resource is missing resourceType'
    );
  }

  if (!REQUIRED_RESOURCE_TYPES.has(resource.resourceType)) {
    throw new MediRelayError(
      ErrorCode.FHIR_VALIDATION_FAILED,
      `Unsupported resourceType: ${resource.resourceType}`
    );
  }

  if (!resource.id) {
    throw new MediRelayError(
      ErrorCode.FHIR_VALIDATION_FAILED,
      `Resource of type ${resource.resourceType} is missing id`
    );
  }
}

/** Validate a FHIR Bundle and all its entries. */
export function validateBundle(bundle: fhir4.Bundle): void {
  if (bundle.resourceType !== 'Bundle') {
    throw new MediRelayError(
      ErrorCode.FHIR_VALIDATION_FAILED,
      'Expected a Bundle resource'
    );
  }

  if (!bundle.timestamp) {
    throw new MediRelayError(
      ErrorCode.FHIR_VALIDATION_FAILED,
      'Bundle is missing timestamp'
    );
  }

  // Validate ISO 8601 UTC timestamp
  if (!isIso8601Utc(bundle.timestamp)) {
    throw new MediRelayError(
      ErrorCode.FHIR_VALIDATION_FAILED,
      `Bundle timestamp is not ISO 8601 UTC: ${bundle.timestamp}`
    );
  }

  for (const entry of bundle.entry ?? []) {
    if (entry.resource) {
      validateResource(entry.resource);
    }
  }
}

/** Check that a timestamp string is ISO 8601 UTC (ends with Z). */
export function isIso8601Utc(timestamp: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(timestamp);
}
