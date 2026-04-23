import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Return session tokens so the browser client can call setSession()
    // and trigger onAuthStateChange(SIGNED_IN) — needed when using SUPABASE_INTERNAL_URL
    return NextResponse.json({
      user: data.user,
      session: data.session
        ? { access_token: data.session.access_token, refresh_token: data.session.refresh_token }
        : null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
