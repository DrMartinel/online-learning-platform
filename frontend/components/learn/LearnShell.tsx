"use client";

import { useState, createContext, useContext } from "react";
import LearnHeader from "./LearnHeader";
import LessonSidebar from "./LessonSidebar";
import type { Lesson } from "@/components/courses/LessonList";

// ── Context so child components (CompleteButton) can trigger a sidebar update ──
interface LearnShellContextValue {
  markLessonCompleted: (lessonId: string) => void;
}
export const LearnShellContext = createContext<LearnShellContextValue>({
  markLessonCompleted: () => {},
});
export const useLearnShell = () => useContext(LearnShellContext);

interface LearnShellProps {
  courseId: string;
  courseTitle: string;
  activeLessonId: string;
  lessons: Lesson[];
  chapters: any[];
  completedLessonIds: string[];
  progressPct: number;
  children: React.ReactNode;
}

export default function LearnShell({
  courseId,
  courseTitle,
  activeLessonId,
  lessons,
  chapters,
  completedLessonIds,
  progressPct,
  children,
}: LearnShellProps) {
  // Mobile: controlled by overlay toggle
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  // Desktop: sidebar visible by default, can be hidden
  const [sidebarDesktopVisible, setSidebarDesktopVisible] = useState(true);

  // Local set of completed lesson IDs — updated optimistically when user marks a lesson done
  const [completedSet, setCompletedSet] = useState<Set<string>>(
    () => new Set(completedLessonIds)
  );

  const markLessonCompleted = (lessonId: string) => {
    setCompletedSet((prev) => {
      const next = new Set(prev);
      next.add(lessonId);
      return next;
    });
  };

  // Total lessons count for progress display
  const totalLessons = lessons.length;

  return (
    <LearnShellContext.Provider value={{ markLessonCompleted }}>
      <div className="h-screen flex flex-col overflow-hidden">
        <LearnHeader
          courseId={courseId}
          courseTitle={courseTitle}
          progressPct={progressPct}
          sidebarMobileOpen={sidebarMobileOpen}
          sidebarDesktopVisible={sidebarDesktopVisible}
          onToggleMobileSidebar={() => setSidebarMobileOpen((v) => !v)}
          onToggleDesktopSidebar={() => setSidebarDesktopVisible((v) => !v)}
        />

        <div className="flex flex-1 overflow-hidden relative">
          <LessonSidebar
            courseId={courseId}
            activeLessonId={activeLessonId}
            lessons={lessons}
            chapters={chapters}
            completedLessonIds={completedSet}
            isMobileOpen={sidebarMobileOpen}
            isDesktopVisible={sidebarDesktopVisible}
            onClose={() => setSidebarMobileOpen(false)}
          />

          {/* Main content area */}
          <main className="flex-1 overflow-y-auto bg-[#F8F9FA] dark:bg-gray-950">
            {children}
          </main>
        </div>
      </div>
    </LearnShellContext.Provider>
  );
}
