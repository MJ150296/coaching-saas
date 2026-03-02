import { NextResponse } from 'next/server';
import { getUsersOverview } from '../../../../shared/lib/analytics.server';

export async function GET() {
  try {
    const data = await getUsersOverview();
    return NextResponse.json(data);
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('api/analytics/users error', err?.message ?? err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
