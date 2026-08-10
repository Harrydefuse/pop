/**
 * Wallet loading and signing.
 *
 * The secret key is read once, held in memory, and never logged, serialised
 * into state, or sent anywhere. Every log line and API payload uses the public
 * key only. `toJSON` is overridden so an accidental `JSON.stringify(wallet)`
 * cannot leak it either.
 */
import fs from 'node:fs';
import path from 'node:path';

import { Connection, Keypair, VersionedTransaction, Transaction } from '@solana/web3.js';
import bs58 from 'bs58';

const decodeBase58 = bs58.default?.decode ?? bs58.decode;

/**
 * Accepts the two formats wallets actually export:
 *  - a base58 string (Phantom / Solflare "export private key")
 *  - a JSON array of 64 bytes (`solana-keygen` / `id.json`)
 */
export function keypairFromSecret(secret) {
  const trimmed = String(secret).trim();

  if (trimmed.startsWith('[')) {
    const bytes = Uint8Array.from(JSON.parse(trimmed));
    if (bytes.length !== 64) throw new Error(`expected a 64-byte key array, got ${bytes.length}`);
    return Keypair.fromSecretKey(bytes);
  }

  const decoded = decodeBase58(trimmed);
  if (decoded.length !== 64) throw new Error(`expected a 64-byte base58 key, got ${decoded.length}`);
  return Keypair.fromSecretKey(Uint8Array.from(decoded));
}

/**
 * Resolve the signing key.
 *
 * Precedence: an explicit keypair (tests), then `SOLANA_PRIVATE_KEY`, then the
 * file at `execution.keypairPath`. Returns null when none is configured —
 * that is the normal state, and it must never be an error on its own.
 */
export function loadWallet(config, env = process.env) {
  const secret = env.SOLANA_PRIVATE_KEY;
  if (secret) return new Wallet(keypairFromSecret(secret), 'SOLANA_PRIVATE_KEY');

  const file = config.execution?.keypairPath;
  if (file) {
    const resolved = path.isAbsolute(file) ? file : path.join(process.cwd(), file);
    if (!fs.existsSync(resolved)) throw new Error(`keypair file not found: ${resolved}`);

    // A world-readable key on a shared box is a real problem; say so loudly.
    const mode = fs.statSync(resolved).mode & 0o077;
    if (mode !== 0 && process.platform !== 'win32') {
      throw new Error(`keypair file ${resolved} is group/world accessible — run: chmod 600 ${resolved}`);
    }
    return new Wallet(keypairFromSecret(fs.readFileSync(resolved, 'utf8')), resolved);
  }

  return null;
}

export class Wallet {
  constructor(keypair, source) {
    this.#keypair = keypair;
    this.source = source;
    this.address = keypair.publicKey.toBase58();
  }

  #keypair;

  get publicKey() {
    return this.#keypair.publicKey;
  }

  /** Sign a base64-encoded transaction from a swap API and return it, still base64. */
  signBase64(base64) {
    const raw = Buffer.from(base64, 'base64');
    const transaction = deserializeTransaction(raw);
    if (transaction instanceof VersionedTransaction) {
      transaction.sign([this.#keypair]);
    } else {
      transaction.partialSign(this.#keypair);
    }
    return Buffer.from(transaction.serialize()).toString('base64');
  }

  /** Never let the secret reach a log, a state file, or an HTTP body. */
  toJSON() {
    return { address: this.address, source: this.source };
  }

  toString() {
    return `Wallet(${this.address})`;
  }
}

/** Swap APIs return v0 transactions; a few still return legacy ones. */
export function deserializeTransaction(raw) {
  try {
    return VersionedTransaction.deserialize(raw);
  } catch {
    return Transaction.from(raw);
  }
}

export function createConnection(config) {
  return new Connection(config.solana.rpcUrl, {
    commitment: config.execution?.commitment ?? 'confirmed',
  });
}

/** SOL balance in whole SOL. Used for the fee-reserve guard. */
export async function solBalance(connection, publicKey) {
  const lamports = await connection.getBalance(publicKey);
  return lamports / 1_000_000_000;
}
