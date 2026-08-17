import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/mongodb';
import { setupDatabase } from '../../../../lib/db-setup';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDb();
    const collections = await db.listCollections().toArray();
    
    return NextResponse.json({
      success: true,
      message: 'MongoDB connected successfully!',
      database: process.env.MONGODB_DB_NAME,
      collectionsCount: collections.length,
      collections: collections.map(c => c.name),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'MongoDB connection failed',
      error: error.message,
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    const result = await setupDatabase();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Setup failed',
      error: error.message,
    }, { status: 500 });
  }
}
