import { Connection, Transaction, sendAndConfirmRawTransaction, clusterApiUrl, PublicKey, type Cluster } from '@solana/web3.js';

declare global { var __solConn: Connection | undefined; }

const rpcUrl = process.env.SOLANA_RPC_URL ?? clusterApiUrl((process.env.SOLANA_NETWORK ?? 'devnet') as Cluster);

export const connection: Connection =
  process.env.NODE_ENV === 'development'
    ? (global.__solConn ??= new Connection(rpcUrl, 'confirmed'))
    : new Connection(rpcUrl, 'confirmed');

export async function getBalance(pubkey: string): Promise<number> {
  return (await connection.getBalance(new PublicKey(pubkey))) / 1e9;
}

export async function broadcastTransaction(signedTxBase64: string): Promise<string> {
  const tx = Transaction.from(Buffer.from(signedTxBase64, 'base64'));
  return sendAndConfirmRawTransaction(connection, tx.serialize(), { commitment: 'confirmed' });
}
