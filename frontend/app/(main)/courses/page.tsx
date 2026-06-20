import { cookies } from "next/headers";
import CourseCatalog from "@/components/courses/CourseCatalog";
import type { Course } from "@/components/courses/CourseCard";
import { getSignedMediaUrl } from "@/lib/supabase";

async function getCourses(): Promise<Course[]> {
  try {
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) return [];

    const cookieStore = await cookies();
    const token = cookieStore.get("olp_session")?.value;
    
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${backendUrl}/courses`, {
      headers,
      cache: "no-store",
    });

    if (!res.ok) return [];
    const courses: Course[] = await res.json();
    
    // Resolve signed URLs for all thumbnails
    const coursesWithSignedUrls = await Promise.all(
      courses.map(async (course) => ({
        ...course,
        thumbnailUrl: course.thumbnailUrl ? await getSignedMediaUrl(course.thumbnailUrl) : course.thumbnailUrl
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

export const metadata = {
  title: "Khóa học | EduSpace",
  description: "Khám phá tất cả khóa học trên EduSpace",
};

export default async function CoursesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("olp_session")?.value;

  const [courses, user] = await Promise.all([
    getCourses(),
    getCurrentUser(token),
  ]);

  const canCreate = user?.permissions?.includes('action:course:create') || user?.role === 'admin';

  return <CourseCatalog initialCourses={courses} canCreateCourse={canCreate} />;
}
