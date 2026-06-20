import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  ChevronRight,
  ChevronLeft,
  FileText,
  BookOpen,
  StickyNote,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { getSignedMediaUrl } from "@/lib/supabase";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import LearnShell from "@/components/learn/LearnShell";
import LessonContentPlayer from "@/components/learn/LessonContentPlayer";
import LessonComments from "@/components/learn/LessonComments";
import CompleteButton from "@/components/learn/CompleteButton";
import LessonActionMenu from "@/components/admin/LessonActionMenu";
import ChatWidget from "@/components/rag/ChatWidget";
import LessonTabs from "@/components/learn/LessonTabs";
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

async function getChapters(courseId: string, bearerToken?: string): Promise<any[]> {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) return [];
  try {
    const headers: Record<string, string> = {};
    if (bearerToken) headers['Authorization'] = `Bearer ${bearerToken}`;
    const res = await fetch(`${backendUrl}/chapters/course/${courseId}`, {
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

async function getLessonContents(lessonId: string, bearerToken?: string): Promise<any[]> {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) return [];
  try {
    const headers: Record<string, string> = {};
    if (bearerToken) headers['Authorization'] = `Bearer ${bearerToken}`;
    const res = await fetch(`${backendUrl}/lessons/contents/lesson/${lessonId}`, {
      headers,
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getComments(lessonId: string, bearerToken?: string): Promise<any[]> {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) return [];
  try {
    const headers: Record<string, string> = {};
    if (bearerToken) headers['Authorization'] = `Bearer ${bearerToken}`;
    const res = await fetch(`${backendUrl}/comments/lesson/${lessonId}`, {
      headers,
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
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

async function getUser(bearerToken: string) {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) return null;
  try {
    const res = await fetch(`${backendUrl}/users/me`, {
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

  // Parallel fetch course info, lessons, chapters, lesson contents, comments, progress and user info
  const [course, lessons, chapters, lesson, lessonContents, comments, progressData, user] = await Promise.all([
    getCourse(courseId, bearerToken),
    getLessons(courseId, bearerToken),
    getChapters(courseId, bearerToken),
    getLesson(lessonId, bearerToken),
    getLessonContents(lessonId, bearerToken),
    getComments(lessonId, bearerToken),
    getCourseProgress(courseId, bearerToken),
    getUser(bearerToken),
  ]);

  if (!course || !lesson) {
    notFound();
  }

  const hasLessonPermission = user?.permissions?.includes('action:lesson:create');
  const isInstructor = user?.id === course.instructorId && hasLessonPermission;

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

  const isLocked = (lesson as any).isLocked === true;

  // Resolve signed URLs for all lesson contents (of type video or document if hosted on supabase storage)
  const resolvedContents = await Promise.all(
    (lessonContents || []).map(async (content: any) => {
      // If it's a supabase file path, get signed URL. Otherwise use absolute url.
      try {
        const signedUrl = await getSignedMediaUrl(content.url, bearerToken);
        return {
          ...content,
          signedUrl: signedUrl || content.url,
        };
      } catch (err) {
        console.error("Lỗi khi sinh signed URL:", err);
        return {
          ...content,
          signedUrl: content.url,
        };
      }
    })
  );

  return (
    <LearnShell
      courseId={courseId}
      courseTitle={course.title}
      activeLessonId={lessonId}
      lessons={sortedLessons}
      chapters={chapters || []}
      completedLessonIds={completedLessonIds}
      progressPct={Math.round(progressPct)}
    >
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-5">
        {/* Title bar */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-primary font-semibold mb-0.5 flex items-center gap-1">
              <BookOpen size={12} />
              {course.title}
            </p>
            <div className="flex items-center gap-3">
              <h2 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white truncate">
                {lesson.title}
              </h2>
              {isInstructor && (
                <LessonActionMenu lesson={lesson} token={bearerToken} chapters={chapters} />
              )}
            </div>
          </div>

          {/* Prev / Next navigation */}
          <div className="flex items-center gap-2 shrink-0">
            {prevLesson ? (
              <Link
                href={`/learn/${courseId}/${prevLesson.id}`}
                className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-55 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
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
                className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-550 dark:text-gray-400 hover:bg-gray-55 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-250 transition-colors"
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

        {/* Video player, document player, or lock screen */}
        {isLocked ? (
          <div className="aspect-video rounded-2xl bg-gray-900 flex flex-col items-center justify-center border border-gray-800 text-white p-6 text-center shadow-lg">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
              <Lock size={32} className="text-white" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-2">Nội dung đã bị khóa</h3>
            <p className="text-gray-400 mb-6 max-w-md text-sm md:text-base">
              Khóa học này yêu cầu trả phí. Bạn cần thanh toán để sở hữu và xem toàn bộ nội dung bài học.
            </p>
            <Link 
              href={`/courses/${courseId}`}
              className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-primary/25 shadow-lg"
            >
              Đi đến trang thanh toán
            </Link>
          </div>
        ) : (
          <LessonContentPlayer
            contents={resolvedContents}
            fallbackVideoUrl={lesson.videoUrl ? await getSignedMediaUrl(lesson.videoUrl, bearerToken) : null}
            fallbackContent={lesson.content}
            lessonTitle={lesson.title}
          />
        )}

        {/* Lesson content tabs (Overview/Discussions) */}
        {isLocked ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 md:p-12 text-center text-gray-550 dark:text-gray-400 flex flex-col items-center justify-center shadow-sm">
            <Lock size={48} className="mb-4 text-gray-300 dark:text-gray-650" />
            <p className="text-base font-medium">Nội dung chi tiết đã bị khóa.</p>
            <p className="text-sm mt-1">Vui lòng quay lại trang tổng quan khóa học để đăng ký.</p>
          </div>
        ) : (
          <LessonTabs
            overviewContent={
              <div className="space-y-5">
                <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">
                  Mô tả bài học
                </h3>

                {lesson.content ? (
                  <div className="text-sm text-gray-650 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                    {lesson.content}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-550 italic">
                    Bài học này chưa có mô tả.
                  </p>
                )}

                {/* Complete button */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between flex-wrap gap-3">
                  <CompleteButton
                    lessonId={lessonId}
                    courseId={courseId}
                    initialCompleted={isCurrentCompleted}
                  />

                  {nextLesson && (
                    <Link
                      href={`/learn/${courseId}/${nextLesson.id}`}
                      className="flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline"
                    >
                      Bài tiếp theo
                      <ChevronRight size={15} />
                    </Link>
                  )}
                </div>
              </div>
            }
            commentsContent={
              <LessonComments
                lessonId={lessonId}
                currentUserId={user?.id || ""}
                initialComments={comments || []}
              />
            }
          />
        )}
      </div>
      
      {/* RAG Chat Widget */}
      <ChatWidget courseId={course.id} courseName={course.title} />
    </LearnShell>
  );
}
