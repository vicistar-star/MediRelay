#!/usr/bin/env ts-node
/**
 * Key hierarchy generator.
 * Usage:
 *   npm run keygen:hierarchy          — generate MoH → District → Facility → CHW chain
 *   npm run keygen -- --role chw --facility fac:ng:kano:rural-01
 */
import * as StellarSdk from '@stellar/stellar-sdk';
import { didFromPublicKey, toBase64 } from '../core/crypto/crypto';
import { InMemoryKeystore } from '../core/crypto/keystore';

interface KeyOutput {
  role: string;
  did: string;
  stellarPublicKey: string;
  signingPublicKey: string;
  issuerId?: string;
}

function generateStellarKeypair(): { publicKey: string; secret: string } {
  const kp = StellarSdk.Keypair.random();
  return { publicKey: kp.publicKey(), secret: kp.secret() };
}

function printKey(label: string, output: KeyOutput): void {
  console.log(`\n--- ${label} ---`);
  console.log(`DID:              ${output.did}`);
  console.log(`Stellar PubKey:   ${output.stellarPublicKey}`);
  console.log(`Signing PubKey:   ${output.signingPublicKey}`);
  if (output.issuerId) console.log(`Issued by:        ${output.issuerId}`);
}

function generateHierarchy(): void {
  const store = new InMemoryKeystore();

  const roles = [
    { id: 'ministry', role: 'ministry' as const, label: 'Ministry of Health (Root)' },
    { id: 'district', role: 'district' as const, label: 'District Health Authority', issuerId: 'ministry' },
    { id: 'facility', role: 'facility' as const, label: 'Facility Keypair', issuerId: 'district' },
    { id: 'chw', role: 'health-worker' as const, label: 'Health Worker (CHW)', issuerId: 'facility' },
  ];

  const outputs: KeyOutput[] = [];

  for (const r of roles) {
    const stellar = generateStellarKeypair();
    const entry = store.generateAndStore(r.id, r.role, r.issuerId);
    const output: KeyOutput = {
      role: r.role,
      did: didFromPublicKey(stellar.publicKey),
      stellarPublicKey: stellar.publicKey,
      signingPublicKey: toBase64(entry.signingKeypair.publicKey),
      issuerId: r.issuerId ? outputs.find((o) => o.role === r.issuerId)?.did : undefined,
    };
    outputs.push(output);
    printKey(r.label, output);
  }

  console.log('\n⚠️  Secret keys are NOT printed. Store them in your secrets manager.');
  console.log('Copy the Ministry Stellar public key to MINISTRY_ROOT_PUBLIC_KEY in .env');
  console.log('Copy the Facility secret key to FACILITY_KEYPAIR_SECRET in .env (server only)\n');
}

const args = process.argv.slice(2);
if (args.includes('--hierarchy')) {
  generateHierarchy();
} else {
  const roleIdx = args.indexOf('--role');
  const role = roleIdx >= 0 ? args[roleIdx + 1] : 'health-worker';
  const facilityIdx = args.indexOf('--facility');
  const facilityId = facilityIdx >= 0 ? args[facilityIdx + 1] : 'fac:unknown';

  const stellar = generateStellarKeypair();
  const store = new InMemoryKeystore();
  const entry = store.generateAndStore(role, 'health-worker', facilityId);

  console.log(`\nGenerated keypair for role: ${role}`);
  console.log(`DID:            ${didFromPublicKey(stellar.publicKey)}`);
  console.log(`Stellar PubKey: ${stellar.publicKey}`);
  console.log(`Signing PubKey: ${toBase64(entry.signingKeypair.publicKey)}`);
  console.log(`Facility:       ${facilityId}`);
  console.log('\n⚠️  Secret key not printed. Store in Android Keystore on device.\n');
}
