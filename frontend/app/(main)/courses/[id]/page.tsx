import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { PlayCircle, BookOpen, Clock, User, ChevronLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LessonList, { type Lesson } from "@/components/courses/LessonList";
import EnrollButton from "@/components/courses/EnrollButton";
import type { Course } from "@/components/courses/CourseCard";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getCourseCookies(): Promise<string> {
  const headerStore = await headers();
  return headerStore.get("cookie") ?? "";
}

async function getCourse(id: string): Promise<Course | null> {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) return null;

  try {
    const cookie = await getCourseCookies();
    const res = await fetch(`${backendUrl}/courses/${id}`, {
      headers: { ...(cookie ? { cookie } : {}) },
      cache: "no-store",
    });
    if (res.status === 404) return null;
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
    const cookie = await getCourseCookies();
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const course = await getCourse(id);
  if (!course) return { title: "Không tìm thấy khóa học | EduSpace" };
  return {
    title: `${course.title} | EduSpace`,
    description: course.description ?? "Chi tiết khóa học trên EduSpace",
  };
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { id } = await params;

  // Fetch course + lessons + auth state in parallel
  const [course, lessons, supabase] = await Promise.all([
    getCourse(id),
    getLessons(id),
    createClient(),
  ]);

  if (!course) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  // Check if user is already enrolled (has any progress record for this course)
  let isEnrolled = false;
  if (user) {
    const { data: progressCheck } = await supabase
      .from('user_progress')
      .select('id, lessons!inner(course_id)')
      .eq('lessons.course_id', id)
      .limit(1);
    isEnrolled = !!(progressCheck && progressCheck.length > 0);
  }

  const sortedLessons = [...lessons].sort((a, b) => a.orderIndex - b.orderIndex);
  const lessonCount = sortedLessons.length;

  return (
    <div className="min-h-full bg-white dark:bg-gray-950">
      {/* ── Breadcrumb ── */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/courses" className="flex items-center gap-1 hover:text-primary transition-colors">
            <ChevronLeft size={14} />
            Tất cả khóa học
          </Link>
          <span>/</span>
          <span className="text-gray-700 dark:text-gray-300 truncate max-w-xs">
            {course.title}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 lg:py-14">
        <div className="grid lg:grid-cols-3 gap-10 lg:gap-14">
          {/* ── Main content ── */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course header */}
            <div>
              {course.isPublished ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 mb-3">
                  <CheckCircle2 size={12} />
                  Đã xuất bản
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 mb-3">
                  Bản nháp
                </span>
              )}

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight">
                {course.title}
              </h1>

              {course.description && (
                <p className="mt-4 text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                  {course.description}
                </p>
              )}

              {/* Meta row */}
              <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1.5">
                  <BookOpen size={15} className="text-primary" />
                  {lessonCount} bài học
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={15} className="text-primary" />
                  Cập nhật {new Date(course.createdAt).toLocaleDateString("vi-VN")}
                </span>
                <span className="flex items-center gap-1.5">
                  <User size={15} className="text-primary" />
                  <span className="font-mono text-xs truncate max-w-[120px]">
                    {course.instructorId}
                  </span>
                </span>
              </div>
            </div>

            {/* Thumbnail */}
            <div className="w-full aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 to-blue-100 dark:from-primary/20 dark:to-blue-900/30 flex items-center justify-center shadow-md">
              {course.thumbnailUrl ? (
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <PlayCircle size={64} className="text-primary/40" />
              )}
            </div>

            {/* ── Syllabus ── */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <BookOpen size={20} className="text-primary" />
                Nội dung khóa học
              </h2>
              <LessonList lessons={sortedLessons} />
            </section>
          </div>

          {/* ── Sticky sidebar ── */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg overflow-hidden">
              {/* Card thumbnail */}
              <div className="aspect-video bg-gradient-to-br from-primary/10 to-blue-100 dark:from-primary/20 dark:to-blue-900/30 flex items-center justify-center">
                {course.thumbnailUrl ? (
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <PlayCircle size={40} className="text-primary/50" />
                )}
              </div>

              <div className="p-5 space-y-5">
                {/* Lesson count */}
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-center gap-2">
                    <BookOpen size={15} className="text-primary shrink-0" />
                    <span>{lessonCount} bài học</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <PlayCircle size={15} className="text-blue-500 shrink-0" />
                    <span>
                      {sortedLessons.filter((l) => l.videoUrl).length} video
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock size={15} className="text-emerald-500 shrink-0" />
                    <span>
                      Truy cập vĩnh viễn sau khi đăng ký
                    </span>
                  </li>
                </ul>

                <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                  <EnrollButton courseId={course.id} isLoggedIn={isLoggedIn} isEnrolled={isEnrolled} />
                </div>

                {!isLoggedIn && (
                  <p className="text-xs text-center text-gray-400 dark:text-gray-500">
                    Bạn cần{" "}
                    <Link
                      href={`/login?next=/courses/${course.id}`}
                      className="text-primary hover:underline"
                    >
                      đăng nhập
                    </Link>{" "}
                    để đăng ký khóa học.
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
