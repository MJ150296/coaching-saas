import { NextResponse } from 'next/server';
import { getUsersOverview } from '../../../../shared/lib/analytics.server';

export async function GET() {
  try {
    const data = await getUsersOverview();
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('api/analytics/users error', (err as { message?: string }).message ?? err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

