"use client";

import { useState } from "react";
import LearnHeader from "./LearnHeader";
import LessonSidebar from "./LessonSidebar";
import type { Lesson } from "@/components/courses/LessonList";

interface LearnShellProps {
  courseId: string;
  courseTitle: string;
  activeLessonId: string;
  lessons: Lesson[];
  completedLessonIds: string[];
  progressPct: number;
  children: React.ReactNode;
}

export default function LearnShell({
  courseId,
  courseTitle,
  activeLessonId,
  lessons,
  completedLessonIds,
  progressPct,
  children,
}: LearnShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const completedSet = new Set(completedLessonIds);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <LearnHeader
        courseId={courseId}
        courseTitle={courseTitle}
        progressPct={progressPct}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <LessonSidebar
          courseId={courseId}
          activeLessonId={activeLessonId}
          lessons={lessons}
          completedLessonIds={completedSet}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-[#F8F9FA] dark:bg-gray-950">
          {children}
        </main>
      </div>
    </div>
  );
}
