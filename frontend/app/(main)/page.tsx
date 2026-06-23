import Link from "next/link";
import { cookies } from "next/headers";
import { 
  ArrowRight, BookOpen, Sparkles, User, GraduationCap, Clock, ClipboardList
} from "lucide-react";
import CourseCatalog from "@/components/courses/CourseCatalog";
import type { Course } from "@/components/courses/CourseCard";
import MyCourseCard, { type EnrolledCourse } from "@/components/user/MyCourseCard";
import { getProxyMediaUrl } from "@/lib/supabase-proxy";

async function getCourses(token: string | undefined, isAdminOrTeacher: boolean): Promise<Course[]> {
  try {
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) return [];

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

// Đổi kiểu trả về để chứa cả tổng số khóa học thực tế
async function getMyCoursesData(token: string | undefined): Promise<{ total: number, courses: EnrolledCourse[] }> {
  if (!token) return { total: 0, courses: [] };
  try {
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) return { total: 0, courses: [] };

    const coursesRes = await fetch(`${backendUrl}/courses/enrolled/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: "no-store",
    });

    if (!coursesRes.ok) return { total: 0, courses: [] };
    const coursesRaw = await coursesRes.json();
    
    // Lấy tổng số lượng khóa học thực tế ĐÃ SỞ HỮU
    const total = coursesRaw.length;
    
    // Cắt 3 khóa học để tối ưu hiển thị trang chủ
    const recentCourses = coursesRaw.slice(0, 3);
    const enrolledCourses: EnrolledCourse[] = [];

    for (const course of recentCourses) {
      let completedLessons = 0;
      let totalLessons = 0;
      let percentage = 0;

      // 1. CHỦ ĐỘNG FETCH TỔNG SỐ BÀI HỌC CỦA KHÓA NÀY (Đảm bảo totalLessons luôn đúng kể cả khi chưa học)
      const lessonsRes = await fetch(`${backendUrl}/lessons?courseId=${course.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      });
      if (lessonsRes.ok) {
        const lessons = await lessonsRes.json();
        totalLessons = lessons.length || 0;
      }

      // 2. FETCH TIẾN ĐỘ HỌC (Số bài đã hoàn thành)
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

      // 3. TÍNH TOÁN PERCENTAGE CHÍNH XÁC
      if (totalLessons > 0) {
        percentage = Math.round((completedLessons / totalLessons) * 100);
      }

      const thumbnailUrl = course.thumbnailUrl 
        ? getProxyMediaUrl(course.thumbnailUrl, token) 
        : course.thumbnailUrl;

      enrolledCourses.push({
        ...course,
        thumbnailUrl,
        completedLessons,
        totalLessons,
        percentage,
        lastActivityAt: null,
      });
    }
    
    return { total, courses: enrolledCourses };
  } catch (error) {
    console.error("Lỗi khi fetch Khóa học của tôi tại trang chủ:", error);
    return { total: 0, courses: [] };
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

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("olp_session")?.value;

  const user = await getCurrentUser(token);
  const isAdminOrTeacher = user?.role === "admin" || user?.permissions?.includes("action:course:create");

  const [courses, myCoursesData] = await Promise.all([
    getCourses(token, isAdminOrTeacher),
    getMyCoursesData(token) // Đổi tên biến nhận dữ liệu mới
  ]);

  const { total: enrolledTotal, courses: myCourses } = myCoursesData;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <p className="text-red-500 mb-4 font-semibold">Không thể xác thực thông tin người dùng.</p>
        <Link href="/api/auth/logout" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold">
          Đăng nhập lại
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full min-h-screen bg-[#fafaf9] text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 flex flex-col">
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
        
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
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

            {user.role === "admin" || user.permissions?.includes("action:course:create") ? (
              <Link
                href="/exams"
                className="group relative overflow-hidden bg-gradient-to-br from-amber-500/5 to-orange-500/5 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-amber-500/40 dark:hover:border-amber-500/30 transition-all duration-300 flex flex-col gap-3 scale-100 hover:scale-[1.01]"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400 flex items-center justify-center transition-transform group-hover:scale-110">
                  <ClipboardList size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-white text-sm group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    Quản lý đề & đợt thi
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

      {/* Section: Khóa học của tôi đang tham gia*/}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 flex-1 w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-6 gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block animate-pulse" />
              Khóa học của bạn
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 dark:text-zinc-500">
              {enrolledTotal === 0 ? "Bạn chưa đăng ký khóa học nào." : `Bạn đang tham gia ${enrolledTotal} khóa học`}
            </p>
          </div>
          {enrolledTotal > 0 && (
            <Link 
              href="/my-courses" 
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              Xem tất cả khóa học của tôi <ArrowRight size={12} />
            </Link>
          )}
        </div>

        {enrolledTotal === 0 ? (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {myCourses.map((course) => (
              <MyCourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>

      {/* Section: Tất cả khóa học nổi bật khác */}
      <div className="border-t border-zinc-200/50 dark:border-zinc-800/50 py-12 bg-zinc-50/50 dark:bg-zinc-950/20">
        <CourseCatalog initialCourses={courses} />
      </div>
    </div>
  );
}