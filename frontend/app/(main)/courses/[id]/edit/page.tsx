import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import CourseEditorWorkspace from '@/components/courses/CourseEditorWorkspace';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCoursePage({ params }: PageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('olp_session')?.value;

  if (!token) {
    redirect(`/login?next=/courses/${id}/edit`);
  }

  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    throw new Error('Backend URL not configured');
  }

  // Fetch course details on the server side
  let course = null;
  try {
    const courseRes = await fetch(`${backendUrl}/courses/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });
    if (courseRes.ok) {
      course = await courseRes.json();
    }
  } catch (e) {
    console.error("Failed to fetch details for course editing page", e);
  }

  if (!course) {
    notFound();
  }

  // Verify ownership: check if user is the instructor or admin
  let isAuthorized = false;
  let isAdmin = false;
  try {
    const userRes = await fetch(`${backendUrl}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });
    if (userRes.ok) {
      const user = await userRes.json();
      const isInstructor = user.id === course.instructorId;
      isAdmin = user.role === 'admin';
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
      {/* Breadcrumbs */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href={`/courses/${id}`} className="flex items-center gap-1 hover:text-primary transition-colors font-medium">
            <ChevronLeft size={16} />
            Quay lại trang học tập
          </Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white font-semibold truncate max-w-xs">
            Quản trị & Cài đặt khóa học
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <CourseEditorWorkspace 
          course={course} 
          token={token} 
          isAdmin={isAdmin} 
        />
      </div>
    </div>
  );
}
