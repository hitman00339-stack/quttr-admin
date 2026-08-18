import { NextResponse } from 'next/server';
import { destroyAgentSession } from '@/lib/auth-agent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  await destroyAgentSession();
  return NextResponse.json({ success: true, message: 'Logged out' });
}
