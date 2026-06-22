"use client";

import { useState, useEffect } from "react";
import { Star, MessageSquare, AlertCircle, CheckCircle2, X } from "lucide-react";

interface Review {
  id: string;
  userId: string;
  courseId: string;
  rating: number;
  comment: string | null;
  status: string;
  response: string | null;
  respondedAt: string | null;
  createdAt: string;
  userFullName?: string;
  userAvatarUrl?: string;
}

interface CourseReviewsProps {
  courseId: string;
  isLoggedIn: boolean;
  isEnrolled: boolean;
  sessionToken?: string;
}

export default function CourseReviews({ courseId, isLoggedIn, isEnrolled, sessionToken }: CourseReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [checkingMyReview, setCheckingMyReview] = useState(isLoggedIn);
  
  // Submit Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Fetch reviews & user's own review
  const fetchReviewsData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/courses/${courseId}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (e) {
      console.error("Error fetching reviews:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyReview = async () => {
    if (!isLoggedIn) return;
    try {
      setCheckingMyReview(true);
      const res = await fetch(`/api/courses/${courseId}/reviews/my-review`);
      if (res.ok) {
        const data = await res.json();
        setMyReview(data);
      }
    } catch (e) {
      console.error("Error checking user review status:", e);
    } finally {
      setCheckingMyReview(false);
    }
  };

  useEffect(() => {
    fetchReviewsData();
    fetchMyReview();
  }, [courseId, isLoggedIn]);

  // Statistics calculation
  const totalReviews = reviews.length;
  const ratingAverage = totalReviews > 0 
    ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
    : 0;

  // Count distribution of stars
  const starCounts = [0, 0, 0, 0, 0]; // index 0 for 1 star, ..., index 4 for 5 stars
  reviews.forEach((r) => {
    const starIdx = Math.max(1, Math.min(5, r.rating)) - 1;
    starCounts[starIdx]++;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess(false);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/courses/${courseId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gửi đánh giá thất bại.");
      }

      setSubmitSuccess(true);
      setComment("");
      setRating(5);
      
      // Refresh my review info
      await fetchMyReview();
      // Reload reviews (in case it is auto-approved, though default is pending)
      await fetchReviewsData();
      
      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitSuccess(false);
      }, 3000);
    } catch (err: any) {
      setSubmitError(err.message || "Có lỗi xảy ra khi gửi đánh giá.");
    } finally {
      setSubmitting(false);
    }
  };

  // Capitalize name initials
  const formatName = (name?: string) => {
    if (!name) return "Học viên ẩn danh";
    return name;
  };

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Star className="text-amber-500 fill-amber-500" size={20} />
            Đánh giá từ học viên
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Ý kiến phản hồi từ những người đã trải nghiệm khóa học này.
          </p>
        </div>

        {/* Action Button */}
        {isLoggedIn && isEnrolled && !checkingMyReview && (
          <div className="flex-shrink-0">
            {myReview ? (
              <div className="text-xs bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700 px-4 py-2.5 rounded-xl text-gray-600 dark:text-gray-300">
                <span className="font-semibold text-primary">Đánh giá của bạn:</span>{" "}
                <span className="text-amber-500">{"★".repeat(myReview.rating)}</span>
                <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 capitalize">
                  {myReview.status === "pending"
                    ? "Chờ duyệt"
                    : myReview.status === "approved"
                    ? "Đã hiển thị"
                    : "Đã ẩn"}
                </span>
              </div>
            ) : (
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-primary hover:bg-primary/95 shadow-md shadow-primary/20 px-5 py-2.5 rounded-xl transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                + Viết đánh giá
              </button>
            )}
          </div>
        )}
      </div>

      {/* Summary Matrix */}
      <div className="grid md:grid-cols-3 gap-8 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800/50 p-6 sm:p-8 rounded-2xl">
        {/* Aggregated Score */}
        <div className="flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-gray-200/60 dark:border-gray-800">
          <span className="text-5xl font-black text-gray-900 dark:text-white">
            {ratingAverage > 0 ? ratingAverage.toFixed(1) : "0.0"}
          </span>
          <div className="flex items-center gap-1 mt-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={18}
                className={
                  s <= Math.round(ratingAverage)
                    ? "text-amber-500 fill-amber-500"
                    : "text-gray-300 dark:text-gray-600"
                }
              />
            ))}
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400 mt-3 font-medium">
            {totalReviews} đánh giá được hiển thị
          </span>
        </div>

        {/* Progress Bars */}
        <div className="md:col-span-2 space-y-3.5 flex flex-col justify-center">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = starCounts[stars - 1];
            const percent = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            return (
              <div key={stars} className="flex items-center gap-3 text-sm">
                <button className="flex items-center gap-1 text-gray-600 dark:text-gray-300 font-medium w-12 hover:text-primary transition-colors">
                  <span>{stars}</span>
                  <Star size={13} className="text-amber-500 fill-amber-500" />
                </button>
                <div className="flex-1 h-2.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500 font-mono w-10 text-right">
                  {percent.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="py-10 text-center text-gray-400">Đang tải đánh giá...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-6">
          <MessageSquare className="mx-auto text-gray-400 mb-3" size={32} />
          <h4 className="font-semibold text-gray-700 dark:text-gray-300">Chưa có đánh giá nào</h4>
          <p className="text-xs text-gray-400 mt-1">Trở thành người đầu tiên viết đánh giá cho khóa học này!</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800 space-y-6">
          {reviews.map((rev) => (
            <div key={rev.id} className="pt-6 first:pt-0 space-y-4">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary flex-shrink-0 text-sm overflow-hidden border border-primary/20 shadow-sm">
                  {rev.userAvatarUrl ? (
                    <img src={rev.userAvatarUrl} alt={rev.userFullName} className="w-full h-full object-cover" />
                  ) : (
                    formatName(rev.userFullName).charAt(0).toUpperCase()
                  )}
                </div>

                {/* Profile info & Star */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                      {formatName(rev.userFullName)}
                    </h4>
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                      {new Date(rev.createdAt).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={14}
                        className={
                          s <= rev.rating
                            ? "text-amber-500 fill-amber-500"
                            : "text-gray-200 dark:text-gray-700"
                        }
                      />
                    ))}
                  </div>

                  {rev.comment && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-2.5 leading-relaxed bg-white/50 dark:bg-transparent rounded-xl">
                      {rev.comment}
                    </p>
                  )}
                </div>
              </div>

              {/* Instructor Response */}
              {rev.response && (
                <div className="ml-14 bg-gray-50 dark:bg-gray-900/40 border-l-4 border-primary pl-4 py-3 pr-3 rounded-r-xl space-y-1.5 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center text-[11px] font-bold tracking-wide text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                      Phản hồi từ giảng viên
                    </span>
                    {rev.respondedAt && (
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                        {new Date(rev.respondedAt).toLocaleDateString("vi-VN")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                    {rev.response}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* POPUP MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            onClick={() => !submitting && setIsModalOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 z-10 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Viết đánh giá khóa học</h3>
              <button
                disabled={submitting}
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {submitError && (
                <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50 p-3.5 rounded-xl text-xs flex items-center gap-2.5">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {submitSuccess ? (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 p-6 rounded-2xl text-center space-y-3">
                  <CheckCircle2 size={36} className="mx-auto text-emerald-500" />
                  <h4 className="font-bold text-base">Gửi đánh giá thành công!</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Đánh giá của bạn đã được lưu và đang được Admin phê duyệt để hiển thị.
                  </p>
                </div>
              ) : (
                <>
                  {/* Star Rating Selector */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Chọn số sao đánh giá <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2 py-2">
                      {[1, 2, 3, 4, 5].map((s) => {
                        const isStarred = hoverRating !== null ? s <= hoverRating : s <= rating;
                        return (
                          <button
                            key={s}
                            type="button"
                            onMouseEnter={() => setHoverRating(s)}
                            onMouseLeave={() => setHoverRating(null)}
                            onClick={() => setRating(s)}
                            className="transition-all hover:scale-125 focus:outline-none"
                          >
                            <Star
                              size={36}
                              className={`transition-colors duration-150 ${
                                isStarred
                                  ? "text-amber-500 fill-amber-500"
                                  : "text-gray-200 dark:text-gray-800"
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Comment Textarea */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Nội dung nhận xét
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Hãy chia sẻ cảm nhận, trải nghiệm và bài học bạn rút ra từ khóa học này..."
                      rows={4}
                      className="w-full text-sm rounded-2xl border border-gray-200 dark:border-gray-800 bg-transparent p-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none dark:text-gray-100"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => setIsModalOpen(false)}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary/95 transition-all shadow-md shadow-primary/25 disabled:opacity-50"
                    >
                      {submitting ? "Đang gửi..." : "Gửi đánh giá"}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
