import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function generateShortCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { quantity = 10, batch_name = '', notes = '' } = body;
    
    if (quantity < 1 || quantity > 500) {
      return NextResponse.json({ success: false, message: 'Quantity must be 1-500' }, { status: 400 });
    }
    
    const db = await getDb();
    const collection = db.collection('qr_codes');
    
    const batchId = `BATCH_${Date.now()}`;
    const batchDisplayName = batch_name || `Batch ${new Date().toLocaleDateString('en-IN')}`;
    const baseUrl = process.env.NEXT_PUBLIC_QR_BASE_URL || 'https://quttrr.com';
    
    const qrCodes = [];
    const usedCodes = new Set();
    
    for (let i = 0; i < quantity; i++) {
      let short_code;
      let attempts = 0;
      
      do {
        short_code = generateShortCode();
        if (usedCodes.has(short_code)) continue;
        const exists = await collection.findOne({ short_code });
        if (!exists) { usedCodes.add(short_code); break; }
        attempts++;
      } while (attempts < 10);
      
      qrCodes.push({
        short_code,
        full_url: `${baseUrl}/q/${short_code}`,
        status: 'INACTIVE',
        batch_id: batchId,
        batch_name: batchDisplayName,
        notes: notes || null,
        total_scans: 0,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }
    
    await collection.insertMany(qrCodes);
    
    return NextResponse.json({
      success: true,
      batch_id: batchId,
      batch_name: batchDisplayName,
      count: quantity,
      codes: qrCodes.map(q => ({ short_code: q.short_code, full_url: q.full_url })),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const db = await getDb();
    const query = {};
    if (status && status !== 'ALL') query.status = status;
    
    const total = await db.collection('qr_codes').countDocuments(query);
    const codes = await db.collection('qr_codes')
      .find(query).sort({ created_at: -1 }).limit(limit).toArray();
    
    const activations = await db.collection('qr_activations')
      .find({ qr_id: { $in: codes.map(c => c._id) } }).toArray();
    
    const activationMap = new Map(activations.map(a => [a.qr_id.toString(), a]));
    
    return NextResponse.json({
      success: true,
      total,
      count: codes.length,
      codes: codes.map(code => ({
        ...code,
        _id: code._id.toString(),
        activation: activationMap.get(code._id.toString()) || null,
      })),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
