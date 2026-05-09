import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { VibeBroker } from "../target/types/vibe_broker";
import { assert } from "chai";

describe("vibe-broker — RecordReceipt", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.VibeBroker as Program<VibeBroker>;
  const authority = provider.wallet as anchor.Wallet;

  const SIM_ID = `sim-test-${Date.now()}`;

  let receiptPda: anchor.web3.PublicKey;
  let bump: number;

  before(async () => {
    [receiptPda, bump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("receipt"), authority.publicKey.toBuffer(), Buffer.from(SIM_ID)],
      program.programId,
    );
    console.log("  Receipt PDA:", receiptPda.toBase58());
  });

  it("Registra un recibo voice-only correctamente", async () => {
    const params = {
      simulationId: SIM_ID,
      amountLamports: new anchor.BN(50_000_000), // 0.05 SOL
      tokenFrom: "USDC",
      tokenTo: "SOL",
      confirmationType: 0,
    };

    await program.methods
      .recordReceipt(params)
      .accounts({ authority: authority.publicKey, receipt: receiptPda })
      .rpc();

    const receipt = await program.account.receipt.fetch(receiptPda);
    assert.equal(receipt.simulationId, SIM_ID);
    assert.equal(receipt.amountLamports.toString(), "50000000");
    assert.equal(receipt.tokenFrom, "USDC");
    assert.equal(receipt.tokenTo, "SOL");
    assert.equal(receipt.confirmationType, 0);
    assert.ok(receipt.timestamp.gt(new anchor.BN(0)));
  });

  it("Rechaza monto cero", async () => {
    const badSimId = `sim-zero-${Date.now()}`;
    const [badPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("receipt"), authority.publicKey.toBuffer(), Buffer.from(badSimId)],
      program.programId,
    );

    try {
      await program.methods
        .recordReceipt({ simulationId: badSimId, amountLamports: new anchor.BN(0), tokenFrom: "SOL", tokenTo: "USDC", confirmationType: 1 })
        .accounts({ authority: authority.publicKey, receipt: badPda })
        .rpc();
      assert.fail("Debería haber fallado con ZeroAmount");
    } catch (e: unknown) {
      assert.include((e as Error).message, "ZeroAmount");
    }
  });

  it("Cierra el recibo y recupera el rent", async () => {
    const balanceBefore = await provider.connection.getBalance(authority.publicKey);

    await program.methods
      .closeReceipt()
      .accounts({ authority: authority.publicKey, receipt: receiptPda })
      .rpc();

    const balanceAfter = await provider.connection.getBalance(authority.publicKey);
    assert.isAbove(balanceAfter, balanceBefore - 5000); // recuperó rent minus tx fee

    try {
      await program.account.receipt.fetch(receiptPda);
      assert.fail("La cuenta debería estar cerrada");
    } catch {
      // esperado
    }
  });
});
