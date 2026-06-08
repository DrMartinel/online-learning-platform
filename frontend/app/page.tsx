import Link from "next/link";
import { cookies } from "next/headers";
import { 
  ArrowRight, Users, BookOpen, Award, TrendingUp, Lock, Sparkles, 
  LogIn, User, Calendar, GraduationCap, Clock, ClipboardList, ShieldAlert
} from "lucide-react";
import CourseCatalog from "@/components/courses/CourseCatalog";
import type { Course } from "@/components/courses/CourseCard";
import MyCourseCard, { type EnrolledCourse } from "@/components/user/MyCourseCard";
import { getSignedMediaUrl } from "@/lib/supabase";

async function getCourses(token: string | undefined): Promise<Course[]> {
  try {
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) return [];

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

async function getMyCourses(token: string | undefined): Promise<EnrolledCourse[]> {
  if (!token) return [];
  try {
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) return [];

    const res = await fetch(`${backendUrl}/user-progress/my-courses`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      cache: "no-store",
    });

    if (!res.ok) return [];
    const courses: EnrolledCourse[] = await res.json();
    
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

const stats = [
  { icon: Users, value: "50,000+", label: "Học viên học tập" },
  { icon: BookOpen, value: "1,200+", label: "Khóa học chất lượng" },
  { icon: Award, value: "300+", label: "Giảng viên uy tín" },
  { icon: TrendingUp, value: "98%", label: "Tỷ lệ hoàn thành" },
];

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get("olp_session")?.value;

  const [user, courses, myCourses] = await Promise.all([
    getCurrentUser(token),
    getCourses(token),
    getMyCourses(token)
  ]);

  return (
    <div className="min-h-screen bg-[#fafaf9] text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 flex flex-col justify-between">
      
      {user ? (
        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           🎉 TRẠNG THÁI ĐÃ ĐĂNG NHẬP (STUDENT/ADMIN DASHBOARD)
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
        <div className="flex-1 w-full">
          {/* Welcome Hero Dashboard */}
          <section className="relative overflow-hidden border-b border-zinc-200/60 dark:border-zinc-800/80 bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/30 dark:from-zinc-950 dark:via-zinc-950 dark:to-indigo-950/20">
            <div
              className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-20"
              aria-hidden
              style={{
                backgroundImage: `radial-gradient(ellipse 80% 60% at 50% -30%, rgb(99 102 241 / 0.25), transparent),
                  radial-gradient(ellipse 60% 50% at 100% 0%, rgb(139 92 246 / 0.15), transparent)`,
              }}
            />
            
            <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-indigo-200/60 bg-indigo-50 px-3 py-1 text-xs font-semibold tracking-wide text-indigo-800 dark:border-indigo-500/20 dark:bg-indigo-950/40 dark:text-indigo-200">
                    <Sparkles size={12} className="text-primary animate-pulse" />
                    Chào mừng bạn đã quay trở lại!
                  </span>
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                    Chào,{" "}
                    <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400">
                      {user.fullName || user.email || "Học viên"}
                    </span>
                    ! 👋
                  </h1>
                  <p className="mt-2 text-base text-zinc-500 dark:text-zinc-400 max-w-xl">
                    Hôm nay là một ngày tuyệt vời để tiếp tục khám phá tri thức và nâng cấp bản thân.
                  </p>
                </div>
                
                {/* User Role Card */}
                <div className="bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl p-4 shadow-sm backdrop-blur-md flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400 flex items-center justify-center font-bold">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Vai trò tài khoản</p>
                    <p className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200">
                      {user.role === "admin" ? "Quản trị viên" : "Học viên học tập"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bảng điều hướng nhanh - Quick Actions Grid */}
              <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link
                  href="/my-courses"
                  className="group relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-indigo-500/40 dark:hover:border-indigo-500/30 transition-all duration-300 flex flex-col gap-3 scale-100 hover:scale-[1.01]"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400 flex items-center justify-center transition-transform group-hover:scale-110">
                    <GraduationCap size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      Khóa học của tôi
                    </h3>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                      Vào xem tiến độ và tiếp tục học tập.
                    </p>
                  </div>
                </Link>

                <Link
                  href="/courses"
                  className="group relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-violet-500/40 dark:hover:border-violet-500/30 transition-all duration-300 flex flex-col gap-3 scale-100 hover:scale-[1.01]"
                >
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 dark:bg-violet-400/10 dark:text-violet-400 flex items-center justify-center transition-transform group-hover:scale-110">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-white text-sm group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                      Khám phá khóa học
                    </h3>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                      Đăng ký thêm các khóa học bổ ích mới.
                    </p>
                  </div>
                </Link>

                <Link
                  href="/profile"
                  className="group relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-emerald-500/40 dark:hover:border-emerald-500/30 transition-all duration-300 flex flex-col gap-3 scale-100 hover:scale-[1.01]"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400 flex items-center justify-center transition-transform group-hover:scale-110">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-white text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      Hồ sơ cá nhân
                    </h3>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                      Xem thành tích và cập nhật thông tin.
                    </p>
                  </div>
                </Link>

                {user.role === "admin" ? (
                  <Link
                    href="/admin/exams"
                    className="group relative overflow-hidden bg-gradient-to-br from-amber-500/5 to-orange-500/5 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-amber-500/40 dark:hover:border-amber-500/30 transition-all duration-300 flex flex-col gap-3 scale-100 hover:scale-[1.01]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400 flex items-center justify-center transition-transform group-hover:scale-110">
                      <ClipboardList size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-900 dark:text-white text-sm group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        Bảng Quản trị hệ thống
                      </h3>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                        Quản lý khóa học, đề thi & đợt thi.
                      </p>
                    </div>
                  </Link>
                ) : (
                  <div
                    className="group relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm flex flex-col gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400 flex items-center justify-center">
                      <Clock size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-900 dark:text-white text-sm">
                        Kỳ thi trực tuyến
                      </h3>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                        Vào khóa học để tham gia các đợt thi.
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </section>

          {/* Section: Khóa học của tôi đang tham gia */}
          <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-6 gap-2">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block animate-pulse" />
                  Khóa học của bạn
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 dark:text-zinc-500">
                  {myCourses.length === 0 ? "Bạn chưa đăng ký khóa học nào." : `Bạn đang tham gia ${myCourses.length} khóa học`}
                </p>
              </div>
              {myCourses.length > 0 && (
                <Link 
                  href="/my-courses" 
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  Xem tất cả khóa học của tôi <ArrowRight size={12} />
                </Link>
              )}
            </div>

            {myCourses.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900/50 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center max-w-2xl mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 px-4 py-4 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
                  <GraduationCap size={32} />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Bắt đầu hành trình học tập mới</h3>
                <p className="text-sm text-zinc-400 dark:text-zinc-500 mb-6 max-w-md mx-auto">
                  Bạn chưa đăng ký bất kỳ khóa học nào trên hệ thống. Hãy khám phá ngay kho tàng khóa học chất lượng cao của chúng tôi.
                </p>
                <Link
                  href="/courses"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-bold text-white shadow-md shadow-indigo-600/10 hover:bg-indigo-500 transition cursor-pointer"
                >
                  Khám phá khóa học ngay <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myCourses.slice(0, 3).map((course) => (
                  <MyCourseCard key={course.id} course={course} />
                ))}
              </div>
            )}
          </section>

          {/* Section: Tất cả khóa học nổi bật khác */}
          <div className="border-t border-zinc-200/50 dark:border-zinc-850 py-4 bg-zinc-50/50 dark:bg-zinc-950/20">
            <CourseCatalog initialCourses={courses} />
          </div>

        </div>
      ) : (
        /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           🌐 TRẠNG THÁI CHƯA ĐĂNG NHẬP (LANDING MARKETING PAGE)
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
        <div className="flex-1 w-full">
          {/* Hero Banner Section */}
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
                  <Sparkles size={12} className="text-primary animate-pulse" /> Nền tảng học tập thông minh thế hệ mới
                </span>
                
                <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl sm:leading-[1.1] dark:text-white">
                  Học không giới hạn.{" "}
                  <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400">
                    Bứt phá tương lai.
                  </span>
                </h1>
                
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Không gian học tập tinh gọn dành riêng cho bạn: Bài giảng trực quan, 
                  theo dõi tiến độ cá nhân hóa và tổ chức thi trực tuyến bảo mật, hiệu quả.
                </p>

                {/* Call To Action Buttons */}
                <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link
                    href="/signup"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-8 text-sm font-extrabold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500 scale-100 hover:scale-[1.01] active:scale-95 cursor-pointer"
                  >
                    Đăng ký tài khoản miễn phí <ArrowRight size={16} />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-zinc-300 bg-white px-8 text-sm font-extrabold text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-650 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 scale-100 hover:scale-[1.01] active:scale-95 cursor-pointer"
                  >
                    <LogIn size={16} /> Đã có tài khoản
                  </Link>
                </div>

                {/* Stats list */}
                <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-zinc-200/60 dark:border-zinc-800 pt-8">
                  {stats.map((s) => (
                    <div key={s.label} className="text-center lg:text-left">
                      <div className="flex items-center justify-center lg:justify-start gap-1.5 mb-1">
                        <s.icon size={16} className="text-primary" />
                        <span className="text-lg font-black text-gray-900 dark:text-white">
                          {s.value}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">{s.label}</p>
                    </div>
                  ))}
                </div>

              </div>

              {/* Right Illustration / Glassmorphism Badge */}
              <div className="flex-1 max-w-sm w-full hidden lg:block">
                <div className="w-full aspect-square bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-violet-500/10 border border-indigo-500/10 dark:from-indigo-500/20 dark:to-blue-900/30 rounded-3xl flex items-center justify-center shadow-xl">
                  <div className="text-center space-y-4">
                    <div className="w-24 h-24 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
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
                Giải pháp toàn diện cho việc Học & Đánh giá
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
                  Theo dõi lộ trình bài giảng và giáo trình thông minh tại một nơi duy nhất — không lo bị mất tài liệu.
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
                  Nắm bắt mức độ hoàn thành bài học, quiz và đợt thi theo thời gian thực để duy trì tối đa động lực học tập.
                </p>
              </li>

              <li className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <Lock size={20} />
                </div>
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">
                  Tổ chức thi & Chấm tự động
                </h3>
                <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  Tổ chức các đợt thi an toàn với hệ thống Access Code, chấm điểm trắc nghiệm tự động chuẩn xác và dashboard phổ điểm.
                </p>
              </li>
            </ul>
          </section>

          {/* Real-time Public Course Catalog */}
          <CourseCatalog initialCourses={courses} />

          {/* Footer Call To Action Banner */}
          <section className="border-t border-zinc-200 bg-zinc-100/80 py-12 dark:border-zinc-800 dark:bg-zinc-900/40">
            <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 space-y-4">
              <h2 className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                Sẵn sàng nâng cao năng lực của bạn hôm nay?
              </h2>
              <p className="mx-auto max-w-lg text-sm text-zinc-500 dark:text-zinc-400">
                Tham gia cùng hàng chục nghìn học viên tại Việt Nam và trải nghiệm phương pháp học tập mới hiệu quả hơn.
              </p>
              <div className="pt-2">
                <Link
                  href="/signup"
                  className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-8 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 cursor-pointer animate-bounce"
                >
                  Đăng ký thành viên mới
                </Link>
              </div>
            </div>
          </section>
        </div>
      )}
      
    </div>
  );
}
