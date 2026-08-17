import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Get all batches
export async function GET() {
  try {
    const db = await getDb();
    
    const batches = await db.collection('qr_codes').aggregate([
      {
        $group: {
          _id: '$batch_id',
          batch_name: { $first: '$batch_name' },
          notes: { $first: '$notes' },
          count: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] } },
          inactive: { $sum: { $cond: [{ $eq: ['$status', 'INACTIVE'] }, 1, 0] } },
          paused: { $sum: { $cond: [{ $eq: ['$status', 'PAUSED'] }, 1, 0] } },
          total_scans: { $sum: '$total_scans' },
          created_at: { $first: '$created_at' },
        }
      },
      { $sort: { created_at: -1 } }
    ]).toArray();
    
    return NextResponse.json({
      success: true,
      batches: batches.map(b => ({
        batch_id: b._id,
        batch_name: b.batch_name,
        notes: b.notes,
        total: b.count,
        active: b.active,
        inactive: b.inactive,
        paused: b.paused,
        total_scans: b.total_scans || 0,
        created_at: b.created_at,
      })),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
