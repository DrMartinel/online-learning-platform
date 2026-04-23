import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/lessons/[id]/complete
 *
 * Marks a lesson as completed for the authenticated user.
 * Flow:
 *   1. Upsert a UserProgress record for this lesson (POST /user-progress).
 *   2. Update the record to completed=true (PATCH /user-progress/:progressId).
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: lessonId } = await params;
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    return NextResponse.json({ error: 'Missing BACKEND_URL' }, { status: 500 });
  }

  // Require authenticated user
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const bearer = `Bearer ${session.access_token}`;

  try {
    // Step 1: Upsert the progress record (creates if not exists, idempotent)
    const upsertRes = await fetch(`${backendUrl}/user-progress`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: bearer,
      },
      body: JSON.stringify({ lessonId, completed: false }),
    });

    if (!upsertRes.ok && upsertRes.status !== 409) {
      const err = await upsertRes.json().catch(() => ({}));
      return NextResponse.json(err, { status: upsertRes.status });
    }

    const progressRecord = await upsertRes.json().catch(() => null);
    const progressId = progressRecord?.id;

    if (!progressId) {
      return NextResponse.json(
        { error: 'Could not retrieve progress record ID.' },
        { status: 500 }
      );
    }

    // Step 2: Mark as completed
    const updateRes = await fetch(`${backendUrl}/user-progress/${progressId}`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        authorization: bearer,
      },
      body: JSON.stringify({ completed: true }),
    });

    const updatedData = await updateRes.json().catch(() => ({}));
    return NextResponse.json(updatedData, { status: updateRes.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 502 }
    );
  }
}
