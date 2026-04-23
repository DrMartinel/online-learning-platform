import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface EnrolledCourse {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  instructorId: string;
  completedLessons: number;
  totalLessons: number;
  percentage: number;
  lastActivityAt: string | null;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get all user_progress records with lesson → course data
  const { data: progressRows, error: progressError } = await supabase
    .from('user_progress')
    .select(`
      id,
      completed,
      completed_at,
      lessons!inner (
        id,
        course_id,
        courses!inner (
          id,
          title,
          description,
          thumbnail_url,
          instructor_id,
          is_published
        )
      )
    `)
    .eq('user_id', user.id);

  if (progressError) {
    return NextResponse.json({ error: progressError.message }, { status: 500 });
  }

  if (!progressRows || progressRows.length === 0) {
    return NextResponse.json([]);
  }

  // Aggregate by course
  const courseMap = new Map<string, {
    course: Record<string, unknown>;
    totalLessons: number;
    completedLessons: number;
    lastActivityAt: string | null;
  }>();

  for (const row of progressRows) {
    const lesson = row.lessons as unknown as { id: string; course_id: string; courses: Record<string, unknown> };
    if (!lesson) continue;
    const course = lesson.courses;
    if (!course) continue;
    const courseId = course.id as string;

    if (!courseMap.has(courseId)) {
      courseMap.set(courseId, {
        course,
        totalLessons: 0,
        completedLessons: 0,
        lastActivityAt: null,
      });
    }

    const entry = courseMap.get(courseId)!;
    entry.totalLessons += 1;
    if (row.completed) {
      entry.completedLessons += 1;
    }
    if (row.completed_at) {
      if (!entry.lastActivityAt || row.completed_at > entry.lastActivityAt) {
        entry.lastActivityAt = row.completed_at as string;
      }
    }
  }

  const courses: EnrolledCourse[] = Array.from(courseMap.values()).map(
    ({ course, totalLessons, completedLessons, lastActivityAt }) => ({
      id: course.id as string,
      title: course.title as string,
      description: (course.description as string) ?? null,
      thumbnailUrl: (course.thumbnail_url as string) ?? null,
      instructorId: course.instructor_id as string,
      completedLessons,
      totalLessons,
      percentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
      lastActivityAt,
    })
  );

  return NextResponse.json(courses);
}
