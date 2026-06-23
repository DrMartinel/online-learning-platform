"use client";

import { useState } from "react";
import { PlayCircle, FileText, ChevronDown, BookOpen, Plus } from "lucide-react";
import Link from "next/link";
import LessonActionMenu from "@/components/admin/LessonActionMenu";

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  videoUrl?: string | null;
  content?: string | null;
  orderIndex: number;
  createdAt: string;
  isLocked?: boolean;
  chapterId?: string | null;
}

interface Chapter {
  id: string;
  title: string;
  orderIndex: number;
}

interface LessonListProps {
  lessons: Lesson[];
  chapters: Chapter[];
  isInstructor?: boolean;
  courseId?: string;
  token?: string;
}

export default function LessonList({ 
  lessons, 
  chapters, 
  isInstructor = false, 
  courseId = "", 
  token = "" 
}: LessonListProps) {
  const sortedChapters = [...chapters].sort((a, b) => a.orderIndex - b.orderIndex);
  const sortedLessons = [...lessons].sort((a, b) => a.orderIndex - b.orderIndex);

  // Group lessons by chapter
  const lessonsByChapter = sortedLessons.reduce((acc, lesson) => {
    const chapId = lesson.chapterId || "unassigned";
    if (!acc[chapId]) acc[chapId] = [];
    acc[chapId].push(lesson);
    return acc;
  }, {} as Record<string, Lesson[]>);

  // Accordion state - expand first chapter by default
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (sortedChapters.length > 0) {
      initial[sortedChapters[0].id] = true;
    }
    return initial;
  });

  const toggleChapter = (id: string) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const renderLessonItem = (lesson: Lesson, index: number) => {
    const Icon = lesson.videoUrl ? PlayCircle : FileText;
    return (
      <li key={lesson.id} className="flex items-center gap-2">
        <Link
          href={`/learn/${lesson.courseId}/${lesson.id}`}
          className="flex-1 flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all cursor-pointer group shadow-xs"
        >
          {/* Index number */}
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20 text-primary group-hover:bg-primary/20 text-[10px] font-bold mt-0.5 transition-colors">
            {index + 1}
          </span>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800 dark:text-gray-250 leading-snug">
              {lesson.title}
            </p>
            {lesson.content && (
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">
                {lesson.content}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0 mt-0.5">
            <Icon
              size={12}
              className={lesson.videoUrl ? "text-blue-500" : "text-emerald-500"}
            />
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              {lesson.videoUrl ? "Video" : "Tài liệu"}
            </span>
          </div>
        </Link>
        {isInstructor && token && (
          <div className="shrink-0">
            <LessonActionMenu lesson={lesson} token={token} chapters={chapters} />
          </div>
        )}
      </li>
    );
  };

  if (chapters.length === 0 && lessons.length === 0) {
    return (
      <p className="text-sm text-gray-400 dark:text-gray-555 italic py-6 text-center">
        Chưa có bài học hay chương nào.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {sortedChapters.map((chapter) => {
        const chapterLessons = lessonsByChapter[chapter.id] || [];
        const isExpanded = !!expanded[chapter.id];

        return (
          <div
            key={chapter.id}
            className="border border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/10 rounded-2xl transition-all shadow-xs"
          >
            {/* Chapter Header */}
            <button
              onClick={() => toggleChapter(chapter.id)}
              className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors"
            >
              <ChevronDown
                size={16}
                className={`text-gray-400 mt-1 shrink-0 transition-transform duration-200 ${
                  isExpanded ? "" : "-rotate-90"
                }`}
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                  {chapter.title}
                </h3>
                <p className="text-[10px] text-gray-400 mt-1 font-medium">
                  {chapterLessons.length} bài giảng
                </p>
              </div>
            </button>

            {/* Lessons Accordion Content */}
            {isExpanded && (
              <div className="p-4 pt-0 border-t border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-950/20">
                {chapterLessons.length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-gray-500 italic py-3 pl-2">
                    Chưa có bài học nào trong chương này.
                  </p>
                ) : (
                  <ol className="space-y-2 mt-3">
                    {chapterLessons.map((lesson, idx) => renderLessonItem(lesson, idx))}
                  </ol>
                )}
                {isInstructor && (
                  <div className="mt-3 flex justify-end">
                    <Link
                      href={`/courses/${courseId}/lessons/create?chapterId=${chapter.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary/10 hover:bg-primary/20 text-primary transition-all cursor-pointer"
                    >
                      <Plus size={12} />
                      Thêm bài học vào chương
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Unassigned lessons (if any) */}
      {lessonsByChapter["unassigned"] && lessonsByChapter["unassigned"].length > 0 && (
        <div className="border border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/10 rounded-2xl transition-all shadow-xs">
          <button
            onClick={() => toggleChapter("unassigned")}
            className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors"
          >
            <ChevronDown
              size={16}
              className={`text-gray-400 mt-1 shrink-0 transition-transform duration-200 ${
                !!expanded["unassigned"] ? "" : "-rotate-90"
              }`}
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-gray-800 dark:text-white leading-tight">
                Bài giảng khác
              </h3>
              <p className="text-[10px] text-gray-400 mt-1 font-medium">
                {lessonsByChapter["unassigned"].length} bài giảng
              </p>
            </div>
          </button>

          {!!expanded["unassigned"] && (
            <div className="p-4 pt-0 border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-950/20">
              <ol className="space-y-2 mt-3">
                {lessonsByChapter["unassigned"].map((lesson, idx) => renderLessonItem(lesson, idx))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
