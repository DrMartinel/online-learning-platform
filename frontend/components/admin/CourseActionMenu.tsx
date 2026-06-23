"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MoreVertical, Trash2, EyeOff, Eye, Loader2, BrainCircuit, 
  Edit2, UploadCloud, X, Image as ImageIcon 
} from 'lucide-react';
import { supabaseProxyClient } from '@/lib/supabase-proxy';
import ProgressModal from '@/components/ui/ProgressModal';

interface Props {
  courseId: string;
  isPublished: boolean;
  token: string;
  initialTitle: string;
  initialDescription?: string | null;
  initialPrice: number;
  initialThumbnailUrl?: string | null;
}

export default function CourseActionMenu({ 
  courseId, 
  isPublished, 
  token,
  initialTitle,
  initialDescription,
  initialPrice,
  initialThumbnailUrl 
}: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Edit Course Modal States
  const [editOpen, setEditOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription || '');
  const [price, setPrice] = useState(initialPrice);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  // Sync Modal State
  const [syncModalOpen, setSyncModalOpen] = useState(false);

  const toggleStatus = () => {
    setIsOpen(false);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/courses/${courseId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPublished: !isPublished }),
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || 'Cập nhật trạng thái khóa học thất bại');
        }
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
      }
    });
  };

  const ingestCourse = () => {
    setIsOpen(false);
    setSyncModalOpen(true);
  };

  const deleteCourse = () => {
    if (!confirm('Bạn có chắc chắn muốn xóa khóa học này không? Hành động này không thể hoàn tác.')) return;
    setIsOpen(false);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/courses/${courseId}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || 'Xóa khóa học thất bại');
        }
        router.refresh();
        router.push('/courses');
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
      }
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isPending) return;

    startTransition(async () => {
      try {
        let filePath = initialThumbnailUrl || '';

        // Upload new thumbnail if provided
        if (thumbnailFile) {
          const fileExt = thumbnailFile.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
          const uploadPath = `thumbnails/${fileName}`;

          await supabaseProxyClient.uploadObjectWithFormData('course-media', uploadPath, thumbnailFile, token);
          filePath = uploadPath;
        }

        // Call PUT /api/courses/${courseId} to save details
        const res = await fetch(`/api/courses/${courseId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || null,
            price: Number(price),
            thumbnailUrl: filePath || null
          }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || 'Cập nhật thông tin khóa học thất bại');
        }

        setEditOpen(false);
        setThumbnailFile(null);
        router.refresh();
        window.location.reload(); // Reload to refresh signed media URLs
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
      }
    });
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 cursor-pointer"
      >
        {isPending ? <Loader2 size={16} className="animate-spin text-gray-500" /> : <MoreVertical size={16} className="text-gray-500" />}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
            {/* Edit Course Option */}
            <button 
              onClick={() => {
                setIsOpen(false);
                setEditOpen(true);
              }}
              className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 cursor-pointer"
            >
              <Edit2 size={14} className="text-primary shrink-0" /> Chỉnh sửa khóa học
            </button>

            {/* Toggle Status Option */}
            <button 
              onClick={toggleStatus}
              className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 border-t border-gray-100 dark:border-gray-850 cursor-pointer"
            >
              {isPublished ? (
                <><EyeOff size={14} className="text-amber-500 shrink-0" /> Hủy xuất bản</>
              ) : (
                <><Eye size={14} className="text-emerald-500 shrink-0" /> Xuất bản khóa học</>
              )}
            </button>

            {/* Sync AI Option */}
            <button 
              onClick={ingestCourse}
              className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 border-t border-gray-100 dark:border-gray-850 cursor-pointer"
            >
              <BrainCircuit size={14} className="text-primary shrink-0" /> Đồng bộ dữ liệu AI
            </button>

            {/* Delete Option */}
            <div className="h-px bg-gray-200 dark:bg-gray-800 my-1" />
            <button 
              onClick={deleteCourse}
              className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2 cursor-pointer"
            >
              <Trash2 size={14} className="shrink-0" /> Xóa khóa học
            </button>
          </div>
        </>
      )}

      {/* --- EDIT COURSE DETAILS MODAL (GLASSMORPHISM) --- */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-base font-extrabold text-gray-950 dark:text-white flex items-center gap-2">
                <Edit2 size={18} className="text-primary" />
                Chỉnh sửa thông tin khóa học
              </h2>
              <button
                onClick={() => setEditOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
                  Tiêu đề khóa học *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:border-primary outline-none"
                  placeholder="Nhập tiêu đề khóa học..."
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
                  Mô tả khóa học
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:border-primary outline-none resize-none"
                  placeholder="Giới thiệu sơ lược về nội dung khóa học..."
                ></textarea>
              </div>

              {/* Price */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
                  Giá khóa học (VNĐ) <span className="text-[10px] text-gray-400 font-normal normal-case">(Nhập 0 nếu miễn phí)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value) || 0)}
                    className="w-full text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 pr-12 text-gray-900 dark:text-white focus:border-primary outline-none"
                    placeholder="Ví dụ: 200000"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs font-bold text-gray-400 select-none pointer-events-none">
                    VNĐ
                  </div>
                </div>
              </div>

              {/* Thumbnail Image upload */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                  Ảnh bìa khóa học mới (Tùy chọn)
                </label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-700 border-dashed rounded-xl cursor-pointer bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-4 pb-4 px-4 text-center">
                    {thumbnailFile ? (
                      <>
                        <ImageIcon className="w-8 h-8 text-primary mb-2" />
                        <p className="text-xs font-bold text-gray-800 dark:text-white truncate max-w-xs">{thumbnailFile.name}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {(thumbnailFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          <span className="font-bold text-primary">Nhấn để thay đổi ảnh bìa</span>
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">SVG, PNG, JPG hoặc GIF</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setThumbnailFile(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-150 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => {
                    setEditOpen(false);
                    setThumbnailFile(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || isPending}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-primary hover:bg-primary/95 text-white rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? <Loader2 size={12} className="animate-spin" /> : null}
                  Lưu thay đổi
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* --- SYNC PROGRESS MODAL --- */}
      <ProgressModal
        isOpen={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
        title="Đồng bộ khóa học với AI"
        description={`Đang phân tích và đồng bộ nội dung của khóa học "${title}" vào cơ sở tri thức...`}
        streamUrl={`/api/rag/ingest/course/${courseId}/stream`}
        onSuccess={() => {
          // Could refresh if needed, but usually not required for RAG sync
        }}
      />
    </div>
  );
}
