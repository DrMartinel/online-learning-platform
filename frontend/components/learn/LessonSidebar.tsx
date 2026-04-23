"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  PlayCircle,
  FileText,
  CheckCircle2,
  Circle,
  X,
} from "lucide-react";
import type { Lesson } from "@/components/courses/LessonList";

interface LessonSidebarProps {
  courseId: string;
  activeLessonId: string;
  lessons: Lesson[];
  /** IDs of lessons the user has already completed */
  completedLessonIds: Set<string>;
  isOpen: boolean;
  onClose: () => void;
}

export default function LessonSidebar({
  courseId,
  activeLessonId,
  lessons,
  completedLessonIds,
  isOpen,
  onClose,
}: LessonSidebarProps) {
  const sorted = [...lessons].sort((a, b) => a.orderIndex - b.orderIndex);

  // Group into a single "module" since the backend currently has a flat lesson list
  const [expanded, setExpanded] = useState(true);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/30 z-10 lg:hidden top-14"
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-20 w-72 bg-white dark:bg-gray-900
          border-r border-gray-200 dark:border-gray-800
          transform transition-transform duration-200 ease-in-out flex flex-col
          ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 top-14 overflow-y-auto
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Nội dung khóa học
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {completedLessonIds.size}/{sorted.length} hoàn thành
            </p>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Accordion — single module */}
        <div className="flex-1 overflow-y-auto pb-4">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
          >
            <ChevronDown
              size={16}
              className={`text-gray-400 shrink-0 transition-transform duration-200 ${
                expanded ? "" : "-rotate-90"
              }`}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                Danh sách bài học
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {sorted.length} bài
              </p>
            </div>
          </button>

          {expanded && (
            <div className="pb-1">
              {sorted.map((lesson) => {
                const isActive = lesson.id === activeLessonId;
                const isDone = completedLessonIds.has(lesson.id);
                const Icon = lesson.videoUrl ? PlayCircle : FileText;

                return (
                  <Link
                    key={lesson.id}
                    href={`/learn/${courseId}/${lesson.id}`}
                    onClick={onClose}
                    className={`flex items-center gap-2.5 pl-10 pr-4 py-2.5 transition-colors ${
                      isActive
                        ? "bg-primary/5 dark:bg-primary/10 border-r-2 border-primary"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2
                        size={16}
                        className="text-emerald-500 shrink-0"
                      />
                    ) : (
                      <Circle
                        size={16}
                        className="text-gray-300 dark:text-gray-600 shrink-0"
                      />
                    )}

                    <Icon
                      size={15}
                      className={`shrink-0 ${
                        lesson.videoUrl
                          ? "text-blue-500"
                          : "text-emerald-500"
                      }`}
                    />

                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm truncate ${
                          isActive
                            ? "text-primary font-medium"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {lesson.title}
                      </p>
                      <p className="text-xs text-gray-400">
                        {lesson.videoUrl ? "Video" : "Tài liệu"}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
