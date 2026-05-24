'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';

interface DeleteLessonButtonProps {
  lessonId: string;
  lessonTitle: string;
}

export default function DeleteLessonButton({ lessonId, lessonTitle }: DeleteLessonButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/lessons/${lessonId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete lesson');
      }
      setShowConfirm(false);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Có lỗi xảy ra khi xóa bài học.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 px-2.5 py-1 rounded-lg text-xs animate-in fade-in slide-in-from-right-1 duration-200 shadow-sm shrink-0">
        <span className="text-red-700 dark:text-red-400 font-medium">Xóa bài?</span>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-red-700 dark:text-red-400 font-bold hover:underline disabled:opacity-50 flex items-center gap-1"
        >
          {isDeleting && <Loader2 size={10} className="animate-spin" />}
          Xóa
        </button>
        <span className="text-gray-300 dark:text-gray-700">|</span>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
          className="text-gray-500 hover:text-gray-750 dark:text-gray-400 dark:hover:text-gray-200 font-medium"
        >
          Hủy
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="shrink-0 p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all opacity-0 group-hover:opacity-100"
      title="Xóa bài học"
    >
      <Trash2 size={14} />
    </button>
  );
}
