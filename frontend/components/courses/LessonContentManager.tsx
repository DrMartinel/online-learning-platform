"use client";

import { useState, useEffect, useTransition } from "react";
import { FolderOpen, Trash2, Plus, UploadCloud, Video, FileText, Loader2, X } from "lucide-react";
import { supabaseProxyClient } from "@/lib/supabase-proxy";

interface LessonContent {
  id: string;
  lessonId: string;
  type: string; // 'video' | 'document'
  title: string;
  url: string;
  durationMinutes?: number | null;
  orderIndex: number;
}

interface LessonContentManagerProps {
  lessonId: string;
  token: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function LessonContentManager({
  lessonId,
  token,
  isOpen,
  onClose,
}: LessonContentManagerProps) {
  const [contents, setContents] = useState<LessonContent[]>([]);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"video" | "document">("video");
  const [duration, setDuration] = useState<number>(10);
  const [orderIndex, setOrderIndex] = useState<number>(1);
  const [file, setFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loadingList, setLoadingList] = useState(true);

  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const fetchContents = async () => {
    try {
      setLoadingList(true);
      const res = await fetch(`/api/lessons/contents/lesson/${lessonId}`);
      if (res.ok) {
        const data = await res.json();
        setContents(data.sort((a: any, b: any) => a.orderIndex - b.orderIndex));
      }
    } catch (err) {
      console.error("Lỗi khi tải học liệu:", err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchContents();
    }
  }, [isOpen, lessonId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !file || isPending) return;

    startTransition(async () => {
      try {
        // 1. Upload file to backend proxy
        const fileExt = file.name.split(".").pop();
        const folder = type === "video" ? "videos" : "documents";
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        if (type === "video" || file.size > 50 * 1024 * 1024) {
          setUploadProgress(0);
          await supabaseProxyClient.uploadVideoResumable(
            'course-media', 
            filePath, 
            file, 
            token,
            (uploaded, total) => {
              setUploadProgress(Math.round((uploaded / total) * 100));
            }
          );
          setUploadProgress(null);
        } else {
          await supabaseProxyClient.uploadObjectWithFormData('course-media', filePath, file, token);
        }

        // 2. Save content metadata to backend database
        const res = await fetch("/api/lessons/contents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lessonId,
            type,
            title: title.trim(),
            url: filePath,
            durationMinutes: type === "video" ? duration : null,
            orderIndex,
          }),
        });

        if (!res.ok) throw new Error("Lỗi lưu thông tin học liệu");

        // Reset form & reload list
        setTitle("");
        setFile(null);
        setOrderIndex((prev) => prev + 1);
        await fetchContents();
      } catch (err) {
        setUploadProgress(null);
        alert(err instanceof Error ? err.message : "Đã xảy ra lỗi");
      }
    });
  };

  const handleDeleteContent = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa học liệu này?")) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/lessons/contents/${id}`, {
          method: "DELETE",
        });

        if (!res.ok) throw new Error("Lỗi khi xóa học liệu");
        setContents((prev) => prev.filter((c) => c.id !== id));
      } catch (err) {
        alert(err instanceof Error ? err.message : "Đã xảy ra lỗi");
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-base font-extrabold text-gray-950 dark:text-white flex items-center gap-2">
            <FolderOpen size={18} className="text-primary" />
            Quản lý học liệu bài giảng
          </h2>
          <button
            onClick={() => {
              onClose();
              window.location.reload(); // Reload page when closing to update player
            }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Add Content Form */}
          <form onSubmit={handleSubmit} className="bg-gray-50/50 dark:bg-gray-900/10 p-4 rounded-xl border border-gray-200 dark:border-gray-800/80 space-y-4">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
              <Plus size={14} className="text-primary" />
              Thêm học liệu mới
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Title */}
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                  Tiêu đề học liệu *
                </label>
                <input
                  type="text"
                  placeholder="Nhập tên tài liệu / video (ví dụ: Video lý thuyết phần 1)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:border-primary outline-none"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                  Loại học liệu
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:border-primary outline-none"
                >
                  <option value="video">Video bài giảng</option>
                  <option value="document">Tài liệu học (PDF, Doc, v.v.)</option>
                </select>
              </div>

              {/* Order Index */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                  Thứ tự hiển thị
                </label>
                <input
                  type="number"
                  value={orderIndex}
                  onChange={(e) => setOrderIndex(parseInt(e.target.value) || 1)}
                  required
                  min={1}
                  className="w-full text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:border-primary outline-none"
                />
              </div>

              {/* Duration (video only) */}
              {type === "video" && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                    Thời lượng video (phút)
                  </label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                    required
                    min={0}
                    className="w-full text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:border-primary outline-none"
                  />
                </div>
              )}
            </div>

            {/* File Upload Area */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                Tệp tin đính kèm *
              </label>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-350 dark:border-gray-700 border-dashed rounded-xl cursor-pointer bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-4 pb-4 px-4 text-center">
                  {file ? (
                    <>
                      {type === "video" ? (
                        <Video className="w-8 h-8 text-primary mb-2" />
                      ) : (
                        <FileText className="w-8 h-8 text-emerald-500 mb-2" />
                      )}
                      <p className="text-xs font-bold text-gray-800 dark:text-white truncate max-w-md">{file.name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-bold text-primary">Nhấn để chọn tệp</span> hoặc kéo thả vào đây
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {type === "video" ? "MP4, WebM, AVI" : "PDF, ZIP, DOCX, XLSX"}
                      </p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept={type === "video" ? "video/*" : "*"}
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setFile(e.target.files[0]);
                    }
                  }}
                  required
                />
              </label>
            </div>

            {/* Submit Button & Progress */}
            {uploadProgress !== null ? (
              <div className="flex flex-col pt-2">
                <div className="flex justify-between text-xs font-bold mb-1.5 text-primary">
                  <span>Đang tải lên...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-gray-500 mt-2 text-center">Vui lòng không đóng cửa sổ này khi đang tải video.</p>
              </div>
            ) : (
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={!title.trim() || !file || isPending}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold bg-primary hover:bg-primary/95 text-white rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                  Tải lên học liệu
                </button>
              </div>
            )}
          </form>

          {/* List of Existing Contents */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white">Học liệu đã tải lên</h3>
            {loadingList ? (
              <div className="flex justify-center items-center py-6 text-gray-400">
                <Loader2 size={24} className="animate-spin mr-2" />
                <span className="text-xs font-medium">Đang tải danh sách...</span>
              </div>
            ) : contents.length === 0 ? (
              <p className="text-xs text-gray-455 dark:text-gray-500 italic py-4 text-center">
                Chưa có học liệu nào được tải lên cho bài giảng này.
              </p>
            ) : (
              <div className="border border-gray-200 dark:border-gray-800 rounded-xl divide-y divide-gray-200 dark:divide-gray-800 overflow-hidden bg-white dark:bg-gray-900">
                {contents.map((c) => {
                  const isVideo = c.type === "video";
                  const Icon = isVideo ? Video : FileText;

                  return (
                    <div key={c.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-gray-50/40 dark:hover:bg-gray-800/10">
                      <div className="min-w-0 flex items-center gap-2.5">
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                          #{c.orderIndex}
                        </span>
                        <Icon size={16} className={isVideo ? "text-blue-500 shrink-0" : "text-emerald-500 shrink-0"} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate max-w-sm sm:max-w-md">
                            {c.title}
                          </p>
                          {isVideo && c.durationMinutes && (
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 font-medium">
                              Thời lượng: {c.durationMinutes} phút
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteContent(c.id)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400 hover:text-red-500 rounded-lg shrink-0"
                        title="Xóa học liệu"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-end">
          <button
            onClick={() => {
              onClose();
              window.location.reload(); // Reload page when closing to update player
            }}
            className="px-5 py-2 text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}
