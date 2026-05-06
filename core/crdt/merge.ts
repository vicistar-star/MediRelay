import {
  CRDT_TIMESTAMP_TOLERANCE_MS,
  TRUST_LEVEL,
  CONFLICT_TAG_SYSTEM,
  CONFLICT_TAG_CODE,
} from '../constants';

export type TrustLevel = typeof TRUST_LEVEL[keyof typeof TRUST_LEVEL];

export interface SignedRecord {
  resource: fhir4.Resource;
  timestamp: string;   // ISO 8601 UTC — when the record was created
  trustLevel: TrustLevel;
}

/** Additive resource types — both versions are always preserved. */
const ADDITIVE_TYPES = new Set([
  'Immunization',
  'Observation',
  'MedicationRequest',
]);

/**
 * Merge two signed records for the same patient.
 *
 * Rules (from agentic.md):
 * 1. Additive resources → return both, no conflict.
 * 2. Singular state → Last-Write-Wins per field; trust level breaks ties within 60s.
 * 3. Unresolvable → preserve both, flag with meta.tag.
 */
export function mergeRecords(a: SignedRecord, b: SignedRecord): fhir4.Resource[] {
  const type = a.resource.resourceType;

  // Rule 1: additive — always keep both
  if (ADDITIVE_TYPES.has(type)) {
    return [a.resource, b.resource];
  }

  // Rule 2: Last-Write-Wins
  const tA = new Date(a.timestamp).getTime();
  const tB = new Date(b.timestamp).getTime();
  const diff = Math.abs(tA - tB);

  if (diff > CRDT_TIMESTAMP_TOLERANCE_MS) {
    // Clear winner by time
    return [tA > tB ? a.resource : b.resource];
  }

  // Within tolerance — use trust level
  if (a.trustLevel !== b.trustLevel) {
    return [a.trustLevel > b.trustLevel ? a.resource : b.resource];
  }

  // Rule 3: unresolvable — flag both
  return [flagConflict(a.resource), flagConflict(b.resource)];
}

/** Tag a resource as needing clinician review. */
function flagConflict(resource: fhir4.Resource): fhir4.Resource {
  const conflictTag: fhir4.Coding = {
    system: CONFLICT_TAG_SYSTEM,
    code: CONFLICT_TAG_CODE,
  };

  return {
    ...resource,
    meta: {
      ...(resource.meta ?? {}),
      tag: [...(resource.meta?.tag ?? []), conflictTag],
    },
  };
}

/** Check whether a resource has been flagged as a conflict. */
export function hasConflictFlag(resource: fhir4.Resource): boolean {
  return (
    resource.meta?.tag?.some(
      (t) => t.system === CONFLICT_TAG_SYSTEM && t.code === CONFLICT_TAG_CODE
    ) ?? false
  );
}
