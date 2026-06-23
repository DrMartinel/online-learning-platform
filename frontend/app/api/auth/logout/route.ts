import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL;
    if (backendUrl) {
      await fetch(`${backendUrl}/auth/signout`, {
        method: 'POST',
      }).catch(e => console.error('Failed to call backend signout:', e));
    }

    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('olp_session');
    return response;
  } catch (error) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('olp_session');
    return response;
  }
}

export async function POST() {
  try {
    const backendUrl = process.env.BACKEND_URL;
    if (backendUrl) {
      // Optional: Call the backend to invalidate the token if your backend supports it
      await fetch(`${backendUrl}/auth/signout`, {
        method: 'POST',
      }).catch(e => console.error('Failed to call backend signout:', e));
    }

    const response = NextResponse.json({ success: true });

    response.cookies.delete('olp_session');

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
