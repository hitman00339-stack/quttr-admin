import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// -------- GET: list all agents (admin) --------
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').trim();
    const status = searchParams.get('status'); // 'active' | 'inactive' | 'all'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const db = await getDb();
    const query = {};
    if (status === 'active') query.is_active = true;
    if (status === 'inactive') query.is_active = false;
    if (search) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ name: re }, { phone: re }, { email: re }, { city_assigned: re }];
    }

    const total = await db.collection('marketing_agents').countDocuments(query);
    const agents = await db
      .collection('marketing_agents')
      .find(query, { projection: { password_hash: 0 } })
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      success: true,
      total,
      agents: agents.map((a) => ({ ...a, _id: a._id.toString() })),
    });
  } catch (error) {
    console.error('[GET /api/marketing/agents] error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// -------- POST: create new agent (admin) --------
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, phone, email, password, city_assigned, notes } = body;

    if (!name || !phone || !password) {
      return NextResponse.json(
        { success: false, message: 'Name, phone, and password are required' },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.trim();
    const cleanEmail = (email || '').trim().toLowerCase() || null;
    const db = await getDb();

    // Uniqueness check
    const existing = await db.collection('marketing_agents').findOne({
      $or: [{ phone: cleanPhone }, ...(cleanEmail ? [{ email: cleanEmail }] : [])],
    });
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'An agent with this phone/email already exists' },
        { status: 409 }
      );
    }

    const password_hash = await bcrypt.hash(password, 10);

    const doc = {
      name: name.trim(),
      phone: cleanPhone,
      email: cleanEmail,
      password_hash,
      city_assigned: (city_assigned || '').trim() || null,
      notes: (notes || '').trim() || null,
      is_active: true,
      total_activations: 0,
      total_scans_generated: 0,
      created_by: 'admin',
      created_at: new Date(),
      updated_at: new Date(),
      last_login_at: null,
    };

    const result = await db.collection('marketing_agents').insertOne(doc);

    return NextResponse.json({
      success: true,
      message: 'Agent created successfully',
      agent: {
        _id: result.insertedId.toString(),
        name: doc.name,
        phone: doc.phone,
        email: doc.email,
        city_assigned: doc.city_assigned,
        is_active: true,
      },
    });
  } catch (error) {
    console.error('[POST /api/marketing/agents] error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
