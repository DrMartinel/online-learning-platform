"use client";

import { useState, useEffect } from "react";
import { Star, Eye, EyeOff, Trash2, Reply, Check, AlertCircle, RefreshCw } from "lucide-react";
import type { Course } from "@/components/courses/CourseCard";

interface Review {
  id: string;
  userId: string;
  courseId: string;
  rating: number;
  comment: string | null;
  status: 'pending' | 'approved' | 'hidden';
  response: string | null;
  respondedAt: string | null;
  createdAt: string;
  userFullName?: string;
  userAvatarUrl?: string;
  courseTitle?: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(true);

  // Filters
  const [courseFilter, setCourseFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState(""); // "", "1", "2", "3", "4", "5", "low" (1-2 stars)
  const [statusFilter, setStatusFilter] = useState(""); // "", "pending", "approved", "hidden"

  // Response Form State
  const [activeResponseId, setActiveResponseId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [responding, setResponding] = useState(false);

  // Error/Success Notifications
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchCourses = async () => {
    try {
      setCoursesLoading(true);
      const res = await fetch("/api/courses");
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch (e) {
      console.error("Error fetching courses list:", e);
    } finally {
      setCoursesLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      
      const params = new URLSearchParams();
      if (courseFilter) params.append("courseId", courseFilter);
      if (statusFilter) params.append("status", statusFilter);
      
      // Star rating filter logic
      if (ratingFilter && ratingFilter !== "low") {
        params.append("rating", ratingFilter);
      }

      const res = await fetch(`/api/admin/reviews?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Không thể tải danh sách đánh giá.");
      }

      let data: Review[] = await res.json();

      // Custom client-side filter for low ratings (1-2 stars)
      if (ratingFilter === "low") {
        data = data.filter(r => r.rating <= 2);
      }

      setReviews(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Đã xảy ra lỗi khi tải đánh giá.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [courseFilter, ratingFilter, statusFilter]);

  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'hidden') => {
    try {
      setErrorMsg("");
      setSuccessMsg("");
      
      const res = await fetch(`/api/admin/reviews/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Cập nhật trạng thái thất bại.");
      }

      setSuccessMsg(`Đã ${newStatus === 'approved' ? 'duyệt hiển thị' : 'ẩn'} đánh giá thành công.`);
      fetchReviews();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn đánh giá này? Hành động này không thể hoàn tác.")) {
      return;
    }

    try {
      setErrorMsg("");
      setSuccessMsg("");

      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Xóa đánh giá thất bại.");
      }

      setSuccessMsg("Đã xóa đánh giá thành công.");
      fetchReviews();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleOpenResponse = (review: Review) => {
    setActiveResponseId(review.id);
    setResponseText(review.response || "");
  };

  const handleSubmitResponse = async (id: string) => {
    if (!responseText.trim()) return;

    try {
      setResponding(true);
      setErrorMsg("");
      setSuccessMsg("");

      const res = await fetch(`/api/admin/reviews/${id}/response`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: responseText.trim() }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gửi phản hồi thất bại.");
      }

      setSuccessMsg("Đã gửi phản hồi đánh giá thành công.");
      setActiveResponseId(null);
      setResponseText("");
      fetchReviews();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setResponding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Đánh giá & Phản hồi</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Kiểm duyệt bình luận từ học viên, lọc theo điểm số và phản hồi lại học viên.
          </p>
        </div>
        <button
          onClick={fetchReviews}
          className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
          title="Tải lại dữ liệu"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 p-4 rounded-2xl text-sm flex items-center gap-2.5">
          <Check size={18} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50 p-4 rounded-2xl text-sm flex items-center gap-2.5">
          <AlertCircle size={18} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Course Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Khóa học</label>
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            disabled={coursesLoading}
            className="w-full text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent p-2.5 outline-none focus:border-primary transition-all dark:text-gray-200"
          >
            <option value="" className="dark:bg-gray-900">Tất cả khóa học</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id} className="dark:bg-gray-900">
                {course.title}
              </option>
            ))}
          </select>
        </div>

        {/* Star Rating Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Mức sao</label>
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="w-full text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent p-2.5 outline-none focus:border-primary transition-all dark:text-gray-200"
          >
            <option value="" className="dark:bg-gray-900">Tất cả số sao</option>
            <option value="5" className="dark:bg-gray-900">⭐⭐⭐⭐⭐ (5 sao)</option>
            <option value="4" className="dark:bg-gray-900">⭐⭐⭐⭐ (4 sao)</option>
            <option value="3" className="dark:bg-gray-900">⭐⭐⭐ (3 sao)</option>
            <option value="2" className="dark:bg-gray-900">⭐⭐ (2 sao)</option>
            <option value="1" className="dark:bg-gray-900">⭐ (1 sao)</option>
            <option value="low" className="dark:bg-gray-900">Đánh giá thấp (1-2 sao)</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Trạng thái duyệt</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent p-2.5 outline-none focus:border-primary transition-all dark:text-gray-200"
          >
            <option value="" className="dark:bg-gray-900">Tất cả trạng thái</option>
            <option value="pending" className="dark:bg-gray-900">Chờ duyệt</option>
            <option value="approved" className="dark:bg-gray-900">Đã hiển thị</option>
            <option value="hidden" className="dark:bg-gray-900">Đã ẩn</option>
          </select>
        </div>
      </div>

      {/* Grid List or Table of reviews */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-semibold">
              <tr>
                <th className="px-6 py-4">Học viên</th>
                <th className="px-6 py-4">Khóa học</th>
                <th className="px-6 py-4">Số sao</th>
                <th className="px-6 py-4">Nhận xét</th>
                <th className="px-6 py-4">Ngày gửi</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-400">
                    Đang tải danh sách đánh giá...
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    Không tìm thấy đánh giá nào trùng khớp.
                  </td>
                </tr>
              ) : (
                reviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                    {/* User profile */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-xs shrink-0">
                          {rev.userAvatarUrl ? (
                            <img src={rev.userAvatarUrl} alt={rev.userFullName} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            (rev.userFullName || "H").charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          {rev.userFullName || "Học viên ẩn danh"}
                        </span>
                      </div>
                    </td>

                    {/* Course title */}
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-medium max-w-[200px] truncate">
                      {rev.courseTitle || "Khóa học ẩn danh"}
                    </td>

                    {/* Star Rating */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} size={14} className="fill-current" />
                        ))}
                        {Array.from({ length: 5 - rev.rating }).map((_, i) => (
                          <Star key={i} size={14} className="text-gray-200 dark:text-gray-800" />
                        ))}
                      </div>
                    </td>

                    {/* Comment text / reply info */}
                    <td className="px-6 py-4 max-w-[300px]">
                      <div className="space-y-1">
                        <p className="text-gray-600 dark:text-gray-300 break-words">
                          {rev.comment || <span className="italic text-gray-400">Không có bình luận</span>}
                        </p>
                        {rev.response && (
                          <p className="text-xs text-primary bg-primary/5 dark:bg-primary/10 px-2.5 py-1.5 rounded-lg border border-primary/10 leading-relaxed">
                            <span className="font-semibold block mb-0.5">Phản hồi của bạn:</span>
                            {rev.response}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Submit Date */}
                    <td className="px-6 py-4 text-xs text-gray-400 dark:text-gray-500 font-mono">
                      {new Date(rev.createdAt).toLocaleDateString("vi-VN")}
                    </td>

                    {/* Moderation Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                          rev.status === "approved"
                            ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                            : rev.status === "hidden"
                            ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400"
                            : "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {rev.status === "approved" ? "Hiển thị" : rev.status === "hidden" ? "Đã ẩn" : "Chờ duyệt"}
                      </span>
                    </td>

                    {/* Interactions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Approve status button */}
                        {rev.status !== "approved" && (
                          <button
                            onClick={() => handleUpdateStatus(rev.id, "approved")}
                            className="p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg transition-all"
                            title="Phê duyệt hiển thị"
                          >
                            <Eye size={16} />
                          </button>
                        )}

                        {/* Hide status button */}
                        {rev.status !== "hidden" && (
                          <button
                            onClick={() => handleUpdateStatus(rev.id, "hidden")}
                            className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-lg transition-all"
                            title="Ẩn bình luận"
                          >
                            <EyeOff size={16} />
                          </button>
                        )}

                        {/* Reply response button */}
                        <button
                          onClick={() => handleOpenResponse(rev)}
                          className={`p-1.5 rounded-lg transition-all ${
                            activeResponseId === rev.id
                              ? "text-primary bg-primary/10"
                              : "text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                          }`}
                          title="Phản hồi lại"
                        >
                          <Reply size={16} />
                        </button>

                        {/* Delete review button */}
                        <button
                          onClick={() => handleDelete(rev.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-all"
                          title="Xóa vĩnh viễn"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INLINE EXPANDED RESPONSE FORM */}
      {activeResponseId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => !responding && setActiveResponseId(null)} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800 z-10 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Gửi phản hồi bình luận</h3>
            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Nhập nội dung phản hồi học viên..."
              rows={4}
              className="w-full text-sm rounded-2xl border border-gray-200 dark:border-gray-800 bg-transparent p-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none dark:text-gray-100 mb-4"
            />
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                disabled={responding}
                onClick={() => setActiveResponseId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={responding || !responseText.trim()}
                onClick={() => handleSubmitResponse(activeResponseId)}
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary/95 transition-all shadow-md shadow-primary/25 disabled:opacity-50"
              >
                {responding ? "Đang gửi..." : "Lưu phản hồi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
