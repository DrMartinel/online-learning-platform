import { NextResponse, NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('olp_session')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) {
      throw new Error('BACKEND_URL is not configured');
    }

    // Fetch all courses
    const coursesRes = await fetch(`${backendUrl}/courses`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (!coursesRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch courses' }, { status: coursesRes.status });
    }

    const allCourses = await coursesRes.json();

    // Fetch progress for each course
    const enrolledCourses = [];
    for (const course of allCourses) {
      const progressRes = await fetch(`${backendUrl}/user-progress/course/${course.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });

      if (progressRes.ok) {
        const progress = await progressRes.json();
        if (progress && progress.totalLessons > 0) {
          enrolledCourses.push({
            id: course.id,
            title: course.title,
            description: course.description,
            thumbnailUrl: course.thumbnailUrl,
            instructorId: course.instructorId,
            completedLessons: progress.completedLessons,
            totalLessons: progress.totalLessons,
            percentage: progress.progressPercentage,
            lastActivityAt: null, // Hard to compute without specific lesson updates
          });
        }
      }
    }

    return NextResponse.json(enrolledCourses);

  } catch (error) {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
