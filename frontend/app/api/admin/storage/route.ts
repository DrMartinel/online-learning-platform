import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

// GET: List files in folder
export async function GET(request: NextRequest) {
  const token = request.cookies.get('olp_session')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || '';

  try {
    const supabase = getSupabaseClient(token);
    // Explicitly load session into Supabase client to authenticate Storage RLS checks
    await supabase.auth.setSession({ access_token: token, refresh_token: '' });

    const { data, error } = await supabase.storage.from('course-media').list(path, {
      sortBy: { column: 'name', order: 'asc' }
    });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err: any) {
    console.error('Failed to list files:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Upload file to folder
export async function POST(request: NextRequest) {
  const token = request.cookies.get('olp_session')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string;

    if (!file || !path) {
      return NextResponse.json({ error: 'Missing file or path' }, { status: 400 });
    }

    const supabase = getSupabaseClient(token);
    // Explicitly load session into Supabase client to authenticate Storage RLS checks
    await supabase.auth.setSession({ access_token: token, refresh_token: '' });

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('course-media')
      .upload(path, file, {
        upsert: true
      });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Failed to upload file via proxy:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Remove file
export async function DELETE(request: NextRequest) {
  const token = request.cookies.get('olp_session')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');

  if (!path) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseClient(token);
    // Explicitly load session into Supabase client to authenticate Storage RLS checks
    await supabase.auth.setSession({ access_token: token, refresh_token: '' });

    const { data, error } = await supabase.storage.from('course-media').remove([path]);

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Failed to delete file:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
