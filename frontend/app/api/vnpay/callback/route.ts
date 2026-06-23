import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://backend:3003';
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();

    // Proxy the IPN request to the backend's VNPay IPN handler
    const res = await fetch(`${backendUrl}/payment/vnpay/ipn?${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const baseUrl = process.env.SITE_URL || 'https://olp.drmartinel.xyz';

    // Redirect the user to the frontend visual return page
    return NextResponse.redirect(new URL(`/payment/vnpay-return?${queryString}`, baseUrl));
  } catch (error) {
    console.error('VNPay IPN Proxy Error:', error);
    // Even on error, redirect the user to the return page so they see a proper UI
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const baseUrl = process.env.SITE_URL || 'https://olp.drmartinel.xyz';
    return NextResponse.redirect(new URL(`/payment/vnpay-return?${queryString}`, baseUrl));
  }
}
