import {
  generateSigningKeypair,
  generateBoxKeypair,
  sha256,
  sign,
  verifySignature,
  encryptForRecipient,
  decryptFromSender,
  didFromPublicKey,
  publicKeyFromDid,
  toHex,
  fromHex,
} from '../../core/crypto/crypto';
import { ErrorCode, MediRelayError } from '../../core/errors';
import { DID_PREFIX } from '../../core/constants';

describe('sha256', () => {
  it('produces a known hash for empty input', () => {
    const hash = sha256(new Uint8Array(0));
    expect(toHex(hash)).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    );
  });

  it('produces a known hash for "hello"', () => {
    const hash = sha256(Buffer.from('hello'));
    expect(toHex(hash)).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
    );
  });
});

describe('sign / verifySignature', () => {
  it('verifies a valid signature', () => {
    const kp = generateSigningKeypair();
    const message = Buffer.from('test message');
    const sig = sign(message, kp.secretKey);
    expect(verifySignature(message, sig, kp.publicKey)).toBe(true);
  });

  it('rejects a tampered message', () => {
    const kp = generateSigningKeypair();
    const message = Buffer.from('test message');
    const sig = sign(message, kp.secretKey);
    const tampered = Buffer.from('tampered message');
    expect(verifySignature(tampered, sig, kp.publicKey)).toBe(false);
  });

  it('rejects a signature from a different key', () => {
    const kp1 = generateSigningKeypair();
    const kp2 = generateSigningKeypair();
    const message = Buffer.from('test message');
    const sig = sign(message, kp1.secretKey);
    expect(verifySignature(message, sig, kp2.publicKey)).toBe(false);
  });
});

describe('encryptForRecipient / decryptFromSender', () => {
  it('round-trips plaintext', () => {
    const recipient = generateBoxKeypair();
    const plaintext = Buffer.from('secret health data');
    const box = encryptForRecipient(plaintext, recipient.publicKey);
    const decrypted = decryptFromSender(box, recipient.secretKey);
    expect(Buffer.from(decrypted).toString()).toBe('secret health data');
  });

  it('throws on wrong recipient key', () => {
    const recipient = generateBoxKeypair();
    const wrong = generateBoxKeypair();
    const box = encryptForRecipient(Buffer.from('data'), recipient.publicKey);
    expect(() => decryptFromSender(box, wrong.secretKey)).toThrow(MediRelayError);
    expect(() => decryptFromSender(box, wrong.secretKey)).toThrow(
      expect.objectContaining({ errorCode: ErrorCode.DECRYPTION_FAILED })
    );
  });
});

describe('DID utilities', () => {
  it('creates a did:stellar: DID from a public key', () => {
    const did = didFromPublicKey('GABCDXYZ');
    expect(did).toBe(`${DID_PREFIX}GABCDXYZ`);
  });

  it('extracts the public key from a DID', () => {
    const did = `${DID_PREFIX}GABCDXYZ`;
    expect(publicKeyFromDid(did)).toBe('GABCDXYZ');
  });

  it('throws on invalid DID method', () => {
    expect(() => publicKeyFromDid('did:ethr:0x123')).toThrow(MediRelayError);
  });
});

describe('hex encoding', () => {
  it('round-trips bytes through hex', () => {
    const bytes = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
    expect(fromHex(toHex(bytes))).toEqual(bytes);
  });
});
