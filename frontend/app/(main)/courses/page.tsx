import { cookies } from "next/headers";
import CourseCatalog from "@/components/courses/CourseCatalog";
import type { Course } from "@/components/courses/CourseCard";

async function getCourses(): Promise<Course[]> {
  try {
    // Server Component: use the internal BACKEND_URL directly (same as BFF does).
    // This avoids a loopback HTTP call to our own Next.js API at build/SSR time.
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
    return res.json();
  } catch {
    return [];
  }
}

async function getCurrentUser() {
  try {
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) return null;

    const cookieStore = await cookies();
    const token = cookieStore.get("olp_session")?.value;
    if (!token) return null;

    const res = await fetch(`${backendUrl}/users/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store'
    });

    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export const metadata = {
  title: "Khóa học | EduSpace",
  description: "Khám phá tất cả khóa học trên EduSpace",
};

export default async function CoursesPage() {
  const [courses, currentUser] = await Promise.all([
    getCourses(),
    getCurrentUser()
  ]);

  return <CourseCatalog initialCourses={courses} currentUser={currentUser} />;
}
