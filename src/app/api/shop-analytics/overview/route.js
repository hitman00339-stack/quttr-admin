import { NextResponse } from 'next/server';
import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://quttr-backend.onrender.com/api/v1';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days') || '30';
    const city = searchParams.get('city');
    const shopId = searchParams.get('shopId');

    // Get admin token from request headers
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('quttr_admin_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: 'No token' }, { status: 401 });
    }

    const params = { days };
    if (city && city !== 'all') params.city = city;
    if (shopId && shopId !== 'all') params.shopId = shopId;

    const response = await axios.get(`${BACKEND_URL}/admin/shop-analytics`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });

    return NextResponse.json(response.data);
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error.response?.data?.message || error.message,
    }, { status: error.response?.status || 500 });
  }
}
