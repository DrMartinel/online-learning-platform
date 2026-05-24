"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Settings, 
  BookOpen, 
  Eye, 
  EyeOff, 
  Trash2, 
  Loader2, 
  AlertTriangle 
} from "lucide-react";
import EditCourseForm from "./EditCourseForm";
import CurriculumManager from "./CurriculumManager";

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  isPublished: boolean;
  instructorId: string;
  createdAt: string;
}

interface CourseEditorWorkspaceProps {
  course: Course;
  token: string;
  isAdmin: boolean;
}

export default function CourseEditorWorkspace({
  course,
  token,
  isAdmin,
}: CourseEditorWorkspaceProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"info" | "curriculum">("info");
  
  // Publishing & Deletion States
  const [isPending, setIsPending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [error, setError] = useState("");

  const togglePublish = async () => {
    setIsPending(true);
    setError("");
    try {
      const url = isAdmin ? `/api/admin/courses/${course.id}` : `/api/courses/${course.id}`;
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !course.isPublished }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Không thể cập nhật trạng thái khóa học");
      }

      router.refresh();
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi.");
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async () => {
    if (confirmTitle !== course.title) {
      setError("Tên khóa học xác nhận không trùng khớp.");
      return;
    }

    setIsDeleting(true);
    setError("");
    try {
      const url = isAdmin ? `/api/admin/courses/${course.id}` : `/api/courses/${course.id}`;
      const res = await fetch(url, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Không thể xóa khóa học");
      }

      setShowDeleteModal(false);
      router.push("/courses");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi xóa khóa học.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ── Tab Navigation Bar ── */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 shrink-0 bg-white dark:bg-gray-900 rounded-2xl p-1.5 shadow-sm">
        <button
          onClick={() => setActiveTab("info")}
          className={`
            flex items-center justify-center gap-2 flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-200
            ${activeTab === "info"
              ? "bg-primary text-white shadow"
              : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/40"
            }
          `}
        >
          <Settings size={16} />
          Cấu hình thông tin, lưu & xóa
        </button>
        <button
          onClick={() => setActiveTab("curriculum")}
          className={`
            flex items-center justify-center gap-2 flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-200
            ${activeTab === "curriculum"
              ? "bg-primary text-white shadow"
              : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/40"
            }
          `}
        >
          <BookOpen size={16} />
          Quản lý giáo trình
        </button>
      </div>

      {/* ── Tab Content Workspace ── */}
      <div className="transition-all duration-300">
        {activeTab === "info" ? (
          /* TAB 1: Course Info, Save, Delete & Publish */
          <div className="grid lg:grid-cols-3 gap-6 items-start">
            
            {/* Left Main Block: Edit Form */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-900 shadow-xl border border-gray-200/80 dark:border-gray-800/80 rounded-3xl overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850/10">
                <h2 className="text-sm font-bold text-gray-850 dark:text-white uppercase tracking-wider">
                  Cấu hình thông tin cơ bản
                </h2>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 font-medium">
                  Cập nhật tiêu đề, mô tả tóm tắt, nội dung chi tiết và ảnh nền đại diện của khóa học.
                </p>
              </div>
              <div className="p-6">
                <EditCourseForm course={course} token={token} />
              </div>
            </div>

            {/* Right block: Publish, Status & Destructive Actions */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Status and Action Panel */}
              <div className="bg-white dark:bg-gray-900 shadow-xl border border-gray-200/80 dark:border-gray-800/80 rounded-3xl overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850/10">
                  <h3 className="text-sm font-bold text-gray-850 dark:text-white uppercase tracking-wider">
                    Xuất bản & Quản trị nâng cao
                  </h3>
                </div>
                
                <div className="p-6 space-y-5">
                  {/* Status Indicator */}
                  <div className="flex items-center gap-3">
                    <span className="flex h-3 w-3 relative">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${course.isPublished ? "bg-emerald-400" : "bg-amber-400"}`}></span>
                      <span className={`relative inline-flex rounded-full h-3 w-3 ${course.isPublished ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                    </span>
                    <div>
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-250">
                        Trạng thái hiện tại:
                      </p>
                      <p className={`text-xs font-semibold mt-0.5 ${course.isPublished ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                        {course.isPublished ? "Đã xuất bản công khai" : "Đang lưu dưới dạng Bản nháp"}
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-400 dark:text-gray-550 leading-relaxed font-semibold">
                    {course.isPublished 
                      ? "Khóa học hiện đang xuất bản và hiển thị công khai trên danh sách khóa học của học viên." 
                      : "Khóa học của bạn đang ở dạng Bản nháp. Chỉ có bạn (Giảng viên) và các Quản trị viên hệ thống mới có thể xem được nội dung."
                    }
                  </p>

                  <div className="h-px bg-gray-100 dark:bg-gray-800" />

                  {/* Actions buttons */}
                  <div className="flex flex-col gap-2.5">
                    <button
                      onClick={togglePublish}
                      disabled={isPending}
                      className={`
                        w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs transition-all duration-300 transform active:scale-98 border
                        ${course.isPublished
                          ? "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-250 dark:border-amber-900/50 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                          : "bg-emerald-600 text-white border-transparent hover:bg-emerald-700 shadow-sm"
                        } disabled:opacity-75 disabled:cursor-not-allowed
                      `}
                    >
                      {isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : course.isPublished ? (
                        <EyeOff size={14} />
                      ) : (
                        <Eye size={14} />
                      )}
                      {course.isPublished ? "Hủy xuất bản khóa học" : "Xuất bản khóa học"}
                    </button>

                    <button
                      onClick={() => {
                        setError("");
                        setConfirmTitle("");
                        setShowDeleteModal(true);
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 hover:bg-red-100 dark:hover:bg-red-950/40 transition-all font-bold text-xs transform active:scale-98"
                    >
                      <Trash2 size={14} />
                      Xóa khóa học vĩnh viễn
                    </button>
                  </div>
                </div>
              </div>

              {error && !showDeleteModal && (
                <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-650 dark:text-red-400 text-xs font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
                  {error}
                </div>
              )}

            </div>
          </div>
        ) : (
          /* TAB 2: Curriculum Timeline Editor */
          <div className="bg-white dark:bg-gray-900 shadow-xl border border-gray-200/80 dark:border-gray-800/80 rounded-3xl overflow-hidden max-w-4xl mx-auto">
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850/10 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-gray-850 dark:text-white uppercase tracking-wider">
                  Biên soạn & Thiết lập Giáo trình
                </h2>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 font-medium">
                  Cấu trúc chương học phân tầng, sắp xếp bài giảng, video đính kèm và tài liệu học tập.
                </p>
              </div>
            </div>
            <div className="p-6">
              <CurriculumManager courseId={course.id} token={token} />
            </div>
          </div>
        )}
      </div>

      {/* ── Destructive Deletion Confirmation Modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md p-6 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
              <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold">Xác nhận xóa khóa học</h4>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
              Hành động này <strong className="text-red-600 dark:text-red-400">không thể hoàn tác</strong>. Toàn bộ thông tin khóa học, danh sách bài học và tiến trình của học viên sẽ bị xóa vĩnh viễn khỏi hệ thống.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Để xác nhận, vui lòng nhập chính xác tên khóa học bên dưới:
              </label>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-800 text-xs font-mono text-gray-600 dark:text-gray-450 select-all mb-2 truncate">
                {course.title}
              </div>
              <input
                type="text"
                value={confirmTitle}
                onChange={(e) => setConfirmTitle(e.target.value)}
                placeholder="Nhập lại tên khóa học để xác nhận..."
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
              />
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-650 dark:text-red-400 text-xs font-semibold">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl border border-gray-350 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold text-sm transition-all"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || confirmTitle !== course.title}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-750 text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-red-600/10"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Xác nhận xóa
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
