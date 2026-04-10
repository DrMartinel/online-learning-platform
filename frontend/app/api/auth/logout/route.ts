import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) {
      return NextResponse.json({ error: 'Missing BACKEND_URL' }, { status: 500 });
    }

    // Authorization is optional here; backend will sign out only if a valid session is present.
    const res = await fetch(`${backendUrl}/auth/logout`, { method: 'POST' });
    const data = await res.json().catch(() => ({}));

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 400 }
    );
  }
}
