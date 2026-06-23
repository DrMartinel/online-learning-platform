"use client";

import { useState, useEffect } from "react";
import { Loader2, CheckCircle, Search, ClipboardList } from "lucide-react";
import { useRouter } from "next/navigation";

interface OrganizeExamButtonProps {
  courseId: string;
  token?: string;
  initialOrganizedExamIds?: string[];
}

export default function OrganizeExamButton({ courseId, token, initialOrganizedExamIds = [] }: OrganizeExamButtonProps) {
  const router = useRouter();
  const [allExams, setAllExams] = useState<any[]>([]);
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>(initialOrganizedExamIds);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sync state if props change
  useEffect(() => {
    setSelectedExamIds(initialOrganizedExamIds);
  }, [initialOrganizedExamIds]);

  // Fetch all available exams
  useEffect(() => {
    const fetchExams = async () => {
      try {
        setFetching(true);
        const res = await fetch('/api/admin/exams');
        if (res.ok) {
          const data = await res.json();
          setAllExams(data);
        } else {
          setMessage('Không thể tải danh sách đề thi.');
        }
      } catch (err) {
        console.error('Error fetching exams:', err);
        setMessage('Lỗi kết nối khi tải đề thi.');
      } finally {
        setFetching(false);
      }
    };

    fetchExams();
  }, []);

  const handleToggleExam = (examId: string) => {
    setSelectedExamIds((prev) =>
      prev.includes(examId)
        ? prev.filter((id) => id !== examId)
        : [...prev, examId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`/api/courses/${courseId}/organize-exam`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ examIds: selectedExamIds }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }
      const data = await res.json();
      setMessage(data.message || "Đồng bộ đề thi tổ chức thành công!");
      
      // Force Next.js router refresh and small delay
      router.refresh();
    } catch (err: any) {
      setMessage(`Lỗi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter exams based on search query
  const filteredExams = allExams.filter((exam) =>
    exam.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-5 border border-gray-200 dark:border-gray-800 rounded-3xl bg-white dark:bg-gray-900 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <ClipboardList className="text-primary shrink-0" size={20} />
        <h3 className="text-base font-bold text-gray-900 dark:text-white">Thiết lập Đề thi tổ chức</h3>
      </div>
      
      <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
        Chọn các đề thi dưới đây để tổ chức thi cho học sinh tham gia khóa học này.
      </p>

      {fetching ? (
        <div className="py-6 flex items-center justify-center gap-2">
          <Loader2 className="animate-spin text-primary" size={18} />
          <span className="text-xs text-gray-500 dark:text-gray-450 font-medium">Đang tải danh sách đề thi...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
            <input
              type="text"
              placeholder="Tìm kiếm đề thi theo tên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-gray-50/50 dark:bg-gray-950/20 border border-gray-200 dark:border-gray-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-white placeholder-gray-450 transition-all outline-none"
            />
          </div>

          {/* Exam checkbox list */}
          <div className="max-h-[220px] overflow-y-auto border border-gray-100 dark:border-gray-800 rounded-2xl p-3 bg-gray-50/20 dark:bg-gray-950/10 space-y-2.5">
            {filteredExams.length === 0 ? (
              <p className="text-xs text-gray-450 dark:text-gray-500 italic text-center py-4">
                {searchQuery ? "Không tìm thấy đề thi phù hợp." : "Chưa có đề thi nào trong hệ thống."}
              </p>
            ) : (
              filteredExams.map((exam) => {
                const isSelected = selectedExamIds.includes(exam.id);
                return (
                  <label
                    key={exam.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary/5 border-primary/30 text-primary dark:bg-primary/10"
                        : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-805 text-gray-705 dark:text-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleExam(exam.id)}
                      className="mt-0.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer h-4 w-4 shrink-0"
                    />
                    <div className="text-xs space-y-0.5">
                      <span className="font-bold block leading-relaxed">{exam.title}</span>
                      <span className="font-mono text-[9px] text-gray-400 block">
                        ID: {exam.id.substring(0, 8).toUpperCase()}
                      </span>
                    </div>
                  </label>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-between gap-4 pt-2">
            <span className="text-[10px] font-bold text-gray-450 dark:text-gray-550 uppercase tracking-wider">
              Đã chọn: {selectedExamIds.length} đề thi
            </span>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-2xl hover:bg-primary/95 shadow-md shadow-primary/10 disabled:opacity-50 transition-all cursor-pointer shrink-0"
            >
              {loading ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle size={14} />}
              {loading ? "Đang xử lý..." : "Lưu thay đổi"}
            </button>
          </div>

          {message && (
            <p className={`text-xs font-semibold mt-2 ${message.startsWith("Lỗi") ? "text-rose-500" : "text-emerald-500"}`}>
              {message}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
