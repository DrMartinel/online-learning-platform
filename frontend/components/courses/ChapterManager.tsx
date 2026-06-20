"use client";

import { useState, useTransition } from "react";
import { FolderPlus, Trash2, Edit2, Check, X, Loader2 } from "lucide-react";

interface Chapter {
  id: string;
  title: string;
  orderIndex: number;
}

interface ChapterManagerProps {
  courseId: string;
  initialChapters: Chapter[];
}

export default function ChapterManager({ courseId, initialChapters }: ChapterManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters);
  const [newTitle, setNewTitle] = useState("");
  const [newOrder, setNewOrder] = useState<number>(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingOrder, setEditingOrder] = useState<number>(1);
  const [isPending, startTransition] = useTransition();

  const handleAddChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    startTransition(async () => {
      try {
        const res = await fetch("/api/chapters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId,
            title: newTitle.trim(),
            orderIndex: newOrder,
          }),
        });

        if (!res.ok) throw new Error("Lỗi khi thêm chương học mới");
        
        const newChapter = await res.json();
        setChapters((prev) => [...prev, newChapter].sort((a, b) => a.orderIndex - b.orderIndex));
        setNewTitle("");
        setNewOrder((prev) => prev + 1);
        
        // Reload page to reflect changes in layout
        window.location.reload();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Đã xảy ra lỗi");
      }
    });
  };

  const handleStartEdit = (chapter: Chapter) => {
    setEditingId(chapter.id);
    setEditingTitle(chapter.title);
    setEditingOrder(chapter.orderIndex);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingTitle.trim()) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/chapters/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: editingTitle.trim(),
            orderIndex: editingOrder,
          }),
        });

        if (!res.ok) throw new Error("Lỗi khi cập nhật chương học");
        
        setChapters((prev) =>
          prev
            .map((c) => (c.id === id ? { ...c, title: editingTitle.trim(), orderIndex: editingOrder } : c))
            .sort((a, b) => a.orderIndex - b.orderIndex)
        );
        setEditingId(null);
        
        // Reload page to reflect changes
        window.location.reload();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Đã xảy ra lỗi");
      }
    });
  };

  const handleDeleteChapter = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa chương này? Việc này sẽ xóa toàn bộ bài học thuộc chương này!")) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/chapters/${id}`, {
          method: "DELETE",
        });

        if (!res.ok) throw new Error("Lỗi khi xóa chương học");
        
        setChapters((prev) => prev.filter((c) => c.id !== id));
        
        // Reload page to reflect changes
        window.location.reload();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Đã xảy ra lỗi");
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-250 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700/80 px-4 py-2 rounded-xl transition-all shadow-xs"
      >
        <FolderPlus size={16} />
        Quản lý chương
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-905 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-base font-extrabold text-gray-950 dark:text-white flex items-center gap-2">
                <FolderPlus size={18} className="text-primary" />
                Quản lý chương học
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Form to Add New Chapter */}
              <form onSubmit={handleAddChapter} className="bg-gray-50/50 dark:bg-gray-900/10 p-4 rounded-xl border border-gray-200 dark:border-gray-800/80 space-y-4">
                <h3 className="text-xs font-bold text-gray-900 dark:text-white">Thêm chương học mới</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Tiêu đề chương (ví dụ: Mệnh đề toán học)"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      required
                      className="w-full text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-850 px-4 py-2.5 text-gray-900 dark:text-white focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Thứ tự"
                      value={newOrder}
                      onChange={(e) => setNewOrder(parseInt(e.target.value) || 1)}
                      required
                      min={1}
                      className="w-full text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-850 px-4 py-2.5 text-gray-900 dark:text-white focus:border-primary outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-primary hover:bg-primary/95 text-white rounded-xl shadow-md transition-all disabled:opacity-50"
                  >
                    {isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                    Thêm chương
                  </button>
                </div>
              </form>

              {/* List of Chapters */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-900 dark:text-white">Danh sách chương học hiện tại</h3>
                {chapters.length === 0 ? (
                  <p className="text-xs text-gray-450 dark:text-gray-500 italic py-4 text-center">
                    Khóa học này chưa có chương học nào.
                  </p>
                ) : (
                  <div className="border border-gray-200 dark:border-gray-800 rounded-xl divide-y divide-gray-200 dark:divide-gray-800 overflow-hidden">
                    {chapters.map((ch) => {
                      const isEditing = editingId === ch.id;

                      return (
                        <div key={ch.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-gray-50/40 dark:hover:bg-gray-800/10">
                          {isEditing ? (
                            <div className="flex-1 flex gap-2">
                              <input
                                type="text"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                className="flex-1 text-xs rounded-lg border border-gray-300 dark:border-gray-750 bg-white dark:bg-gray-800 px-3 py-1.5 text-gray-900 dark:text-white focus:border-primary outline-none"
                              />
                              <input
                                type="number"
                                value={editingOrder}
                                onChange={(e) => setEditingOrder(parseInt(e.target.value) || 1)}
                                className="w-16 text-xs rounded-lg border border-gray-300 dark:border-gray-750 bg-white dark:bg-gray-800 px-2 py-1.5 text-gray-900 dark:text-white focus:border-primary outline-none"
                              />
                              <button
                                onClick={() => handleSaveEdit(ch.id)}
                                className="p-1.5 bg-emerald-55 hover:bg-emerald-60 transition-colors text-emerald-700 dark:text-emerald-400 rounded-lg"
                                title="Lưu thay đổi"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="p-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400 rounded-lg"
                                title="Hủy bỏ"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="min-w-0">
                                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md mr-2">
                                  #{ch.orderIndex}
                                </span>
                                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                  {ch.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => handleStartEdit(ch)}
                                  className="p-1.5 hover:bg-gray-150 dark:hover:bg-gray-800 transition-colors text-gray-500 hover:text-amber-500 rounded-lg"
                                  title="Chỉnh sửa tên/thứ tự"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteChapter(ch.id)}
                                  className="p-1.5 hover:bg-gray-150 dark:hover:bg-gray-800 transition-colors text-gray-500 hover:text-red-500 rounded-lg"
                                  title="Xóa chương"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </>
                          )}
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
                onClick={() => setIsOpen(false)}
                className="px-5 py-2 text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-750 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all"
              >
                Đóng
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
