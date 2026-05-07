import * as StellarSdk from '@stellar/stellar-sdk';
import { didFromPublicKey } from '../core/crypto/crypto';
import { ErrorCode, MediRelayError } from '../core/errors';

export interface IssuedDid {
  did: string;
  stellarPublicKey: string;
  stellarSecretKey: string; // Only returned at issuance — store securely, never log
}

/**
 * Issue a new patient DID by generating a Stellar keypair.
 * The DID is derived from the Stellar public key.
 * The secret key must be stored in the Android Keystore immediately after issuance.
 */
export function issueDid(): IssuedDid {
  const keypair = StellarSdk.Keypair.random();
  const stellarPublicKey = keypair.publicKey();
  return {
    did: didFromPublicKey(stellarPublicKey),
    stellarPublicKey,
    stellarSecretKey: keypair.secret(),
  };
}

/**
 * Resolve a did:stellar: DID to its Stellar public key.
 * In v0.1 this is a local derivation. Future versions will query the DID registry on Stellar.
 */
export function resolveDid(did: string): string {
  if (!did.startsWith('did:stellar:')) {
    throw new MediRelayError(
      ErrorCode.DID_RESOLUTION_FAILED,
      `Cannot resolve non-stellar DID: ${did}`
    );
  }
  return did.replace('did:stellar:', '');
}

/**
 * Verify that a Stellar public key is valid (base32 encoded, correct checksum).
 */
export function isValidStellarPublicKey(key: string): boolean {
  try {
    StellarSdk.Keypair.fromPublicKey(key);
    return true;
  } catch {
    return false;
  }
}
