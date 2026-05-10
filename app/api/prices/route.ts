import { NextResponse } from 'next/server';
import { getPrices }    from '@backend/services/oracle';

export const dynamic = 'force-dynamic';

export async function GET() {
  const prices = await getPrices(['SOL','ETH','BTC','USDC','BNB','MATIC','AVAX']).catch(() => ({}));
  return NextResponse.json({ prices, ts: Date.now() });
}
