import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const token = request.cookies.get('olp_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) throw new Error('Missing BACKEND_URL');

    // To simulate enrollment, we get the course's lessons and create progress for the first one
    const lessonsRes = await fetch(`${backendUrl}/courses/${id}/lessons`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!lessonsRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch course lessons for enrollment' }, { status: lessonsRes.status });
    }
    
    const lessons = await lessonsRes.json();
    if (!lessons || lessons.length === 0) {
      return NextResponse.json({ error: 'Course has no lessons to enroll in' }, { status: 400 });
    }

    // Create progress for the first lesson to mark as enrolled
    const sortedLessons = lessons.sort((a: any, b: any) => a.orderIndex - b.orderIndex);
    const firstLesson = sortedLessons[0];

    const res = await fetch(`${backendUrl}/user-progress`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        courseId: id,
        lessonId: firstLesson.id
      })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json({ error: errorData.message || 'Failed to enroll in course' }, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}
