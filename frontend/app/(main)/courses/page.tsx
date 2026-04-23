import { headers } from "next/headers";
import CourseCatalog from "@/components/courses/CourseCatalog";
import type { Course } from "@/components/courses/CourseCard";

async function getCourses(): Promise<Course[]> {
  try {
    // Server Component: use the internal BACKEND_URL directly (same as BFF does).
    // This avoids a loopback HTTP call to our own Next.js API at build/SSR time.
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) return [];

    // Forward the request's cookies so auth context is available on the backend.
    const headerStore = await headers();
    const cookie = headerStore.get("cookie") ?? "";

    const res = await fetch(`${backendUrl}/courses`, {
      headers: { ...(cookie ? { cookie } : {}) },
      cache: "no-store",
    });

    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export const metadata = {
  title: "Khóa học | EduSpace",
  description: "Khám phá tất cả khóa học trên EduSpace",
};

export default async function CoursesPage() {
  const courses = await getCourses();

  return <CourseCatalog initialCourses={courses} />;
}
