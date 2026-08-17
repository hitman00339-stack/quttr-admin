import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Generate unique short code
function generateShortCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing chars
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      quantity = 1, 
      batch_name = '',
      notes = '',
      campaign = ''
    } = body;
    
    if (quantity < 1 || quantity > 1000) {
      return NextResponse.json({
        success: false,
        message: 'Quantity must be between 1 and 1000'
      }, { status: 400 });
    }
    
    const db = await getDb();
    const collection = db.collection('qr_codes');
    
    // Generate batch info
    const batchId = `BATCH_${Date.now()}`;
    const batchDisplayName = batch_name || `Batch ${new Date().toLocaleDateString()}`;
    
    // Generate QR codes
    const qrCodes = [];
    const baseUrl = process.env.NEXT_PUBLIC_QR_BASE_URL || 'https://quttrr.com';
    
    for (let i = 0; i < quantity; i++) {
      let short_code;
      let attempts = 0;
      
      // Generate unique code
      do {
        short_code = generateShortCode(6);
        const exists = await collection.findOne({ short_code });
        if (!exists) break;
        attempts++;
      } while (attempts < 10);
      
      if (attempts >= 10) {
        return NextResponse.json({
          success: false,
          message: 'Failed to generate unique code'
        }, { status: 500 });
      }
      
      const qrDoc = {
        short_code,
        full_url: `${baseUrl}/q/${short_code}`,
        status: 'INACTIVE',
        batch_id: batchId,
        batch_name: batchDisplayName,
        campaign: campaign || null,
        notes: notes || null,
        total_scans: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };
      
      qrCodes.push(qrDoc);
    }
    
    // Bulk insert
    await collection.insertMany(qrCodes);
    
    return NextResponse.json({
      success: true,
      message: `Generated ${quantity} QR codes`,
      batch_id: batchId,
      batch_name: batchDisplayName,
      count: quantity,
      codes: qrCodes.map(q => ({
        short_code: q.short_code,
        full_url: q.full_url,
      })),
    });
    
  } catch (error) {
    console.error('Generate QR error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to generate QR codes',
      error: error.message,
    }, { status: 500 });
  }
}

// Get all QR codes
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const batch = searchParams.get('batch');
    const limit = parseInt(searchParams.get('limit') || '100');
    const skip = parseInt(searchParams.get('skip') || '0');
    
    const db = await getDb();
    const collection = db.collection('qr_codes');
    
    // Build query
    const query = {};
    if (status) query.status = status;
    if (batch) query.batch_id = batch;
    
    // Get total count
    const total = await collection.countDocuments(query);
    
    // Get QR codes
    const codes = await collection
      .find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Get activation info for each
    const activations = await db.collection('qr_activations')
      .find({ qr_id: { $in: codes.map(c => c._id) } })
      .toArray();
    
    const activationMap = new Map(
      activations.map(a => [a.qr_id.toString(), a])
    );
    
    const enrichedCodes = codes.map(code => ({
      ...code,
      activation: activationMap.get(code._id.toString()) || null,
    }));
    
    return NextResponse.json({
      success: true,
      total,
      count: codes.length,
      codes: enrichedCodes,
    });
    
  } catch (error) {
    console.error('List QR error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch QR codes',
      error: error.message,
    }, { status: 500 });
  }
}
