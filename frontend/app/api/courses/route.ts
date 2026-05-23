import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    return NextResponse.json({ error: 'Missing BACKEND_URL' }, { status: 500 });
  }

  // Forward query params (published, instructorId) if present
  const { searchParams } = request.nextUrl;
  const upstream = new URL(`${backendUrl}/courses`);
  searchParams.forEach((value, key) => upstream.searchParams.set(key, value));

  // Forward the Supabase session token from cookies so the backend can
  // resolve optional auth context (e.g., showing unpublished own courses).
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const cookieHeader = allCookies.map((c) => `${c.name}=${c.value}`).join('; ');

  // Extract JWT from Supabase Server session
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers: Record<string, string> = {
    ...(cookieHeader ? { cookie: cookieHeader } : {}),
  };
  
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  } else if (request.headers.get('authorization')) {
    headers['Authorization'] = request.headers.get('authorization')!;
  }

  try {
    const res = await fetch(upstream.toString(), {
      headers,
      // Don't cache by default so fresh data is always served
      cache: 'no-store',
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 502 }
    );
  }
}
