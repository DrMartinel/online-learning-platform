import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import EditLessonForm from '@/components/courses/EditLessonForm';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string; lessonId: string }>;
}

export default async function EditLessonPage({ params }: PageProps) {
  const { id, lessonId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('olp_session')?.value;

  if (!token) {
    redirect(`/login?next=/courses/${id}/lessons/${lessonId}/edit`);
  }

  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    throw new Error('Backend URL not configured');
  }

  // Fetch course and lesson in parallel
  let course = null;
  let lesson = null;
  try {
    const [courseRes, lessonRes] = await Promise.all([
      fetch(`${backendUrl}/courses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      }),
      fetch(`${backendUrl}/lessons/${lessonId}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      }),
    ]);

    if (courseRes.ok) course = await courseRes.json();
    if (lessonRes.ok) lesson = await lessonRes.json();
  } catch (e) {
    console.error("Failed to fetch course/lesson details for editing");
  }

  if (!course || !lesson) {
    notFound();
  }

  // Verify ownership
  let isAuthorized = false;
  try {
    const userRes = await fetch(`${backendUrl}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });
    if (userRes.ok) {
      const user = await userRes.json();
      const isInstructor = user.id === course.instructorId;
      const isAdmin = user.permissions?.includes('action:admin:lesson:update');
      isAuthorized = isInstructor || isAdmin;
    }
  } catch (e) {
    console.error("Failed to verify user permissions");
  }

  if (!isAuthorized) {
    redirect(`/courses/${id}`);
  }

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-950">
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href={`/courses/${id}/edit`} className="flex items-center gap-1 hover:text-primary transition-colors">
            <ChevronLeft size={16} />
            Quay lại trang quản lý
          </Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white font-medium truncate max-w-xs">
            Chỉnh sửa bài học
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Chỉnh sửa: {lesson.title}</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Khóa học: <span className="font-medium text-gray-700 dark:text-gray-300">{course.title}</span>
            </p>
          </div>
          <div className="p-6">
            <EditLessonForm lesson={lesson} token={token} />
          </div>
        </div>
      </div>
    </div>
  );
}
