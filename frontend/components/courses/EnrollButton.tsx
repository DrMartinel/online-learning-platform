"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, CheckCircle2, PlayCircle } from "lucide-react";
import Link from "next/link";

interface EnrollButtonProps {
  courseId: string;
  isLoggedIn: boolean;
  isEnrolled?: boolean;
}

export default function EnrollButton({ courseId, isLoggedIn, isEnrolled = false }: EnrollButtonProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");

  if (isEnrolled) {
    return (
      <Link
        href={`/my-courses`}
        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-base font-semibold shadow-lg transition-all"
      >
        <PlayCircle size={18} />
        Tiếp tục học
      </Link>
    );
  }

  const handleEnroll = async () => {
    if (!isLoggedIn) {
      router.push(`/login?next=/courses/${courseId}`);
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch(`/api/courses/${courseId}/enroll`, {
        method: "POST",
      });

      if (res.ok) {
        setStatus("done");
        router.push(`/my-courses`);
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data?.error ?? "Đã có lỗi xảy ra. Vui lòng thử lại.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Không thể kết nối. Vui lòng thử lại.");
      setStatus("error");
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleEnroll}
        disabled={status === "loading" || status === "done"}
        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-base font-semibold shadow-lg shadow-primary/25 transition-all"
      >
        {status === "loading" ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Đang đăng ký...
          </>
        ) : status === "done" ? (
          <>
            <CheckCircle2 size={18} />
            Đã đăng ký!
          </>
        ) : (
          <>
            {isLoggedIn ? "Đăng ký khóa học" : "Đăng nhập để đăng ký"}
            <ArrowRight size={16} />
          </>
        )}
      </button>

      {status === "error" && (
        <p className="text-sm text-red-500 dark:text-red-400 text-center">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
