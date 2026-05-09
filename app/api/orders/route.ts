import { NextRequest, NextResponse } from 'next/server';
import { query } from '@backend/db';
import type { OrderRow } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId)
    return NextResponse.json({ error: true, code: 'MISSING_USER_ID' }, { status: 400 });

  const orders = await query<OrderRow>(
    `SELECT o.* FROM orders o JOIN users u ON u.id=o.user_id
     WHERE u.id=$1 OR u.email=$2 ORDER BY o.created_at DESC LIMIT 50`,
    [userId, `${userId}@vibebroker.dev`],
  ).catch(() => [] as OrderRow[]);

  return NextResponse.json({ orders });
}
