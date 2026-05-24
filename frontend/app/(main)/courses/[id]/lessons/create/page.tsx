import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import CreateLessonForm from '@/components/courses/CreateLessonForm';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CreateLessonPage({ params }: PageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('olp_session')?.value;

  if (!token) {
    redirect(`/login?next=/courses/${id}/lessons/create`);
  }

  // Optional: Fetch course details to verify ownership and display title
  const backendUrl = process.env.BACKEND_URL;
  let course = null;
  if (backendUrl) {
    try {
      const res = await fetch(`${backendUrl}/courses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      if (res.ok) {
        course = await res.json();
      }
    } catch (e) {
      console.error("Failed to fetch course details for lesson creation");
    }
  }

  if (!course) {
    notFound();
  }

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-950">
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href={`/courses/${id}`} className="flex items-center gap-1 hover:text-primary transition-colors">
            <ChevronLeft size={16} />
            Quay lại khóa học
          </Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white font-medium truncate max-w-xs">
            Thêm bài học mới
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Bài học mới cho "{course.title}"</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Tải lên video bài giảng và thêm nội dung văn bản.
            </p>
          </div>
          <div className="p-6">
            <CreateLessonForm courseId={id} token={token} />
          </div>
        </div>
      </div>
    </div>
  );
}
