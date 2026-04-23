import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: courseId } = await params;
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    return NextResponse.json({ error: 'Missing BACKEND_URL' }, { status: 500 });
  }

  // Require authenticated user — read session from Supabase cookies
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const bearerToken = session.access_token;

  try {
    // Fetch the lessons for this course to get the first one
    const lessonsRes = await fetch(`${backendUrl}/courses/${courseId}/lessons`, {
      headers: { authorization: `Bearer ${bearerToken}` },
      cache: 'no-store',
    });

    if (!lessonsRes.ok) {
      const err = await lessonsRes.json().catch(() => ({}));
      return NextResponse.json(err, { status: lessonsRes.status });
    }

    const lessons: Array<{ id: string; orderIndex: number }> = await lessonsRes.json();

    if (!lessons || lessons.length === 0) {
      return NextResponse.json(
        { error: 'This course has no lessons yet.' },
        { status: 422 }
      );
    }

    // Sort by orderIndex and take the first lesson
    const firstLesson = lessons.sort((a, b) => a.orderIndex - b.orderIndex)[0];

    // Create a UserProgress record for the first lesson (upsert semantics on the backend)
    const progressRes = await fetch(`${backendUrl}/user-progress`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${bearerToken}`,
      },
      body: JSON.stringify({ lessonId: firstLesson.id, completed: false }),
    });

    const progressData = await progressRes.json().catch(() => ({}));
    return NextResponse.json(progressData, { status: progressRes.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 502 }
    );
  }
}
