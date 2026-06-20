import { recordReceiptOnChain } from '../backend/services/anchorReceipt';

describe('anchorReceipt', () => {
  const baseParams = {
    simulationId: 'sim-test-001',
    amountLamports: 50_000_000,
    tokenFrom: 'USDC',
    tokenTo: 'SOL',
    confirmationType: 'voice',
  };

  it('devuelve mock-receipt cuando no hay SOLANA_SIGNER_KEYPAIR', async () => {
    delete process.env.SOLANA_SIGNER_KEYPAIR;
    const result = await recordReceiptOnChain(baseParams);
    expect(result).toMatch(/^mock-receipt-\d+$/);
  });

  it('trunca simulationId a 64 chars sin lanzar error', async () => {
    delete process.env.SOLANA_SIGNER_KEYPAIR;
    const longId = 'a'.repeat(100);
    const result = await recordReceiptOnChain({ ...baseParams, simulationId: longId });
    expect(result).toMatch(/^mock-receipt-\d+$/);
  });

  it('trunca tokenFrom y tokenTo a 10 chars sin lanzar error', async () => {
    delete process.env.SOLANA_SIGNER_KEYPAIR;
    const result = await recordReceiptOnChain({
      ...baseParams,
      tokenFrom: 'TOKENTOOLONG',
      tokenTo: 'ALSOTOOLONG',
    });
    expect(result).toMatch(/^mock-receipt-\d+$/);
  });
});
