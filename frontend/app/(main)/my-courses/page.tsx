import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import MyCourseCard from '@/components/user/MyCourseCard';
import type { EnrolledCourse } from '@/components/user/MyCourseCard';
import { BookOpen, Search } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Khóa học của tôi – EduSpace',
  description: 'Xem tất cả khóa học bạn đã đăng ký.',
};

async function fetchMyCourses(): Promise<EnrolledCourse[]> {
  const supabase = await createClient();
  const { data: progressRows, error } = await supabase
    .from('user_progress')
    .select(`
      id,
      completed,
      completed_at,
      lessons!inner (
        id,
        order_index,
        course_id,
        courses!inner (
          id,
          title,
          description,
          thumbnail_url,
          instructor_id
        )
      )
    `);

  if (error || !progressRows) return [];

  const courseMap = new Map<string, {
    course: Record<string, unknown>;
    totalLessons: number;
    completedLessons: number;
    lastActivityAt: string | null;
    firstIncompleteLessonId: string | null;
    firstIncompleteOrderIndex: number;
  }>();

  for (const row of progressRows) {
    const lesson = row.lessons as unknown as {
      id: string;
      order_index: number;
      course_id: string;
      courses: Record<string, unknown>;
    };
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
        firstIncompleteLessonId: null,
        firstIncompleteOrderIndex: Infinity,
      });
    }
    const entry = courseMap.get(courseId)!;
    entry.totalLessons += 1;
    if (row.completed) {
      entry.completedLessons += 1;
    } else {
      if (lesson.order_index < entry.firstIncompleteOrderIndex) {
        entry.firstIncompleteLessonId = lesson.id;
        entry.firstIncompleteOrderIndex = lesson.order_index;
      }
    }
    if (row.completed_at && (!entry.lastActivityAt || (row.completed_at as string) > entry.lastActivityAt)) {
      entry.lastActivityAt = row.completed_at as string;
    }
  }

  return Array.from(courseMap.values()).map(({ course, totalLessons, completedLessons, lastActivityAt, firstIncompleteLessonId }) => ({
    id: course.id as string,
    title: course.title as string,
    description: (course.description as string) ?? null,
    thumbnailUrl: (course.thumbnail_url as string) ?? null,
    instructorId: course.instructor_id as string,
    completedLessons,
    totalLessons,
    percentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
    lastActivityAt,
    firstIncompleteLessonId,
  }));
}

export default async function MyCoursesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/my-courses');
  }

  const courses = await fetchMyCourses();

  const inProgress = courses.filter(c => c.percentage > 0 && c.percentage < 100);
  const completed = courses.filter(c => c.percentage === 100);
  const notStarted = courses.filter(c => c.percentage === 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <nav className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 mb-6">
          <Link href="/" className="hover:text-[var(--color-primary)] transition-colors">Trang chủ</Link>
          <span>/</span>
          <span className="text-gray-700 dark:text-gray-300">Khóa học của tôi</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Khóa học của tôi
            </h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400 text-sm">
              {courses.length === 0
                ? 'Bạn chưa đăng ký khóa học nào.'
                : `${courses.length} khóa học đã đăng ký`}
            </p>
          </div>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-dark)] transition-colors shrink-0"
          >
            <Search className="w-4 h-4" />
            Khám phá khóa học
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mb-5">
              <BookOpen className="w-9 h-9 text-[var(--color-primary)]" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Chưa có khóa học nào
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-sm">
              Khám phá kho khóa học và bắt đầu học ngay hôm nay.
            </p>
            <Link
              href="/courses"
              className="px-6 py-3 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary-dark)] transition-colors"
            >
              Khám phá khóa học
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Đang học', value: inProgress.length, color: 'text-blue-600 dark:text-blue-400' },
                { label: 'Hoàn thành', value: completed.length, color: 'text-green-600 dark:text-green-400' },
                { label: 'Chưa bắt đầu', value: notStarted.length, color: 'text-gray-500 dark:text-gray-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 text-center">
                  <p className={`text-3xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
                </div>
              ))}
            </div>

            {inProgress.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] inline-block" />
                  Đang học
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {inProgress.map(course => <MyCourseCard key={course.id} course={course} />)}
                </div>
              </section>
            )}

            {notStarted.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
                  Chưa bắt đầu
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {notStarted.map(course => <MyCourseCard key={course.id} course={course} />)}
                </div>
              </section>
            )}

            {completed.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                  Đã hoàn thành
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {completed.map(course => <MyCourseCard key={course.id} course={course} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
