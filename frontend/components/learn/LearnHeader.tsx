"use client";

import Link from "next/link";
import { Menu, X, PlayCircle, ArrowLeft } from "lucide-react";

interface LearnHeaderProps {
  courseId: string;
  courseTitle: string;
  progressPct: number;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function LearnHeader({
  courseId,
  courseTitle,
  progressPct,
  sidebarOpen,
  onToggleSidebar,
}: LearnHeaderProps) {
  return (
    <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 gap-3 shrink-0 z-30">
      {/* Mobile sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 shrink-0">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <PlayCircle size={16} className="text-white" />
        </div>
        <span className="font-bold text-gray-800 dark:text-white hidden sm:inline text-sm">
          EduSpace
        </span>
      </Link>

      <div className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-gray-700" />

      {/* Course title */}
      <h1 className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate hidden sm:block max-w-[280px]">
        {courseTitle}
      </h1>

      <div className="flex-1" />

      {/* Progress */}
      {progressPct > 0 && (
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {progressPct}%
          </span>
          <div className="w-28 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Back to course */}
      <Link
        href={`/courses/${courseId}`}
        className="hidden sm:flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors shrink-0"
      >
        <ArrowLeft size={16} />
        <span className="hidden md:inline">Khóa học</span>
      </Link>
    </header>
  );
}
