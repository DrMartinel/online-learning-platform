import { cookies } from 'next/headers';
import { BookOpen, CheckCircle, XCircle } from 'lucide-react';
import CourseActionMenu from '@/components/admin/CourseActionMenu';

interface Course {
  id: string;
  title: string;
  instructorId: string;
  isPublished: boolean;
  createdAt: string;
}

async function getCourses(): Promise<Course[]> {
  try {
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) return [];

    const cookieStore = await cookies();
    const token = cookieStore.get('olp_session')?.value;

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${backendUrl}/admin/courses`, {
      headers,
      cache: "no-store",
    });

    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function AdminCoursesPage() {
  const courses = await getCourses();

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Course Management</h2>
        <p className="text-gray-500 dark:text-gray-400">Manage all courses on the platform.</p>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400">
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Instructor ID</th>
                <th className="px-6 py-4">Created Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                        <BookOpen size={20} className="text-primary" />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{course.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">{course.instructorId.split('-')[0]}...</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{new Date(course.createdAt).toLocaleDateString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    {course.isPublished ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <CheckCircle size={12} /> Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500">
                        <XCircle size={12} /> Draft
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <CourseActionMenu courseId={course.id} isPublished={course.isPublished} />
                  </td>
                </tr>
              ))}
              {courses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No courses found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
