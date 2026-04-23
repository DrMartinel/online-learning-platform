import Link from "next/link";
import { headers } from "next/headers";
import { ArrowRight, Users, BookOpen, Award, TrendingUp } from "lucide-react";
import CourseCatalog from "@/components/courses/CourseCatalog";
import type { Course } from "@/components/courses/CourseCard";

async function getCourses(): Promise<Course[]> {
  try {
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) return [];

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

const stats = [
  { icon: Users, value: "50,000+", label: "Học viên" },
  { icon: BookOpen, value: "1,200+", label: "Khóa học" },
  { icon: Award, value: "300+", label: "Giảng viên" },
  { icon: TrendingUp, value: "95%", label: "Hài lòng" },
];

export default async function Home() {
  const courses = await getCourses();

  return (
    <div className="min-h-full bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-50">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24 flex flex-col lg:flex-row items-center gap-12">
          {/* Left */}
          <div className="flex-1 text-center lg:text-left max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 dark:bg-primary/20 text-primary rounded-full text-sm font-medium mb-6">
              <TrendingUp size={14} /> Nền tảng #1 Việt Nam
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight">
              Học mọi lúc,{" "}
              <span className="text-primary">mọi nơi</span>
            </h1>
            <p className="mt-5 text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-lg mx-auto lg:mx-0">
              Khám phá hàng nghìn khóa học chất lượng cao từ các giảng viên hàng đầu.
              Học qua video, làm quiz, tham gia lớp học trực tiếp.
            </p>

            {/* CTA buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto lg:mx-0">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-base font-semibold shadow-lg shadow-primary/25 transition-all"
              >
                Bắt đầu miễn phí <ArrowRight size={16} />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-3.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 rounded-xl text-base font-semibold transition hover:border-primary hover:text-primary dark:hover:border-primary"
              >
                Đã có tài khoản
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                    <s.icon size={16} className="text-primary" />
                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                      {s.value}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right illustration */}
          <div className="flex-1 max-w-md w-full hidden lg:block">
            <div className="w-full aspect-square bg-gradient-to-br from-primary/20 to-blue-200 dark:from-primary/30 dark:to-blue-900/40 rounded-3xl flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto shadow-xl mb-4">
                  <BookOpen size={48} className="text-primary" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                  Bắt đầu học ngay
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features strip ── */}
      <section className="border-y border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <ul className="grid gap-6 sm:grid-cols-3">
            <li className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/50">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Học có cấu trúc</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                Theo dõi module và tài liệu rõ ràng tại một nơi — không còn mở hàng chục tab.
              </p>
            </li>
            <li className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/50">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Theo dõi tiến độ</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                Nắm bắt mức độ hoàn thành và bước tiếp theo để duy trì động lực học tập.
              </p>
            </li>
            <li className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/50">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Bảo mật tích hợp</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                Row-level security và phân quyền theo vai trò bảo vệ dữ liệu học viên.
              </p>
            </li>
          </ul>
        </div>
      </section>

      {/* ── Course Catalog ── */}
      <CourseCatalog initialCourses={courses} />

      {/* ── CTA ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-gradient-to-r from-primary to-blue-600 rounded-3xl p-8 md:p-14 text-center text-white relative overflow-hidden">
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Sẵn sàng bắt đầu hành trình?
            </h2>
            <p className="text-white/80 text-lg max-w-xl mx-auto mb-8">
              Tham gia cùng 50,000+ học viên và nâng cao kỹ năng của bạn ngay hôm nay.
            </p>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-xl text-sm"
            >
              Khám phá khóa học <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
