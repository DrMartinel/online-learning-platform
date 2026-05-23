import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('olp_session')?.value;
    
    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) {
      throw new Error('BACKEND_URL is not configured');
    }

    const res = await fetch(`${backendUrl}/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      // Token might be expired or invalid
      const response = NextResponse.json({ user: null }, { status: 401 });
      response.cookies.delete('olp_session');
      return response;
    }

    const data = await res.json();
    return NextResponse.json({ user: data });

  } catch (error) {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
