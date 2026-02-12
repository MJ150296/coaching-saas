import { NextResponse } from 'next/server';
import { initializeApp } from '@/shared/bootstrap/init';

export async function POST() {
  await initializeApp();
  return NextResponse.json({ initialized: true });
}
