import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import ActiveLessonPlayground from "@/components/learn/ActiveLessonPlayground";
import type { Lesson } from "@/components/courses/LessonList";
import type { Course } from "@/components/courses/CourseCard";

interface PageProps {
  params: Promise<{ courseId: string; lessonId: string }>;
}

// ── Data fetchers ──────────────────────────────────────────────────────────────

async function getCourse(courseId: string, bearerToken?: string): Promise<Course | null> {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) return null;
  try {
    const headers: Record<string, string> = {};
    if (bearerToken) headers['Authorization'] = `Bearer ${bearerToken}`;
    const res = await fetch(`${backendUrl}/courses/${courseId}`, {
      headers,
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getLessons(courseId: string, bearerToken?: string): Promise<Lesson[]> {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) return [];
  try {
    const headers: Record<string, string> = {};
    if (bearerToken) headers['Authorization'] = `Bearer ${bearerToken}`;
    const res = await fetch(`${backendUrl}/lessons?courseId=${courseId}`, {
      headers,
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getLesson(lessonId: string, bearerToken?: string): Promise<Lesson | null> {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) return null;
  try {
    const headers: Record<string, string> = {};
    if (bearerToken) headers['Authorization'] = `Bearer ${bearerToken}`;
    const res = await fetch(`${backendUrl}/lessons/${lessonId}`, {
      headers,
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
  const cookieStore = await cookies();
  const bearerToken = cookieStore.get("olp_session")?.value;
  const lesson = await getLesson(lessonId, bearerToken);
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
  const cookieStore = await cookies();
  const bearerToken = cookieStore.get("olp_session")?.value;

  if (!bearerToken) {
    redirect(`/login?next=/learn/${courseId}/${lessonId}`);
  }

  // Parallel fetch: course metadata, all lessons, active lesson, progress
  const [course, lessons, lesson, progressData] = await Promise.all([
    getCourse(courseId, bearerToken),
    getLessons(courseId, bearerToken),
    getLesson(lessonId, bearerToken),
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
    <ActiveLessonPlayground
      courseId={courseId}
      courseTitle={course.title}
      lesson={lesson}
      initialCompleted={isCurrentCompleted}
      nextLesson={nextLesson}
      prevLesson={prevLesson}
    />
  );
}
