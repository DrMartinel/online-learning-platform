import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import CreateCourseForm from '@/components/courses/CreateCourseForm';

export default async function CreateCoursePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('olp_session')?.value;

  // We should strictly require login for this route
  if (!token) {
    redirect('/login?next=/courses/create');
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 lg:py-14">
      <div className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Tạo khóa học mới</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Cung cấp các thông tin cơ bản về khóa học. Bạn có thể thêm bài học sau khi tạo.
          </p>
        </div>
        <div className="p-6">
          <CreateCourseForm token={token} />
        </div>
      </div>
    </div>
  );
}
