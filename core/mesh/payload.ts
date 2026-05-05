import {
  sha256,
  sign,
  verifySignature,
  encryptForRecipient,
} from '../crypto/crypto';
import { encodeCBOR } from './serialization';
import { MeshPayload } from './types';
import { MESH_PAYLOAD_VERSION } from '../constants';
import { ErrorCode, MediRelayError } from '../errors';

export interface BuildPayloadParams {
  fhirBundle: unknown;           // The FHIR bundle object (will be CBOR-encoded then encrypted)
  patientBoxPublicKey: Uint8Array;
  signerDid: string;
  facilityId: string;
  signingSecretKey: Uint8Array;
}

/**
 * Build a signed, encrypted MeshPayload from a FHIR bundle.
 * Follows the signing flow defined in agentic.md.
 */
export function buildMeshPayload(params: BuildPayloadParams): MeshPayload {
  // 1. Serialize the FHIR bundle to CBOR
  const cbor = encodeCBOR(params.fhirBundle);

  // 2. Hash the CBOR bytes
  const recordHash = sha256(cbor);

  // 3. Sign the hash
  const signature = sign(recordHash, params.signingSecretKey);

  // 4. Encrypt the CBOR bundle for the patient's public key
  const box = encryptForRecipient(cbor, params.patientBoxPublicKey);

  return {
    version: MESH_PAYLOAD_VERSION,
    recordHash,
    signature,
    signerDid: params.signerDid,
    encryptedBundle: box.ciphertext,
    nonce: box.nonce,
    ephemeralPublicKey: box.ephemeralPublicKey,
    timestamp: new Date().toISOString(),
    facilityId: params.facilityId,
  };
}

/**
 * Verify the signature on a MeshPayload.
 * Does NOT verify the full trust chain — use verifyTrustChain for that.
 */
export function verifyPayloadSignature(
  payload: MeshPayload,
  signerPublicKey: Uint8Array
): boolean {
  return verifySignature(payload.recordHash, payload.signature, signerPublicKey);
}

/** Reject unsigned or structurally invalid payloads at the transport layer. */
export function assertPayloadValid(payload: MeshPayload): void {
  if (payload.version !== MESH_PAYLOAD_VERSION) {
    throw new MediRelayError(
      ErrorCode.PAYLOAD_UNSIGNED,
      `Unsupported payload version: ${payload.version}`
    );
  }

  if (!payload.signature || payload.signature.length === 0) {
    throw new MediRelayError(
      ErrorCode.PAYLOAD_UNSIGNED,
      'Payload has no signature'
    );
  }

  if (!payload.signerDid || !payload.signerDid.startsWith('did:stellar:')) {
    throw new MediRelayError(
      ErrorCode.PAYLOAD_UNSIGNED,
      `Invalid signerDid: ${payload.signerDid}`
    );
  }
}
