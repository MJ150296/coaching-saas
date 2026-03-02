import { NextResponse } from 'next/server';
import { getAcademicOverview } from '../../../../shared/lib/analytics.server';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const months = url.searchParams.get('months') ? Number(url.searchParams.get('months')) : undefined;
    const start = url.searchParams.get('start') ?? undefined;
    const end = url.searchParams.get('end') ?? undefined;
    const data = await getAcademicOverview({ months, start, end });
    return NextResponse.json(data);
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('api/analytics/academic error', err?.message ?? err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
