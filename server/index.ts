import * as http from 'http';
import { MeshStore } from '../core/mesh/store';
import { deserializePayload, assertPayloadValid } from '../core/mesh';
import { StellarClient } from '../stellar/client';
import { env } from '../config/env';

const PORT = parseInt(process.env.PORT ?? '3000', 10);

const meshStore = new MeshStore();

// Stellar client is only initialized if facility keypair is configured
let stellarClient: StellarClient | null = null;
try {
  stellarClient = new StellarClient({
    horizonUrl: env.stellar.horizonUrl,
    network: env.stellar.network,
    facilityKeypairSecret: env.stellar.facilityKeypairSecret,
  });
  console.log(`[hub] Stellar client ready — facility: ${stellarClient.facilityPublicKey}`);
} catch {
  console.warn('[hub] FACILITY_KEYPAIR_SECRET not set — Stellar anchoring disabled');
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        records: meshStore.size,
        pendingAnchor: stellarClient?.pendingCount ?? 0,
      })
    );
    return;
  }

  if (req.method === 'POST' && req.url === '/relay') {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const body = Buffer.concat(chunks);
        const payload = deserializePayload(new Uint8Array(body));
        assertPayloadValid(payload);

        if (!meshStore.has(payload.recordHash)) {
          meshStore.add(payload);
          console.log(`[hub] Stored record from ${payload.signerDid}`);

          // Queue for Stellar anchoring
          if (stellarClient) {
            await stellarClient.anchor({
              recordHash: payload.recordHash,
              patientDid: payload.signerDid,
              facilityId: payload.facilityId,
              timestamp: payload.timestamp,
            });
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.log(`[hub] District hub node listening on port ${PORT}`);
});

export default server;
