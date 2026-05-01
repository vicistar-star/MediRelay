import * as nacl from 'tweetnacl';
import { encodeBase64, decodeBase64, encodeUTF8 } from 'tweetnacl-util';
import { createHash } from 'crypto';
import { DID_PREFIX, NACL_NONCE_LENGTH, SHA256_LENGTH } from '../constants';
import { ErrorCode, MediRelayError } from '../errors';

export interface Keypair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

export interface EncryptedBox {
  ciphertext: Uint8Array;
  nonce: Uint8Array;
  ephemeralPublicKey: Uint8Array;
}

/** Generate a new NaCl signing keypair. */
export function generateSigningKeypair(): Keypair {
  return nacl.sign.keyPair();
}

/** Generate a new NaCl box (encryption) keypair. */
export function generateBoxKeypair(): Keypair {
  return nacl.box.keyPair();
}

/** Derive a box keypair from a signing secret key (for DID-based encryption). */
export function boxKeypairFromSigningKey(signingSecretKey: Uint8Array): Keypair {
  // Use the first 32 bytes of the signing secret as the box secret
  const secret = signingSecretKey.slice(0, 32);
  return nacl.box.keyPair.fromSecretKey(secret);
}

/** SHA-256 hash of arbitrary bytes. Returns raw 32-byte Uint8Array. */
export function sha256(data: Uint8Array): Uint8Array {
  const hash = createHash('sha256').update(data).digest();
  return new Uint8Array(hash);
}

/** Hex-encode a byte array. */
export function toHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('hex');
}

/** Decode a hex string to bytes. */
export function fromHex(hex: string): Uint8Array {
  return new Uint8Array(Buffer.from(hex, 'hex'));
}

/** Sign a message (typically a record hash) with a NaCl signing key. */
export function sign(message: Uint8Array, secretKey: Uint8Array): Uint8Array {
  return nacl.sign.detached(message, secretKey);
}

/** Verify a detached NaCl signature. */
export function verifySignature(
  message: Uint8Array,
  signature: Uint8Array,
  publicKey: Uint8Array
): boolean {
  return nacl.sign.detached.verify(message, signature, publicKey);
}

/**
 * Encrypt a plaintext payload for a recipient's public key.
 * Uses an ephemeral sender keypair so the sender's long-term key is not exposed.
 */
export function encryptForRecipient(
  plaintext: Uint8Array,
  recipientPublicKey: Uint8Array
): EncryptedBox {
  const ephemeral = nacl.box.keyPair();
  const nonce = nacl.randomBytes(NACL_NONCE_LENGTH);
  const ciphertext = nacl.box(plaintext, nonce, recipientPublicKey, ephemeral.secretKey);

  if (!ciphertext) {
    throw new MediRelayError(ErrorCode.ENCRYPTION_FAILED, 'NaCl box encryption returned null');
  }

  return { ciphertext, nonce, ephemeralPublicKey: ephemeral.publicKey };
}

/** Decrypt a box encrypted with encryptForRecipient. */
export function decryptFromSender(
  box: EncryptedBox,
  recipientSecretKey: Uint8Array
): Uint8Array {
  const plaintext = nacl.box.open(
    box.ciphertext,
    box.nonce,
    box.ephemeralPublicKey,
    recipientSecretKey
  );

  if (!plaintext) {
    throw new MediRelayError(ErrorCode.DECRYPTION_FAILED, 'NaCl box decryption failed — wrong key or tampered ciphertext');
  }

  return plaintext;
}

/** Derive a did:stellar: DID from a Stellar public key string. */
export function didFromPublicKey(stellarPublicKey: string): string {
  return `${DID_PREFIX}${stellarPublicKey}`;
}

/** Extract the Stellar public key from a did:stellar: DID. */
export function publicKeyFromDid(did: string): string {
  if (!did.startsWith(DID_PREFIX)) {
    throw new MediRelayError(
      ErrorCode.DID_RESOLUTION_FAILED,
      `DID does not use the ${DID_PREFIX} method: ${did}`
    );
  }
  return did.slice(DID_PREFIX.length);
}

/** Encode bytes to base64 string (for serialization). */
export const toBase64 = encodeBase64;

/** Decode base64 string to bytes. */
export const fromBase64 = decodeBase64;

/** Encode a UTF-8 string to bytes. */
export const toBytes = encodeUTF8;

// Re-export so callers don't need to import tweetnacl directly
export { SHA256_LENGTH };
