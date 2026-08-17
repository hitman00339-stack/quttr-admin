import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const batchId = params.batchId;
    const db = await getDb();
    
    const codes = await db.collection('qr_codes')
      .find({ batch_id: batchId })
      .sort({ created_at: 1 })
      .toArray();
    
    if (codes.length === 0) {
      return NextResponse.json({ success: false, message: 'Batch not found' }, { status: 404 });
    }
    
    const activations = await db.collection('qr_activations')
      .find({ qr_id: { $in: codes.map(c => c._id) } })
      .toArray();
    
    const activationMap = new Map(activations.map(a => [a.qr_id.toString(), a]));
    
    return NextResponse.json({
      success: true,
      batch: {
        batch_id: batchId,
        batch_name: codes[0].batch_name,
        notes: codes[0].notes,
        created_at: codes[0].created_at,
        total: codes.length,
      },
      codes: codes.map(code => ({
        _id: code._id.toString(),
        short_code: code.short_code,
        full_url: code.full_url,
        status: code.status,
        total_scans: code.total_scans || 0,
        last_scanned_at: code.last_scanned_at,
        created_at: code.created_at,
        activation: activationMap.get(code._id.toString()) || null,
      })),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
