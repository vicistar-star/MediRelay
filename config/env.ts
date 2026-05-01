import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type StellarNetwork = 'testnet' | 'mainnet';

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Required environment variable ${key} is not set`);
  return value;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const env = {
  stellar: {
    network: optionalEnv('STELLAR_NETWORK', 'testnet') as StellarNetwork,
    horizonUrl: optionalEnv(
      'STELLAR_HORIZON_URL',
      'https://horizon-testnet.stellar.org'
    ),
    get ministryRootPublicKey(): string {
      return requireEnv('MINISTRY_ROOT_PUBLIC_KEY');
    },
    // Only available server-side — never on mobile
    get facilityKeypairSecret(): string {
      return requireEnv('FACILITY_KEYPAIR_SECRET');
    },
  },
  logLevel: optionalEnv('LOG_LEVEL', 'info') as LogLevel,
} as const;
