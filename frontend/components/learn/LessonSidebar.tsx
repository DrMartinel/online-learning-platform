"use client";

import { useState, useEffect } from "react";
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
  title: string;
  orderIndex: number;
}

interface LessonSidebarProps {
  courseId: string;
  activeLessonId: string;
  lessons: Lesson[];
  chapters: Chapter[];
  /** IDs of lessons the user has already completed */
  completedLessonIds: Set<string>;
  isMobileOpen: boolean;
  isDesktopVisible: boolean;
  onClose: () => void;
}

export default function LessonSidebar({
  courseId,
  activeLessonId,
  lessons,
  chapters,
  completedLessonIds,
  isMobileOpen,
  isDesktopVisible,
  onClose,
}: LessonSidebarProps) {
  // Sort chapters and lessons
  const sortedChapters = [...chapters].sort((a, b) => a.orderIndex - b.orderIndex);
  const sortedLessons = [...lessons].sort((a, b) => a.orderIndex - b.orderIndex);

  // Group lessons by chapterId
  const lessonsByChapter = sortedLessons.reduce((acc, lesson) => {
    const chapId = lesson.chapterId || "unassigned";
    if (!acc[chapId]) acc[chapId] = [];
    acc[chapId].push(lesson);
    return acc;
  }, {} as Record<string, Lesson[]>);

  // Accordion open/close states
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  // Auto-expand the chapter containing the active lesson on initial load
  useEffect(() => {
    const activeLesson = sortedLessons.find((l) => l.id === activeLessonId);
    if (activeLesson) {
      const chapId = activeLesson.chapterId || "unassigned";
      setExpandedChapters((prev) => ({
        ...prev,
        [chapId]: true,
      }));
    } else if (sortedChapters.length > 0) {
      setExpandedChapters((prev) => ({
        ...prev,
        [sortedChapters[0].id]: true,
      }));
    }
  }, [activeLessonId, chapters]);

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  const renderLessonLink = (lesson: Lesson) => {
    const isActive = lesson.id === activeLessonId;
    const isDone = completedLessonIds.has(lesson.id);
    const Icon = lesson.videoUrl ? PlayCircle : FileText;

    return (
      <Link
        key={lesson.id}
        href={`/learn/${courseId}/${lesson.id}`}
        onClick={onClose}
        className={`flex items-center gap-2.5 pl-8 pr-4 py-2.5 transition-colors border-r-2 ${
          isActive
            ? "bg-primary/5 dark:bg-primary/10 border-primary"
            : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/40"
        }`}
      >
        {isDone ? (
          <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
        ) : (
          <Circle size={15} className="text-gray-300 dark:text-gray-600 shrink-0" />
        )}

        <Icon
          size={14}
          className={`shrink-0 ${
            lesson.videoUrl ? "text-blue-500" : "text-emerald-500"
          }`}
        />

        <div className="flex-1 min-w-0">
          <p
            className={`text-xs truncate ${
              isActive
                ? "text-primary font-bold"
                : "text-gray-700 dark:text-gray-300 font-medium"
            }`}
          >
            {lesson.title}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {lesson.videoUrl ? "Video bài giảng" : "Tài liệu lý thuyết"}
          </p>
        </div>

        {isDone && (
          <span className="shrink-0 w-4 h-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <span className="text-[8px] font-extrabold text-emerald-600">✓</span>
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 z-10 lg:hidden top-14 backdrop-blur-xs"
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-20 w-72 bg-white dark:bg-gray-900
          border-r border-gray-200 dark:border-gray-800
          flex flex-col
          transition-all duration-250 ease-in-out
          top-14
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          ${isDesktopVisible ? "lg:translate-x-0 lg:w-72" : "lg:translate-x-0 lg:w-0 lg:border-r-0 lg:overflow-hidden"}
        `}
      >
        {/* Only render inner content when visible (avoids layout artifacts when collapsed) */}
        <div
          className={`flex flex-col h-full w-72 transition-opacity duration-200 ${
            isDesktopVisible ? "lg:opacity-100" : "lg:opacity-0 lg:pointer-events-none"
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                Nội dung khóa học
              </h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-medium">
                {completedLessonIds.size}/{sortedLessons.length} bài hoàn thành
              </p>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-xl text-gray-400 hover:text-gray-650 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Chapters & Lessons Accordion List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-850">
            {sortedChapters.map((chapter) => {
              const chapterLessons = lessonsByChapter[chapter.id] || [];
              const isExpanded = !!expandedChapters[chapter.id];
              const completedInChapter = chapterLessons.filter((l) =>
                completedLessonIds.has(l.id)
              ).length;

              return (
                <div key={chapter.id} className="w-full">
                  <button
                    onClick={() => toggleChapter(chapter.id)}
                    className="w-full flex items-start gap-2 px-4 py-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors text-left"
                  >
                    <ChevronDown
                      size={15}
                      className={`text-gray-400 mt-0.5 shrink-0 transition-transform duration-200 ${
                        isExpanded ? "" : "-rotate-90"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200 leading-snug">
                        {chapter.title}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
                        {completedInChapter}/{chapterLessons.length} bài học
                      </p>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="bg-gray-50/20 dark:bg-gray-900/10 pb-2 border-t border-gray-50 dark:border-gray-800">
                      {chapterLessons.length === 0 ? (
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 italic pl-8 py-2">
                          Chưa có bài học nào trong chương này.
                        </p>
                      ) : (
                        chapterLessons.map((lesson) => renderLessonLink(lesson))
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Unassigned lessons (if any) */}
            {lessonsByChapter["unassigned"] && lessonsByChapter["unassigned"].length > 0 && (
              <div className="w-full">
                <button
                  onClick={() => toggleChapter("unassigned")}
                  className="w-full flex items-start gap-2 px-4 py-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors text-left"
                >
                  <ChevronDown
                    size={15}
                    className={`text-gray-400 mt-0.5 shrink-0 transition-transform duration-200 ${
                      !!expandedChapters["unassigned"] ? "" : "-rotate-90"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-850 dark:text-gray-200 leading-snug">
                      Bài giảng bổ sung
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
                      {lessonsByChapter["unassigned"].length} bài học
                    </p>
                  </div>
                </button>

                {!!expandedChapters["unassigned"] && (
                  <div className="bg-gray-50/20 dark:bg-gray-900/10 pb-2 border-t border-gray-50 dark:border-gray-800">
                    {lessonsByChapter["unassigned"].map((lesson) => renderLessonLink(lesson))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
