import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, created_at, avatar_url')
    .eq('id', user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    id: data.id,
    fullName: data.full_name,
    role: data.role,
    createdAt: data.created_at,
    avatarUrl: data.avatar_url,
    email: user.email,
  });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { fullName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (typeof body.fullName !== 'string' || body.fullName.trim().length === 0) {
    return NextResponse.json({ error: 'fullName is required' }, { status: 400 });
  }

  const trimmedName = body.fullName.trim();

  const { data, error } = await supabase
    .from('profiles')
    .update({ full_name: trimmedName, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select('id, full_name, role, created_at, avatar_url')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Sync name to Supabase Auth user_metadata so header initials update
  await supabase.auth.updateUser({ data: { full_name: trimmedName } });

  return NextResponse.json({
    id: data.id,
    fullName: data.full_name,
    role: data.role,
    createdAt: data.created_at,
    avatarUrl: data.avatar_url,
    email: user.email,
  });
}
