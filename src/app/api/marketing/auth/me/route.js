import { NextResponse } from 'next/server';
import { getCurrentAgent } from '@/lib/auth-agent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const agent = await getCurrentAgent();
  if (!agent) {
    return NextResponse.json(
      { success: false, message: 'Not logged in' },
      { status: 401 }
    );
  }
  return NextResponse.json({ success: true, agent });
}
