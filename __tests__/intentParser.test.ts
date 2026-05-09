import { parseIntent } from '@backend/services/intentParser';

describe('parseIntent', () => {
  test('compra en español',    () => { const r = parseIntent('compra 0.1 SOL');      expect(r.action).toBe('buy');  expect(r.amount).toBe(0.1);  expect(r.tokenTo).toBe('SOL');  expect(r.tokenFrom).toBe('USDC'); });
  test('buy en inglés',        () => { const r = parseIntent('buy 50 USDC');         expect(r.action).toBe('buy');  expect(r.amount).toBe(50);   expect(r.tokenTo).toBe('USDC'); });
  test('vender en español',    () => { const r = parseIntent('vende 0.5 SOL');       expect(r.action).toBe('sell'); expect(r.amount).toBe(0.5);  expect(r.tokenFrom).toBe('SOL');  expect(r.tokenTo).toBe('USDC'); });
  test('swap español',         () => { const r = parseIntent('cambia 10 USDC por SOL'); expect(r.action).toBe('swap'); expect(r.tokenFrom).toBe('USDC'); expect(r.tokenTo).toBe('SOL'); });
  test('swap inglés',          () => { const r = parseIntent('swap 1 ETH for USDC'); expect(r.action).toBe('swap'); expect(r.tokenFrom).toBe('ETH'); });
  test('balance',              () => { expect(parseIntent('cuánto tengo').action).toBe('balance'); });
  test('intención desconocida',() => { expect(parseIntent('hola mundo').action).toBe('unknown'); });
  test('normaliza solana→SOL', () => { expect(parseIntent('compra 1 solana').tokenTo).toBe('SOL'); });
  test('preserva confidence',  () => { expect(parseIntent('compra 0.05 sol', 0.72).confidence).toBe(0.72); });
});
