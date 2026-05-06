import { mergeRecords, hasConflictFlag, SignedRecord } from '../../core/crdt/merge';
import { TRUST_LEVEL } from '../../core/constants';

const NOW = '2026-01-15T09:00:00.000Z';
const LATER = '2026-01-15T09:05:00.000Z'; // 5 minutes later — outside tolerance

function makeRecord(
  resourceType: string,
  id: string,
  timestamp: string,
  trustLevel: number,
  extra: Partial<fhir4.Resource> = {}
): SignedRecord {
  return {
    resource: { resourceType, id, ...extra } as fhir4.Resource,
    timestamp,
    trustLevel: trustLevel as SignedRecord['trustLevel'],
  };
}

describe('mergeRecords — additive types', () => {
  it('preserves both Immunization records', () => {
    const a = makeRecord('Immunization', 'imm-1', NOW, TRUST_LEVEL.HEALTH_WORKER);
    const b = makeRecord('Immunization', 'imm-2', NOW, TRUST_LEVEL.HEALTH_WORKER);
    const result = mergeRecords(a, b);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toContain('imm-1');
    expect(result.map((r) => r.id)).toContain('imm-2');
  });

  it('preserves both Observation records', () => {
    const a = makeRecord('Observation', 'obs-1', NOW, TRUST_LEVEL.HEALTH_WORKER);
    const b = makeRecord('Observation', 'obs-2', LATER, TRUST_LEVEL.HEALTH_WORKER);
    const result = mergeRecords(a, b);
    expect(result).toHaveLength(2);
  });
});

describe('mergeRecords — Last-Write-Wins', () => {
  it('picks the later record when timestamps differ by more than tolerance', () => {
    const a = makeRecord('Condition', 'cond-old', NOW, TRUST_LEVEL.HEALTH_WORKER);
    const b = makeRecord('Condition', 'cond-new', LATER, TRUST_LEVEL.HEALTH_WORKER);
    const result = mergeRecords(a, b);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('cond-new');
  });

  it('picks the higher-trust record when timestamps are within tolerance', () => {
    const closeTime = '2026-01-15T09:00:30.000Z'; // 30s later — within 60s tolerance
    const a = makeRecord('Condition', 'cond-chw', NOW, TRUST_LEVEL.HEALTH_WORKER);
    const b = makeRecord('Condition', 'cond-fac', closeTime, TRUST_LEVEL.FACILITY);
    const result = mergeRecords(a, b);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('cond-fac');
  });
});

describe('mergeRecords — conflict flagging', () => {
  it('flags both records when trust and timestamp are equal', () => {
    const a = makeRecord('Condition', 'cond-a', NOW, TRUST_LEVEL.HEALTH_WORKER);
    const b = makeRecord('Condition', 'cond-b', NOW, TRUST_LEVEL.HEALTH_WORKER);
    const result = mergeRecords(a, b);
    expect(result).toHaveLength(2);
    expect(hasConflictFlag(result[0])).toBe(true);
    expect(hasConflictFlag(result[1])).toBe(true);
  });
});

describe('hasConflictFlag', () => {
  it('returns false for a clean resource', () => {
    const resource: fhir4.Resource = { resourceType: 'Condition', id: 'x' };
    expect(hasConflictFlag(resource)).toBe(false);
  });
});
