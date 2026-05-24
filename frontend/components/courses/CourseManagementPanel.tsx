'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Eye, 
  EyeOff, 
  Pencil, 
  Trash2, 
  Plus, 
  AlertTriangle, 
  Loader2, 
  CheckCircle,
  Settings,
  Layers,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

interface CourseManagementPanelProps {
  course: {
    id: string;
    title: string;
    isPublished: boolean;
  };
  isAdmin?: boolean;
}

export default function CourseManagementPanel({ course, isAdmin = false }: CourseManagementPanelProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [error, setError] = useState('');

  const togglePublish = async () => {
    setIsPending(true);
    setError('');
    try {
      const url = isAdmin ? `/api/admin/courses/${course.id}` : `/api/courses/${course.id}`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !course.isPublished }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Không thể cập nhật trạng thái khóa học');
      }

      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi.');
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async () => {
    if (confirmTitle !== course.title) {
      setError('Tên khóa học xác nhận không trùng khớp.');
      return;
    }

    setIsDeleting(true);
    setError('');
    try {
      const url = isAdmin ? `/api/admin/courses/${course.id}` : `/api/courses/${course.id}`;
      const res = await fetch(url, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Không thể xóa khóa học');
      }

      setShowDeleteModal(false);
      router.push('/courses');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi xóa khóa học.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative mb-8 overflow-hidden rounded-3xl border border-gray-200/80 dark:border-gray-800/80 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-xl dark:shadow-2xl">
      {/* Visual background accents */}
      <div className="absolute -right-20 -top-20 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Status Indicators */}
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${
              course.isPublished 
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400' 
                : 'bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 text-amber-600 dark:text-amber-400'
            }`}>
              {course.isPublished ? <Eye className="w-6 h-6" /> : <EyeOff className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                  Quản lý khóa học {isAdmin && <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900">Admin</span>}
                </h3>
                <span className="flex h-2.5 w-2.5 relative">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${course.isPublished ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${course.isPublished ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Trạng thái: <strong className={course.isPublished ? 'text-emerald-650 dark:text-emerald-400' : 'text-amber-650 dark:text-amber-400'}>
                  {course.isPublished ? 'Đã xuất bản' : 'Bản nháp (Chỉ bạn và quản trị viên nhìn thấy)'}
                </strong>
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Publish Toggle Button */}
            <button
              onClick={togglePublish}
              disabled={isPending}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold text-sm transition-all duration-300 transform active:scale-95 shadow-sm border ${
                course.isPublished
                  ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-250 dark:border-amber-900/50 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                  : 'bg-emerald-600 text-white border-transparent hover:bg-emerald-700 hover:shadow-emerald-500/10'
              } disabled:opacity-75 disabled:cursor-not-allowed`}
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : course.isPublished ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              {course.isPublished ? 'Hủy xuất bản' : 'Xuất bản'}
            </button>

            {/* Edit Button */}
            <Link
              href={`/courses/${course.id}/edit`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 font-semibold text-sm transition-all shadow-sm transform active:scale-95"
            >
              <Pencil className="w-4 h-4" />
              Chỉnh sửa
            </Link>

            {/* Add Lesson */}
            <Link
              href={`/courses/${course.id}/lessons/create`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-white hover:bg-primary-dark font-semibold text-sm transition-all shadow-md hover:shadow-primary/20 transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Thêm bài học
            </Link>

            {/* Delete Button */}
            <button
              onClick={() => {
                setError('');
                setConfirmTitle('');
                setShowDeleteModal(true);
              }}
              className="inline-flex items-center justify-center p-2.5 rounded-2xl text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 hover:bg-red-100 dark:hover:bg-red-950/40 transition-all transform active:scale-95"
              title="Xóa khóa học"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && !showDeleteModal && (
          <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-650 dark:text-red-400 text-sm font-medium animate-in fade-in slide-in-from-top-1 duration-200">
            {error}
          </div>
        )}
      </div>

      {/* Stunning Destructive Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md p-6 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
              <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold">Xác nhận xóa khóa học</h4>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
              Hành động này <strong className="text-red-600 dark:text-red-400">không thể hoàn tác</strong>. Toàn bộ thông tin khóa học, danh sách bài học và tiến trình của học viên sẽ bị xóa vĩnh viễn khỏi hệ thống.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Để xác nhận, vui lòng nhập chính xác tên khóa học bên dưới:
              </label>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-800 text-xs font-mono text-gray-600 dark:text-gray-450 select-all mb-2 truncate">
                {course.title}
              </div>
              <input
                type="text"
                value={confirmTitle}
                onChange={(e) => setConfirmTitle(e.target.value)}
                placeholder="Nhập lại tên khóa học để xác nhận..."
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
              />
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-650 dark:text-red-400 text-xs font-semibold">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl border border-gray-350 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold text-sm transition-all"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || confirmTitle !== course.title}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-750 text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-red-600/10"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Xác nhận xóa
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
