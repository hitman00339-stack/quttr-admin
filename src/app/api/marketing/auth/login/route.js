import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { createAgentSession } from '@/lib/auth-agent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { identifier, password } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, message: 'Phone/email and password required' },
        { status: 400 }
      );
    }

    const id = identifier.trim().toLowerCase();
    const db = await getDb();

    // Match by phone OR email
    const agent = await db.collection('marketing_agents').findOne({
      $or: [{ phone: id }, { email: id }],
    });

    if (!agent) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (!agent.is_active) {
      return NextResponse.json(
        { success: false, message: 'Account suspended. Contact admin.' },
        { status: 403 }
      );
    }

    const ok = await bcrypt.compare(password, agent.password_hash);
    if (!ok) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Device info
    const ua = request.headers.get('user-agent') || '';
    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();

    await createAgentSession(agent._id, {
      ua: ua.substring(0, 200),
      ip: ip.substring(0, 20),
      login_at: new Date(),
    });

    await db.collection('marketing_agents').updateOne(
      { _id: agent._id },
      { $set: { last_login_at: new Date() } }
    );

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      agent: {
        _id: agent._id.toString(),
        name: agent.name,
        phone: agent.phone,
        email: agent.email,
        city_assigned: agent.city_assigned || null,
      },
    });
  } catch (error) {
    console.error('[agent login] error:', error);
    return NextResponse.json(
      { success: false, message: 'Login failed' },
      { status: 500 }
    );
  }
}
