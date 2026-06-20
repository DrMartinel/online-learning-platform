"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLearnShell } from "@/components/learn/LearnShell";

interface CompleteButtonProps {
  lessonId: string;
  courseId: string;
  initialCompleted: boolean;
  onCompleted?: () => void;
}

export default function CompleteButton({
  lessonId,
  courseId,
  initialCompleted,
  onCompleted,
}: CompleteButtonProps) {
  const router = useRouter();
  const { markLessonCompleted } = useLearnShell();
  const [done, setDone] = useState(initialCompleted);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const markComplete = async () => {
    if (done || loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/lessons/${lessonId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ completed: true, courseId }),
      });

      if (res.ok) {
        setDone(true);
        // Immediately update the sidebar checkmark via context
        markLessonCompleted(lessonId);
        onCompleted?.();
        // Background refresh to sync server state (progress bar etc.)
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? "Không thể cập nhật. Thử lại sau.");
      }
    } catch {
      setError("Lỗi kết nối. Thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <button
        onClick={markComplete}
        disabled={done || loading}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
          done
            ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 cursor-default"
            : loading
            ? "bg-primary/70 text-white cursor-not-allowed"
            : "bg-primary hover:bg-primary/90 text-white shadow-sm shadow-primary/25 cursor-pointer"
        }`}
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Đang lưu...
          </>
        ) : done ? (
          <>
            <CheckCircle2 size={16} />
            Đã hoàn thành
          </>
        ) : (
          <>
            <Check size={16} />
            Đánh dấu hoàn thành
          </>
        )}
      </button>
      {error && (
        <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
