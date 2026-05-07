import * as StellarSdk from '@stellar/stellar-sdk';
import { AnchorPayload, AnchorQueue, buildAnchorSchema } from './anchorQueue';
import { ErrorCode, MediRelayError } from '../core/errors';

export interface StellarClientConfig {
  horizonUrl: string;
  network: 'testnet' | 'mainnet';
  facilityKeypairSecret: string;
}

export interface AnchorResult {
  transactionHash: string;
  ledger: number;
}

/**
 * Stellar client for anchoring record hashes and managing the anchor queue.
 * Stellar is a notary — only hashes and non-identifying metadata go on-chain.
 */
export class StellarClient {
  private readonly server: StellarSdk.Horizon.Server;
  private readonly facilityKeypair: StellarSdk.Keypair;
  private readonly networkPassphrase: string;
  private readonly queue: AnchorQueue;

  constructor(config: StellarClientConfig) {
    this.server = new StellarSdk.Horizon.Server(config.horizonUrl);
    this.facilityKeypair = StellarSdk.Keypair.fromSecret(config.facilityKeypairSecret);
    this.networkPassphrase =
      config.network === 'mainnet'
        ? StellarSdk.Networks.PUBLIC
        : StellarSdk.Networks.TESTNET;
    this.queue = new AnchorQueue();
  }

  get facilityPublicKey(): string {
    return this.facilityKeypair.publicKey();
  }

  /** Queue a record hash for anchoring. Flushes immediately if online. */
  async anchor(payload: AnchorPayload): Promise<AnchorResult | null> {
    this.queue.enqueue(payload);
    return this.flush();
  }

  /**
   * Flush the anchor queue — submit all pending anchors to Stellar.
   * Returns the result of the last successful anchor, or null if offline.
   */
  async flush(): Promise<AnchorResult | null> {
    let lastResult: AnchorResult | null = null;

    while (!this.queue.isEmpty()) {
      const item = this.queue.dequeue();
      if (!item) break;

      try {
        lastResult = await this.submitAnchor(item);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.queue.recordFailure(item, message);
        // Stop flushing on first failure — likely offline
        break;
      }
    }

    return lastResult;
  }

  get pendingCount(): number {
    return this.queue.size;
  }

  private async submitAnchor(payload: AnchorPayload): Promise<AnchorResult> {
    let account: StellarSdk.AccountResponse;

    try {
      account = await this.server.loadAccount(this.facilityKeypair.publicKey());
    } catch {
      throw new MediRelayError(
        ErrorCode.STELLAR_OFFLINE,
        'Cannot reach Stellar Horizon — anchor queued for later'
      );
    }

    const schema = buildAnchorSchema(payload);
    const memoText = JSON.stringify(schema);

    // Stellar text memo is limited to 28 bytes — use hash memo with the raw record hash
    const memo = StellarSdk.Memo.hash(Buffer.from(payload.recordHash).toString('hex').slice(0, 64));

    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(
        StellarSdk.Operation.manageData({
          name: 'mediarelay:anchor',
          value: Buffer.from(memoText.slice(0, 64)), // store schema prefix in data entry
        })
      )
      .addMemo(memo)
      .setTimeout(30)
      .build();

    transaction.sign(this.facilityKeypair);

    try {
      const result = await this.server.submitTransaction(transaction);
      return {
        transactionHash: result.hash,
        ledger: result.ledger,
      };
    } catch (err) {
      throw new MediRelayError(
        ErrorCode.ANCHOR_FAILED,
        'Stellar transaction submission failed',
        err
      );
    }
  }
}
