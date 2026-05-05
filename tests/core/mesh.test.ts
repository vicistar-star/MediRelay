import { encodeCBOR, decodeCBOR, serializePayload, deserializePayload } from '../../core/mesh/serialization';
import { MeshStore } from '../../core/mesh/store';
import { buildMeshPayload, verifyPayloadSignature, assertPayloadValid } from '../../core/mesh/payload';
import { generateSigningKeypair, generateBoxKeypair } from '../../core/crypto/crypto';
import { ErrorCode } from '../../core/errors';


describe('CBOR serialization', () => {
  it('round-trips a plain object', () => {
    const obj = { hello: 'world', n: 42, bytes: new Uint8Array([1, 2, 3]) };
    const encoded = encodeCBOR(obj);
    const decoded = decodeCBOR<typeof obj>(encoded);
    expect(decoded.hello).toBe('world');
    expect(decoded.n).toBe(42);
  });

  it('round-trips a MeshPayload', () => {
    const signingKp = generateSigningKeypair();
    const boxKp = generateBoxKeypair();
    const payload = buildMeshPayload({
      fhirBundle: { resourceType: 'Bundle', type: 'collection' },
      patientBoxPublicKey: boxKp.publicKey,
      signerDid: 'did:stellar:GABCD',
      facilityId: 'fac:ng:kano:rural-01',
      signingSecretKey: signingKp.secretKey,
    });
    const bytes = serializePayload(payload);
    const restored = deserializePayload(bytes);
    expect(restored.signerDid).toBe(payload.signerDid);
    expect(Buffer.from(restored.recordHash).toString('hex')).toBe(
      Buffer.from(payload.recordHash).toString('hex')
    );
  });
});

describe('MeshStore', () => {
  it('stores and deduplicates records', () => {
    const store = new MeshStore();
    const signingKp = generateSigningKeypair();
    const boxKp = generateBoxKeypair();
    const payload = buildMeshPayload({
      fhirBundle: { resourceType: 'Bundle' },
      patientBoxPublicKey: boxKp.publicKey,
      signerDid: 'did:stellar:GABCD',
      facilityId: 'fac:ng:kano:rural-01',
      signingSecretKey: signingKp.secretKey,
    });

    store.add(payload);
    expect(store.size).toBe(1);
    expect(store.has(payload.recordHash)).toBe(true);

    expect(() => store.add(payload)).toThrow(
      expect.objectContaining({ errorCode: ErrorCode.PAYLOAD_DUPLICATE })
    );
  });

  it('tracks relay and anchor state', () => {
    const store = new MeshStore();
    const signingKp = generateSigningKeypair();
    const boxKp = generateBoxKeypair();
    const payload = buildMeshPayload({
      fhirBundle: { resourceType: 'Bundle' },
      patientBoxPublicKey: boxKp.publicKey,
      signerDid: 'did:stellar:GABCD',
      facilityId: 'fac:ng:kano:rural-01',
      signingSecretKey: signingKp.secretKey,
    });

    store.add(payload);
    expect(store.getPendingAnchor()).toHaveLength(1);
    expect(store.getPendingForPeer('peer-1')).toHaveLength(1);

    store.markRelayed(payload.recordHash, 'peer-1');
    expect(store.getPendingForPeer('peer-1')).toHaveLength(0);

    store.markAnchored(payload.recordHash);
    expect(store.getPendingAnchor()).toHaveLength(0);
  });
});

describe('buildMeshPayload / verifyPayloadSignature', () => {
  it('builds a payload with a valid signature', () => {
    const signingKp = generateSigningKeypair();
    const boxKp = generateBoxKeypair();
    const payload = buildMeshPayload({
      fhirBundle: { resourceType: 'Bundle' },
      patientBoxPublicKey: boxKp.publicKey,
      signerDid: 'did:stellar:GABCD',
      facilityId: 'fac:ng:kano:rural-01',
      signingSecretKey: signingKp.secretKey,
    });

    expect(verifyPayloadSignature(payload, signingKp.publicKey)).toBe(true);
  });

  it('rejects a signature from a different key', () => {
    const signingKp = generateSigningKeypair();
    const wrongKp = generateSigningKeypair();
    const boxKp = generateBoxKeypair();
    const payload = buildMeshPayload({
      fhirBundle: { resourceType: 'Bundle' },
      patientBoxPublicKey: boxKp.publicKey,
      signerDid: 'did:stellar:GABCD',
      facilityId: 'fac:ng:kano:rural-01',
      signingSecretKey: signingKp.secretKey,
    });

    expect(verifyPayloadSignature(payload, wrongKp.publicKey)).toBe(false);
  });
});

describe('assertPayloadValid', () => {
  it('throws on wrong version', () => {
    const signingKp = generateSigningKeypair();
    const boxKp = generateBoxKeypair();
    const payload = buildMeshPayload({
      fhirBundle: {},
      patientBoxPublicKey: boxKp.publicKey,
      signerDid: 'did:stellar:GABCD',
      facilityId: 'fac:ng:kano:rural-01',
      signingSecretKey: signingKp.secretKey,
    });
    (payload as { version: number }).version = 99;
    expect(() => assertPayloadValid(payload)).toThrow(
      expect.objectContaining({ errorCode: ErrorCode.PAYLOAD_UNSIGNED })
    );
  });

  it('throws on missing signerDid', () => {
    const signingKp = generateSigningKeypair();
    const boxKp = generateBoxKeypair();
    const payload = buildMeshPayload({
      fhirBundle: {},
      patientBoxPublicKey: boxKp.publicKey,
      signerDid: 'did:stellar:GABCD',
      facilityId: 'fac:ng:kano:rural-01',
      signingSecretKey: signingKp.secretKey,
    });
    (payload as { signerDid: string }).signerDid = 'invalid';
    expect(() => assertPayloadValid(payload)).toThrow(
      expect.objectContaining({ errorCode: ErrorCode.PAYLOAD_UNSIGNED })
    );
  });
});
