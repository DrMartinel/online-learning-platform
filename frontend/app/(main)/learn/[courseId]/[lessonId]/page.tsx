import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  ChevronRight,
  ChevronLeft,
  FileText,
  BookOpen,
  StickyNote,
} from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import LearnShell from "@/components/learn/LearnShell";
import VideoPlayer from "@/components/learn/VideoPlayer";
import CompleteButton from "@/components/learn/CompleteButton";
import type { Lesson } from "@/components/courses/LessonList";
import type { Course } from "@/components/courses/CourseCard";

interface PageProps {
  params: Promise<{ courseId: string; lessonId: string }>;
}

// ── Data fetchers ──────────────────────────────────────────────────────────────

async function getRequestCookie(): Promise<string> {
  const h = await headers();
  return h.get("cookie") ?? "";
}

async function getCourse(courseId: string): Promise<Course | null> {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) return null;
  try {
    const cookie = await getRequestCookie();
    const res = await fetch(`${backendUrl}/courses/${courseId}`, {
      headers: { ...(cookie ? { cookie } : {}) },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getLessons(courseId: string): Promise<Lesson[]> {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) return [];
  try {
    const cookie = await getRequestCookie();
    const res = await fetch(`${backendUrl}/courses/${courseId}/lessons`, {
      headers: { ...(cookie ? { cookie } : {}) },
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getLesson(lessonId: string): Promise<Lesson | null> {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) return null;
  try {
    const cookie = await getRequestCookie();
    const res = await fetch(`${backendUrl}/lessons/${lessonId}`, {
      headers: { ...(cookie ? { cookie } : {}) },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

interface CourseProgressResponse {
  completedLessonsCount: number;
  totalLessonsCount: number;
  percentage: number;
  progress: Array<{ lessonId: string; completed: boolean }>;
}

async function getCourseProgress(
  courseId: string,
  bearerToken: string
): Promise<CourseProgressResponse | null> {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) return null;
  try {
    const res = await fetch(`${backendUrl}/user-progress/course/${courseId}`, {
      headers: { authorization: `Bearer ${bearerToken}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ── Metadata ───────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lessonId } = await params;
  const lesson = await getLesson(lessonId);
  if (!lesson) return { title: "Bài học | EduSpace" };
  return {
    title: `${lesson.title} | EduSpace`,
    description: lesson.content ?? "Xem bài học trên EduSpace",
  };
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function LearnPage({ params }: PageProps) {
  const { courseId, lessonId } = await params;

  // Auth check — redirect to login if not authenticated
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect(`/login?next=/learn/${courseId}/${lessonId}`);
  }

  const bearerToken = session.access_token;

  // Parallel fetch: course metadata, all lessons, active lesson, progress
  const [course, lessons, lesson, progressData] = await Promise.all([
    getCourse(courseId),
    getLessons(courseId),
    getLesson(lessonId),
    getCourseProgress(courseId, bearerToken),
  ]);

  if (!course || !lesson) {
    notFound();
  }

  const sortedLessons = [...lessons].sort((a, b) => a.orderIndex - b.orderIndex);

  // IDs the user has already fully completed
  const completedLessonIds = (progressData?.progress ?? [])
    .filter((p) => p.completed)
    .map((p) => p.lessonId);

  const isCurrentCompleted = completedLessonIds.includes(lessonId);
  const progressPct = progressData?.percentage ?? 0;

  // Adjacent lesson navigation
  const currentIndex = sortedLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? sortedLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < sortedLessons.length - 1
      ? sortedLessons[currentIndex + 1]
      : null;

  return (
    <LearnShell
      courseId={courseId}
      courseTitle={course.title}
      activeLessonId={lessonId}
      lessons={sortedLessons}
      completedLessonIds={completedLessonIds}
      progressPct={Math.round(progressPct)}
    >
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-5">
        {/* Title bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-primary font-semibold mb-0.5 flex items-center gap-1">
              <BookOpen size={12} />
              {course.title}
            </p>
            <h2 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white truncate">
              {lesson.title}
            </h2>
          </div>

          {/* Prev / Next navigation */}
          <div className="flex items-center gap-2 shrink-0">
            {prevLesson ? (
              <Link
                href={`/learn/${courseId}/${prevLesson.id}`}
                className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                title={prevLesson.title}
              >
                <ChevronLeft size={18} />
              </Link>
            ) : (
              <span className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed">
                <ChevronLeft size={18} />
              </span>
            )}

            {nextLesson ? (
              <Link
                href={`/learn/${courseId}/${nextLesson.id}`}
                className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                title={nextLesson.title}
              >
                <ChevronRight size={18} />
              </Link>
            ) : (
              <span className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed">
                <ChevronRight size={18} />
              </span>
            )}
          </div>
        </div>

        {/* Video player or document icon */}
        {lesson.videoUrl ? (
          <VideoPlayer src={lesson.videoUrl} title={lesson.title} />
        ) : (
          <div className="aspect-video rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <FileText
                size={56}
                className="mx-auto mb-3 text-gray-300 dark:text-gray-600"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                Bài học này là tài liệu đọc
              </p>
            </div>
          </div>
        )}

        {/* Lesson content tabs */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
          {/* Tab bar */}
          <div className="flex border-b border-gray-200 dark:border-gray-800">
            {[
              { id: "overview", label: "Tổng quan", icon: BookOpen },
              { id: "notes", label: "Ghi chú", icon: StickyNote },
            ].map(({ id, label, icon: Icon }) => (
              <div
                key={id}
                className="flex items-center gap-2 px-5 py-3.5 text-sm font-medium text-primary relative"
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{label}</span>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              </div>
            ))}
          </div>

          {/* Overview pane — lesson description / content */}
          <div className="p-5 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {lesson.title}
            </h3>

            {lesson.content ? (
              <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                {lesson.content}
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                Bài học này chưa có mô tả.
              </p>
            )}

            {/* Complete button */}
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between flex-wrap gap-3">
              <CompleteButton
                lessonId={lessonId}
                initialCompleted={isCurrentCompleted}
              />

              {nextLesson && (
                <Link
                  href={`/learn/${courseId}/${nextLesson.id}`}
                  className="flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
                >
                  Bài tiếp theo
                  <ChevronRight size={15} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </LearnShell>
  );
}
