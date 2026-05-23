"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MoreVertical, Trash2, EyeOff, Eye, Loader2 } from 'lucide-react';

interface Props {
  courseId: string;
  isPublished: boolean;
}

export default function CourseActionMenu({ courseId, isPublished }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const toggleStatus = () => {
    setIsOpen(false);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/courses/${courseId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPublished: !isPublished }),
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to update course status');
        }
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'An error occurred');
      }
    });
  };

  const deleteCourse = () => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;
    setIsOpen(false);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/courses/${courseId}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to delete course');
        }
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'An error occurred');
      }
    });
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {isPending ? <Loader2 size={16} className="animate-spin text-gray-500" /> : <MoreVertical size={16} className="text-gray-500" />}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
            <button 
              onClick={toggleStatus}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
            >
              {isPublished ? (
                <><EyeOff size={14} /> Unpublish Course</>
              ) : (
                <><Eye size={14} /> Publish Course</>
              )}
            </button>
            <div className="h-px bg-gray-200 dark:bg-gray-800 my-1" />
            <button 
              onClick={deleteCourse}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
            >
              <Trash2 size={14} /> Delete Course
            </button>
          </div>
        </>
      )}
    </div>
  );
}
