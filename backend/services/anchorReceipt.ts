import { Connection, PublicKey, Keypair, SystemProgram } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import type { Idl } from '@coral-xyz/anchor';

const RPC_URL = process.env.SOLANA_RPC_URL ?? 'https://api.devnet.solana.com';
const PROGRAM_ID_STR = process.env.RECEIPT_PROGRAM_ID ?? 'VBroKERprogramId1111111111111111111111111111';

let _idl: Idl | null = null;

function loadIDL(): Idl {
  if (!_idl) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _idl = require('../../onchain/target/idl/vibe_broker.json') as Idl;
  }
  return _idl;
}

export interface ReceiptParams {
  simulationId: string;
  amountLamports: number;
  tokenFrom: string;
  tokenTo: string;
  confirmationType: string;
}

export async function recordReceiptOnChain(params: ReceiptParams): Promise<string> {
  // Sin keypair configurado → modo mock (no bloquea la ejecución)
  if (!process.env.SOLANA_SIGNER_KEYPAIR) {
    return `mock-receipt-${Date.now()}`;
  }

  const keypairBytes = JSON.parse(process.env.SOLANA_SIGNER_KEYPAIR) as number[];
  const signer = Keypair.fromSecretKey(Uint8Array.from(keypairBytes));
  const programId = new PublicKey(PROGRAM_ID_STR);
  const connection = new Connection(RPC_URL, 'confirmed');

  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(signer),
    { commitment: 'confirmed' },
  );

  const program = new anchor.Program(loadIDL(), programId, provider);
  const simId = params.simulationId.slice(0, 64);

  const [receiptPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('receipt'),
      signer.publicKey.toBuffer(),
      Buffer.from(simId),
    ],
    programId,
  );

  const tx = await program.methods
    .recordReceipt({
      simulationId: simId,
      amountLamports: new anchor.BN(Math.round(params.amountLamports)),
      tokenFrom: params.tokenFrom.slice(0, 10),
      tokenTo: params.tokenTo.slice(0, 10),
      confirmationType: params.confirmationType.slice(0, 20),
      timestamp: new anchor.BN(Math.floor(Date.now() / 1000)),
    })
    .accounts({
      receipt: receiptPda,
      authority: signer.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return tx;
}
