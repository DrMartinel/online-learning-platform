import Link from "next/link";
import {
  ArrowRight,
  Users,
  BookOpen,
  Award,
  TrendingUp,
  Lock,
  Sparkles,
  LogIn,
} from "lucide-react";
import CourseCatalog from "@/components/courses/CourseCatalog";
import type { Course } from "@/components/courses/CourseCard";
import { getSignedMediaUrl } from "@/lib/supabase";

async function getCourses(): Promise<Course[]> {
  try {
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) return [];
    const res = await fetch(`${backendUrl}/courses`, { cache: "no-store" });
    if (!res.ok) return [];
    const courses: Course[] = await res.json();
    return await Promise.all(
      courses.map(async (course) => ({
        ...course,
        thumbnailUrl: course.thumbnailUrl
          ? await getSignedMediaUrl(course.thumbnailUrl)
          : course.thumbnailUrl,
      }))
    );
  } catch {
    return [];
  }
}

const stats = [
  { icon: Users, value: "50,000+", label: "Học viên học tập" },
  { icon: BookOpen, value: "1,200+", label: "Khóa học chất lượng" },
  { icon: Award, value: "300+", label: "Giảng viên uy tín" },
  { icon: TrendingUp, value: "98%", label: "Tỷ lệ hoàn thành" },
];

export default async function LandingPage() {
  const courses = await getCourses();

  return (
    <div className="min-h-screen bg-[#fafaf9] text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-zinc-200/60 dark:border-zinc-800 bg-gradient-to-br from-primary/5 via-white to-blue-50 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900">
        <div
          className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-25"
          aria-hidden
          style={{
            backgroundImage: `radial-gradient(ellipse 80% 60% at 50% -30%, rgb(99 102 241 / 0.35), transparent),
              radial-gradient(ellipse 60% 50% at 100% 0%, rgb(139 92 246 / 0.2), transparent)`,
          }}
        />

        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 flex flex-col lg:flex-row items-center gap-12">
          {/* Left Hero Content */}
          <div className="flex-1 text-center lg:text-left max-w-2xl">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-800 dark:border-indigo-500/30 dark:bg-indigo-950/50 dark:text-indigo-200">
              <Sparkles size={12} className="text-primary animate-pulse" /> Nền tảng học tập thông
              minh thế hệ mới
            </span>

            <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl sm:leading-[1.1] dark:text-white">
              Học không giới hạn.{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400">
                Bứt phá tương lai.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
              Không gian học tập tinh gọn dành riêng cho bạn: Bài giảng trực quan, theo dõi tiến
              độ cá nhân hóa và tổ chức thi trực tuyến bảo mật, hiệu quả.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-8 text-sm font-extrabold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500 scale-100 hover:scale-[1.01] active:scale-95"
              >
                Đăng ký tài khoản miễn phí <ArrowRight size={16} />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-zinc-300 bg-white px-8 text-sm font-extrabold text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 scale-100 hover:scale-[1.01] active:scale-95"
              >
                <LogIn size={16} /> Đã có tài khoản
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-zinc-200/60 dark:border-zinc-800 pt-8">
              {stats.map((s) => (
                <div key={s.label} className="text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start gap-1.5 mb-1">
                    <s.icon size={16} className="text-primary" />
                    <span className="text-lg font-black text-gray-900 dark:text-white">
                      {s.value}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Illustration */}
          <div className="flex-1 max-w-sm w-full hidden lg:block">
            <div className="w-full aspect-square bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-violet-500/10 border border-indigo-500/10 dark:from-indigo-500/20 dark:to-blue-900/30 rounded-3xl flex items-center justify-center shadow-xl">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <BookOpen size={48} className="text-primary animate-pulse" />
                </div>
                <div className="space-y-1">
                  <p className="text-gray-800 dark:text-zinc-200 text-sm font-extrabold">
                    Nền tảng Học trực tuyến OLP
                  </p>
                  <p className="text-gray-400 dark:text-zinc-500 text-xs font-semibold">
                    Đồng hành cùng sự nghiệp của bạn
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center space-y-2">
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
            Giải pháp toàn diện cho việc Học &amp; Đánh giá
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
            Hạ tầng tối ưu, quy trình học tập khép kín và giao diện hiện đại đồng bộ.
          </p>
        </div>

        <ul className="mt-12 grid gap-8 sm:grid-cols-3">
          <li className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              <BookOpen size={20} />
            </div>
            <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">
              Học tập có cấu trúc
            </h3>
            <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              Theo dõi lộ trình bài giảng và giáo trình thông minh tại một nơi duy nhất — không lo
              bị mất tài liệu.
            </p>
          </li>

          <li className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
              <TrendingUp size={20} />
            </div>
            <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">
              Thống kê Tiến độ trực quan
            </h3>
            <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              Nắm bắt mức độ hoàn thành bài học, quiz và đợt thi theo thời gian thực để duy trì tối
              đa động lực học tập.
            </p>
          </li>

          <li className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <Lock size={20} />
            </div>
            <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">
              Tổ chức thi &amp; Chấm tự động
            </h3>
            <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              Tổ chức các đợt thi an toàn với hệ thống Access Code, chấm điểm trắc nghiệm tự động
              chuẩn xác và dashboard phổ điểm.
            </p>
          </li>
        </ul>
      </section>

      {/* Public Course Catalog */}
      <CourseCatalog initialCourses={courses} />

      {/* Footer CTA */}
      <section className="border-t border-zinc-200 bg-zinc-100/80 py-12 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 space-y-4">
          <h2 className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Sẵn sàng nâng cao năng lực của bạn hôm nay?
          </h2>
          <p className="mx-auto max-w-lg text-sm text-zinc-500 dark:text-zinc-400">
            Tham gia cùng hàng chục nghìn học viên tại Việt Nam và trải nghiệm phương pháp học tập
            mới hiệu quả hơn.
          </p>
          <div className="pt-2">
            <Link
              href="/signup"
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-8 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 animate-bounce"
            >
              Đăng ký thành viên mới
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
