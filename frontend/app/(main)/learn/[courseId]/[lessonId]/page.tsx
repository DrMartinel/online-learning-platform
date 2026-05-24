import { notFound, redirect } from "next/navigation";
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

  // Fetch course and active lesson details
  const [course, lesson] = await Promise.all([
    getCourse(courseId, bearerToken),
    getLesson(lessonId, bearerToken),
  ]);

  if (!course || !lesson) {
    notFound();
  }

  return (
    <ActiveLessonPlayground
      courseId={courseId}
      courseTitle={course.title}
      lesson={lesson}
    />
  );
}
