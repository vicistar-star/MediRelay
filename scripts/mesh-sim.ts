#!/usr/bin/env ts-node
/**
 * Two-node mesh simulator.
 * Creates two virtual nodes that exchange signed records over a local socket,
 * mimicking Bluetooth transport.
 *
 * Usage: npm run mesh:sim -- --nodes 2
 */
import * as net from 'net';
import { generateSigningKeypair, generateBoxKeypair } from '../core/crypto/crypto';
import { buildMeshPayload, verifyPayloadSignature, assertPayloadValid } from '../core/mesh/payload';
import { MeshStore } from '../core/mesh/store';
import { serializePayload, deserializePayload } from '../core/mesh/serialization';
import { buildPatient, buildBundle } from '../core/fhir/builders';
import { issueDid } from '../stellar/did';

const PORT = 9876;

interface SimNode {
  id: string;
  store: MeshStore;
  signingKeypair: ReturnType<typeof generateSigningKeypair>;
  boxKeypair: ReturnType<typeof generateBoxKeypair>;
}

function createNode(id: string): SimNode {
  return {
    id,
    store: new MeshStore(),
    signingKeypair: generateSigningKeypair(),
    boxKeypair: generateBoxKeypair(),
  };
}

function log(node: string, msg: string): void {
  console.log(`[${new Date().toISOString()}] [${node}] ${msg}`);
}

async function runSimulator(): Promise<void> {
  const nodeA = createNode('node-A');
  const nodeB = createNode('node-B');

  // Node A creates a patient record and broadcasts it
  const patientDid = issueDid();
  const patient = buildPatient({
    did: patientDid.did,
    givenName: 'Amina',
    familyName: 'Musa',
    birthDate: '1990-03-22',
    gender: 'female',
    facilityId: 'fac:ng:kano:rural-01',
  });
  const bundle = buildBundle([patient]);

  const payload = buildMeshPayload({
    fhirBundle: bundle,
    patientBoxPublicKey: nodeA.boxKeypair.publicKey,
    signerDid: `did:stellar:NODE_A`,
    facilityId: 'fac:ng:kano:rural-01',
    signingSecretKey: nodeA.signingKeypair.secretKey,
  });

  log('node-A', `Created record for patient ${patientDid.did}`);

  // Simulate TCP transport between nodes
  const server = net.createServer((socket) => {
    const chunks: Buffer[] = [];
    socket.on('data', (chunk) => chunks.push(chunk));
    socket.on('end', () => {
      const data = Buffer.concat(chunks);
      const received = deserializePayload(new Uint8Array(data));

      try {
        assertPayloadValid(received);
        const valid = verifyPayloadSignature(received, nodeA.signingKeypair.publicKey);
        log('node-B', `Received payload — signature valid: ${valid}`);

        if (!nodeB.store.has(received.recordHash)) {
          nodeB.store.add(received);
          log('node-B', `Stored record. Total records: ${nodeB.store.size}`);
        } else {
          log('node-B', 'Duplicate — skipped');
        }
      } catch (err) {
        log('node-B', `Rejected payload: ${err}`);
      }

      server.close();
    });
  });

  await new Promise<void>((resolve) => server.listen(PORT, resolve));
  log('node-B', `Listening on port ${PORT}`);

  // Node A connects and sends the payload
  const client = net.createConnection(PORT, '127.0.0.1', () => {
    const bytes = serializePayload(payload);
    client.end(Buffer.from(bytes));
    log('node-A', `Sent ${bytes.length} bytes to node-B`);
  });

  await new Promise<void>((resolve) => server.on('close', resolve));

  log('sim', `✓ Mesh simulation complete. node-B has ${nodeB.store.size} record(s).`);
}

runSimulator().catch((err) => {
  console.error('Simulation failed:', err);
  process.exit(1);
});
