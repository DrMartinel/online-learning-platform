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

    // 1. Gọi API Backend mới để lấy danh sách khóa học CHÍNH XÁC
    const coursesRes = await fetch(`${backendUrl}/courses/enrolled/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (!coursesRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch enrolled courses' }, { status: coursesRes.status });
    }

    const enrolledCoursesRaw = await coursesRes.json();
    const enrolledCourses = [];

    // 2. Fetch tiến độ (progress) cho những khóa học này
    for (const course of enrolledCoursesRaw) {
      let completedLessons = 0;
      let totalLessons = 0;
      let percentage = 0;

      const progressRes = await fetch(`${backendUrl}/user-progress/course/${course.id}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      });

      if (progressRes.ok) {
        const progress = await progressRes.json();
        if (progress) {
          completedLessons = progress.completedLessons || 0;
          totalLessons = progress.totalLessons || 0;
          percentage = progress.progressPercentage || 0;
        }
      }

      // Đẩy khóa học vào danh sách TRẢ VỀ DÙ CHƯA HỌC BÀI NÀO (Tiến độ = 0)
      enrolledCourses.push({
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnailUrl: course.thumbnailUrl,
        instructorId: course.instructorId,
        completedLessons,
        totalLessons,
        percentage,
        lastActivityAt: null,
      });
    }

    return NextResponse.json(enrolledCourses);

  } catch (error) {
    console.error("Lỗi API my-courses:", error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}