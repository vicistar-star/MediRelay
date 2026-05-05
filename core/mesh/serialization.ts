import { encode, decode } from 'cbor-x';
import { ErrorCode, MediRelayError } from '../errors';
import { MeshPayload } from './types';

/** Serialize any value to CBOR bytes. */
export function encodeCBOR(value: unknown): Uint8Array {
  try {
    return encode(value);
  } catch (err) {
    throw new MediRelayError(
      ErrorCode.SERIALIZATION_FAILED,
      'CBOR encoding failed',
      err
    );
  }
}

/** Deserialize CBOR bytes back to a value. */
export function decodeCBOR<T>(bytes: Uint8Array): T {
  try {
    return decode(bytes) as T;
  } catch (err) {
    throw new MediRelayError(
      ErrorCode.SERIALIZATION_FAILED,
      'CBOR decoding failed',
      err
    );
  }
}

/** Serialize a MeshPayload to CBOR. */
export function serializePayload(payload: MeshPayload): Uint8Array {
  return encodeCBOR(payload);
}

/** Deserialize a MeshPayload from CBOR bytes. */
export function deserializePayload(bytes: Uint8Array): MeshPayload {
  return decodeCBOR<MeshPayload>(bytes);
}
