import { cookies } from "next/headers";
import CourseCatalog from "@/components/courses/CourseCatalog";
import type { Course } from "@/components/courses/CourseCard";
import { getProxyMediaUrl } from "@/lib/supabase-proxy";

async function getCourses(isAdminOrTeacher: boolean): Promise<Course[]> {
  try {
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) return [];

    const cookieStore = await cookies();
    const token = cookieStore.get("olp_session")?.value;
    
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const url = isAdminOrTeacher ? `${backendUrl}/courses` : `${backendUrl}/courses?published=true`;

    const res = await fetch(url, {
      headers,
      cache: "no-store",
    });

    if (!res.ok) return [];
    const courses: Course[] = await res.json();
    
    // Resolve signed URLs for all thumbnails
    const coursesWithSignedUrls = await Promise.all(
      courses.map(async (course) => ({
        ...course,
        thumbnailUrl: course.thumbnailUrl ? getProxyMediaUrl(course.thumbnailUrl, token) : course.thumbnailUrl
      }))
    );
    
    return coursesWithSignedUrls;
  } catch {
    return [];
  }
}

async function getCurrentUser(token: string | undefined): Promise<any | null> {
  if (!token) return null;
  try {
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) return null;

    const res = await fetch(`${backendUrl}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    });
    if (res.ok) {
      return res.json();
    }
    return null;
  } catch {
    return null;
  }
}

async function getEnrolledCoursesProgress(token: string | undefined): Promise<Record<string, any>> {
  if (!token) return {};
  try {
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) return {};
    
    const coursesRes = await fetch(`${backendUrl}/courses/enrolled/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: "no-store",
    });
    
    if (!coursesRes.ok) return {};
    const enrolledRaw = await coursesRes.json();
    
    const progressMap: Record<string, any> = {};
    
    await Promise.all(enrolledRaw.map(async (course: any) => {
      let completedLessons = 0;
      let totalLessons = 0;
      let percentage = 0;
      
      const lessonsRes = await fetch(`${backendUrl}/lessons?courseId=${course.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      });
      if (lessonsRes.ok) {
        const lessons = await lessonsRes.json();
        totalLessons = lessons.length || 0;
      }
      
      const progressRes = await fetch(`${backendUrl}/user-progress/course/${course.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      });
      if (progressRes.ok) {
        const progress = await progressRes.json();
        if (progress && progress.completedLessonsCount !== undefined) {
          completedLessons = progress.completedLessonsCount;
        }
      }
      
      if (totalLessons > 0) {
        percentage = Math.round((completedLessons / totalLessons) * 100);
      }
      
      progressMap[course.id] = {
        isEnrolled: true,
        completedLessons,
        totalLessons,
        percentage
      };
    }));
    
    return progressMap;
  } catch {
    return {};
  }
}

export const metadata = {
  title: "Khóa học | EduSpace",
  description: "Khám phá tất cả khóa học trên EduSpace",
};

export default async function CoursesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("olp_session")?.value;

  const user = await getCurrentUser(token);
  const canCreate = user?.permissions?.includes('action:course:create') || user?.role === 'admin';

  const [courses, enrolledCoursesProgress] = await Promise.all([
    getCourses(canCreate),
    getEnrolledCoursesProgress(token),
  ]);

  return <CourseCatalog initialCourses={courses} canCreateCourse={canCreate} enrolledCoursesProgress={enrolledCoursesProgress} />;
}
