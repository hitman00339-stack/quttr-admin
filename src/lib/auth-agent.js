import { cookies } from 'next/headers';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

const AGENT_COOKIE_NAME = 'quttr_agent_session';
const SESSION_DAYS = 30;

/**
 * Create a new agent session (called after successful login)
 */
export async function createAgentSession(agentId, deviceInfo = {}) {
  const db = await getDb();
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await db.collection('agent_sessions').insertOne({
    agent_id: new ObjectId(agentId),
    token,
    expires_at: expiresAt,
    created_at: new Date(),
    last_seen_at: new Date(),
    device: deviceInfo,
  });

  // Set httpOnly cookie
  const cookieStore = await cookies();
  cookieStore.set(AGENT_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });

  return token;
}

/**
 * Get the currently logged-in agent (from cookie)
 * Returns null if not logged in or session expired.
 */
export async function getCurrentAgent() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AGENT_COOKIE_NAME)?.value;
    if (!token) return null;

    const db = await getDb();
    const session = await db.collection('agent_sessions').findOne({
      token,
      expires_at: { $gt: new Date() },
    });
    if (!session) return null;

    const agent = await db.collection('marketing_agents').findOne({
      _id: session.agent_id,
      is_active: true,
    });
    if (!agent) return null;

    // Update last seen (fire-and-forget)
    db.collection('agent_sessions').updateOne(
      { _id: session._id },
      { $set: { last_seen_at: new Date() } }
    ).catch(() => {});

    // Return safe subset — NEVER return password_hash
    return {
      _id: agent._id.toString(),
      name: agent.name,
      phone: agent.phone,
      email: agent.email,
      city_assigned: agent.city_assigned || null,
      total_activations: agent.total_activations || 0,
      total_scans_generated: agent.total_scans_generated || 0,
      joined_at: agent.created_at,
    };
  } catch (e) {
    console.error('[getCurrentAgent] error:', e);
    return null;
  }
}

/**
 * Destroy current agent session (logout)
 */
export async function destroyAgentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AGENT_COOKIE_NAME)?.value;
  if (token) {
    try {
      const db = await getDb();
      await db.collection('agent_sessions').deleteOne({ token });
    } catch (e) {}
  }
  cookieStore.delete(AGENT_COOKIE_NAME);
}

/**
 * Middleware helper: require agent auth in API routes.
 * Returns { agent } if ok, or { error: NextResponse } if not.
 */
export async function requireAgent() {
  const agent = await getCurrentAgent();
  if (!agent) {
    return {
      error: {
        success: false,
        message: 'Not authenticated. Please log in.',
        status: 401,
      },
    };
  }
  return { agent };
}
