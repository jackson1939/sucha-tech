import { Connection, PublicKey, Keypair, SystemProgram } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import type { Idl } from '@coral-xyz/anchor';

const RPC_URL        = process.env.SOLANA_RPC_URL     ?? 'https://api.devnet.solana.com';
const PROGRAM_ID_STR = process.env.RECEIPT_PROGRAM_ID ?? 'DLUY5F8d4TtRxWXgJQMXH7hhaDTDbnqtkZsVbWDtMsYx';

// IDL inline — derivado de onchain/programs/vibe-broker/src/lib.rs
// No depende del artifact generado por anchor build.
// confirmation_type es u8: 0 = voice, 1 = double/pin
// timestamp NO va en params — el programa lo lee del Clock on-chain.
const VIBE_BROKER_IDL: Idl = {
  version: '0.1.0',
  name: 'vibe_broker',
  instructions: [
    {
      name: 'recordReceipt',
      accounts: [
        { name: 'authority',     isMut: true,  isSigner: true  },
        { name: 'receipt',       isMut: true,  isSigner: false },
        { name: 'systemProgram', isMut: false, isSigner: false },
      ],
      args: [{ name: 'params', type: { defined: 'ReceiptParams' } }],
    },
    {
      name: 'closeReceipt',
      accounts: [
        { name: 'authority', isMut: true,  isSigner: true  },
        { name: 'receipt',   isMut: true,  isSigner: false },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: 'Receipt',
      type: {
        kind: 'struct',
        fields: [
          { name: 'authority',        type: 'publicKey' },
          { name: 'simulationId',     type: 'string'    },
          { name: 'amountLamports',   type: 'u64'       },
          { name: 'tokenFrom',        type: 'string'    },
          { name: 'tokenTo',          type: 'string'    },
          { name: 'confirmationType', type: 'u8'        },
          { name: 'timestamp',        type: 'i64'       },
          { name: 'bump',             type: 'u8'        },
        ],
      },
    },
  ],
  types: [
    {
      name: 'ReceiptParams',
      type: {
        kind: 'struct',
        fields: [
          { name: 'simulationId',     type: 'string' },
          { name: 'amountLamports',   type: 'u64'    },
          { name: 'tokenFrom',        type: 'string' },
          { name: 'tokenTo',          type: 'string' },
          { name: 'confirmationType', type: 'u8'     },
        ],
      },
    },
  ],
  errors: [
    { code: 6000, name: 'ZeroAmount',       msg: 'El monto no puede ser cero' },
    { code: 6001, name: 'SimIdTooLong',     msg: 'simulation_id excede 64 caracteres' },
    { code: 6002, name: 'TokenNameTooLong', msg: 'Nombre de token excede 10 caracteres' },
  ],
  events: [
    {
      name: 'ReceiptRecorded',
      fields: [
        { name: 'authority',    type: 'publicKey', index: false },
        { name: 'simulationId', type: 'string',    index: false },
        { name: 'amount',       type: 'u64',       index: false },
        { name: 'timestamp',    type: 'i64',       index: false },
      ],
    },
  ],
};

export interface ReceiptParams {
  simulationId:     string;
  amountLamports:   number;
  tokenFrom:        string;
  tokenTo:          string;
  confirmationType: string;  // 'voice' | 'pin' — se convierte a u8 internamente
}

export async function recordReceiptOnChain(params: ReceiptParams): Promise<string> {
  // Sin keypair configurado → modo mock (no bloquea la ejecución)
  if (!process.env.SOLANA_SIGNER_KEYPAIR) {
    return `mock-receipt-${Date.now()}`;
  }

  const keypairBytes  = JSON.parse(process.env.SOLANA_SIGNER_KEYPAIR) as number[];
  const signer        = Keypair.fromSecretKey(Uint8Array.from(keypairBytes));
  const programId     = new PublicKey(PROGRAM_ID_STR);
  const connection    = new Connection(RPC_URL, 'confirmed');

  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(signer),
    { commitment: 'confirmed' },
  );

  const program = new anchor.Program(VIBE_BROKER_IDL, programId, provider);
  const simId   = params.simulationId.slice(0, 64);

  // u8: 0 = voice-only, 1 = double-confirm/pin
  const confirmTypeU8 = params.confirmationType === 'voice' ? 0 : 1;

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
      simulationId:     simId,
      amountLamports:   new anchor.BN(Math.round(params.amountLamports)),
      tokenFrom:        params.tokenFrom.slice(0, 10),
      tokenTo:          params.tokenTo.slice(0, 10),
      confirmationType: confirmTypeU8,
      // timestamp omitido — Clock::get() lo provee on-chain
    })
    .accounts({
      receipt:       receiptPda,
      authority:     signer.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return tx;
}
