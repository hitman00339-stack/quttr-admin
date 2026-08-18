import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET single agent with their activation stats
export async function GET(request, { params }) {
  try {
    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid id' }, { status: 400 });
    }

    const db = await getDb();
    const agent = await db.collection('marketing_agents').findOne(
      { _id: new ObjectId(id) },
      { projection: { password_hash: 0 } }
    );
    if (!agent) {
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }

    // Recent activations by this agent
    const activations = await db
      .collection('qr_activations')
      .find({ activated_by_id: agent._id })
      .sort({ activated_at: -1 })
      .limit(50)
      .toArray();

    // Aggregate scans on their QRs
    const qrIds = activations.map((a) => a.qr_id);
    const scanAgg = await db.collection('scan_events')
      .aggregate([
        { $match: { qr_id: { $in: qrIds } } },
        { $group: { _id: null, total: { $sum: 1 } } },
      ])
      .toArray();
    const totalScans = scanAgg[0]?.total || 0;

    return NextResponse.json({
      success: true,
      agent: { ...agent, _id: agent._id.toString() },
      stats: {
        total_activations: activations.length,
        total_scans: totalScans,
      },
      recent_activations: activations.map((a) => ({
        ...a,
        _id: a._id.toString(),
        qr_id: a.qr_id.toString(),
      })),
    });
  } catch (error) {
    console.error('[GET /api/marketing/agents/[id]] error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH: update agent (name, phone, email, city, is_active, or reset password)
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid id' }, { status: 400 });
    }

    const body = await request.json();
    const updates = { updated_at: new Date() };

    if (typeof body.name === 'string') updates.name = body.name.trim();
    if (typeof body.phone === 'string') updates.phone = body.phone.trim();
    if (typeof body.email === 'string') updates.email = body.email.trim().toLowerCase() || null;
    if (typeof body.city_assigned === 'string') updates.city_assigned = body.city_assigned.trim() || null;
    if (typeof body.notes === 'string') updates.notes = body.notes.trim() || null;
    if (typeof body.is_active === 'boolean') updates.is_active = body.is_active;

    if (body.new_password) {
      if (body.new_password.length < 6) {
        return NextResponse.json(
          { success: false, message: 'Password must be at least 6 chars' },
          { status: 400 }
        );
      }
      updates.password_hash = await bcrypt.hash(body.new_password, 10);
      // Kill all existing sessions on password reset
      const db = await getDb();
      await db.collection('agent_sessions').deleteMany({ agent_id: new ObjectId(id) });
    }

    const db = await getDb();
    const result = await db.collection('marketing_agents').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updates },
      { returnDocument: 'after', projection: { password_hash: 0 } }
    );

    if (!result) {
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }

    // If deactivated, kill sessions
    if (updates.is_active === false) {
      await db.collection('agent_sessions').deleteMany({ agent_id: new ObjectId(id) });
    }

    return NextResponse.json({
      success: true,
      message: 'Agent updated',
      agent: { ...result, _id: result._id.toString() },
    });
  } catch (error) {
    console.error('[PATCH /api/marketing/agents/[id]] error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE agent (also removes their sessions but preserves their activation history)
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid id' }, { status: 400 });
    }

    const db = await getDb();
    const agentOid = new ObjectId(id);

    await db.collection('agent_sessions').deleteMany({ agent_id: agentOid });
    const result = await db.collection('marketing_agents').deleteOne({ _id: agentOid });

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Agent deleted. Their QR activation history is preserved.',
    });
  } catch (error) {
    console.error('[DELETE /api/marketing/agents/[id]] error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
