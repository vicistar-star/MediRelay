import { issueDid, resolveDid, isValidStellarPublicKey } from '../../stellar/did';
import { AnchorQueue, buildAnchorSchema } from '../../stellar/anchorQueue';

describe('issueDid', () => {
  it('issues a valid did:stellar: DID', () => {
    const issued = issueDid();
    expect(issued.did).toMatch(/^did:stellar:G/);
    expect(issued.stellarPublicKey).toMatch(/^G/);
    expect(issued.stellarSecretKey).toMatch(/^S/);
  });

  it('issues unique DIDs each time', () => {
    const a = issueDid();
    const b = issueDid();
    expect(a.did).not.toBe(b.did);
  });
});

describe('resolveDid', () => {
  it('extracts the public key from a did:stellar: DID', () => {
    const issued = issueDid();
    const resolved = resolveDid(issued.did);
    expect(resolved).toBe(issued.stellarPublicKey);
  });

  it('throws on non-stellar DID', () => {
    expect(() => resolveDid('did:ethr:0x123')).toThrow();
  });
});

describe('isValidStellarPublicKey', () => {
  it('returns true for a valid key', () => {
    const { stellarPublicKey } = issueDid();
    expect(isValidStellarPublicKey(stellarPublicKey)).toBe(true);
  });

  it('returns false for garbage', () => {
    expect(isValidStellarPublicKey('not-a-key')).toBe(false);
  });
});

describe('AnchorQueue', () => {
  const makePayload = () => ({
    recordHash: new Uint8Array(32).fill(1),
    patientDid: 'did:stellar:GABCD',
    facilityId: 'fac:ng:kano:rural-01',
    timestamp: '2026-01-15T09:00:00Z',
  });

  it('enqueues and dequeues in order', () => {
    const q = new AnchorQueue();
    q.enqueue(makePayload());
    q.enqueue(makePayload());
    expect(q.size).toBe(2);
    q.dequeue();
    expect(q.size).toBe(1);
  });

  it('re-enqueues on failure', () => {
    const q = new AnchorQueue();
    const payload = makePayload();
    q.enqueue(payload);
    const item = q.dequeue()!;
    q.recordFailure(item, 'network error');
    expect(q.size).toBe(1);
    expect(q.peek()!.attempts).toBe(1);
    expect(q.peek()!.lastError).toBe('network error');
  });
});

describe('buildAnchorSchema', () => {
  it('builds a valid anchor schema', () => {
    const hash = new Uint8Array(32).fill(0xab);
    const schema = buildAnchorSchema({
      recordHash: hash,
      patientDid: 'did:stellar:GABCD',
      facilityId: 'fac:ng:kano:rural-01',
      timestamp: '2026-01-15T09:00:00Z',
    });
    expect(schema.v).toBe(1);
    expect(schema.type).toBe('mediarelay:record');
    expect(schema.record_hash).toMatch(/^sha256:/);
    expect(schema.patient_did).toBe('did:stellar:GABCD');
  });
});
