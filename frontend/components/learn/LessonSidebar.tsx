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

interface Chapter {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
}

interface LessonSidebarProps {
  courseId: string;
  activeLessonId: string;
  chapters: Chapter[];
  lessons: Lesson[];
  /** IDs of lessons the user has already completed */
  completedLessonIds: Set<string>;
  isOpen: boolean;
  onClose: () => void;
}

export default function LessonSidebar({
  courseId,
  activeLessonId,
  chapters,
  lessons,
  completedLessonIds,
  isOpen,
  onClose,
}: LessonSidebarProps) {
  const sorted = [...lessons].sort((a, b) => a.orderIndex - b.orderIndex);
  const sortedChapters = [...chapters].sort((a, b) => a.order_index - b.order_index);

  // Initialize expanded chapters state (active lesson's chapter is expanded by default)
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>(() => {
    const activeLesson = lessons.find((l) => l.id === activeLessonId);
    const activeChId = activeLesson?.chapterId;
    if (activeChId) {
      return { [activeChId]: true };
    }
    return sortedChapters[0] ? { [sortedChapters[0].id]: true } : {};
  });

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

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
            className="lg:hidden p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-205"
          >
            <X size={18} />
          </button>
        </div>

        {/* Chapters and nested lessons */}
        <div className="flex-1 overflow-y-auto pb-4 divide-y divide-gray-100 dark:divide-gray-800/60">
          {sortedChapters.length === 0 ? (
            <div className="p-5 text-center text-xs text-gray-400 italic">
              Chưa có chương học nào.
            </div>
          ) : (
            sortedChapters.map((chapter, chIdx) => {
              const chLessons = sorted.filter((l) => l.chapterId === chapter.id);
              const isExpanded = !!expandedChapters[chapter.id];

              return (
                <div key={chapter.id} className="w-full">
                  <button
                    onClick={() => toggleChapter(chapter.id)}
                    className="w-full flex items-center gap-2 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left bg-gray-50/20 dark:bg-gray-900/10"
                  >
                    <ChevronDown
                      size={15}
                      className={`text-gray-400 shrink-0 transition-transform duration-200 ${isExpanded ? "" : "-rotate-90"
                        }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-primary/80 uppercase tracking-wider mb-0.5">
                        Chương {chIdx + 1}
                      </p>
                      <p className="text-sm font-bold text-gray-850 dark:text-gray-200 truncate leading-snug">
                        {chapter.title}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 font-medium">
                        {chLessons.length} bài học
                      </p>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="pb-1 bg-white dark:bg-gray-900/40">
                      {chLessons.length === 0 ? (
                        <p className="text-xs text-gray-400 dark:text-gray-500 italic pl-10 pr-4 py-3">
                          Chưa có bài học nào trong chương này.
                        </p>
                      ) : (
                        chLessons.map((lesson) => {
                          const isActive = lesson.id === activeLessonId;
                          const isDone = completedLessonIds.has(lesson.id);
                          const Icon = lesson.videoUrl ? PlayCircle : FileText;

                          return (
                            <Link
                              key={lesson.id}
                              href={`/learn/${courseId}/${lesson.id}`}
                              onClick={onClose}
                              className={`flex items-center gap-2.5 pl-10 pr-4 py-3 transition-colors border-b border-gray-50 dark:border-gray-850/20 last:border-b-0 ${isActive
                                ? "bg-primary/5 dark:bg-primary/10 border-r-2 border-primary"
                                : "hover:bg-gray-50 dark:hover:bg-gray-800/30"
                                }`}
                            >
                              {isDone ? (
                                <CheckCircle2
                                  size={15}
                                  className="text-emerald-500 shrink-0"
                                />
                              ) : (
                                <Circle
                                  size={15}
                                  className="text-gray-300 dark:text-gray-750 shrink-0"
                                />
                              )}

                              <Icon
                                size={14}
                                className={`shrink-0 ${lesson.videoUrl
                                  ? "text-blue-500"
                                  : "text-emerald-500"
                                  }`}
                              />

                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-sm leading-snug truncate ${isActive
                                    ? "text-primary font-semibold"
                                    : "text-gray-700 dark:text-gray-300"
                                    }`}
                                >
                                  {lesson.title}
                                </p>
                                {lesson.content && (
                                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">
                                    {lesson.content}
                                  </p>
                                )}
                              </div>
                            </Link>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside >
    </>
  );
}
