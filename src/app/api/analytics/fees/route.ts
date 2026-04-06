import { NextResponse } from 'next/server';
import { getFeesOverview } from '../../../../shared/lib/analytics.server';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const months = url.searchParams.get('months') ? Number(url.searchParams.get('months')) : undefined;
    const start = url.searchParams.get('start') ?? undefined;
    const end = url.searchParams.get('end') ?? undefined;
    const data = await getFeesOverview({ months, start, end });
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('api/analytics/fees error', (err as { message?: string }).message ?? err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

