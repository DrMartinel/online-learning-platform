"use client";

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MoreVertical, Loader2, BrainCircuit, Edit2, Trash2, X, Plus, UploadCloud, Video, FileText, BookOpen, AlertCircle, FilePlus
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';

interface Props {
  lesson: any;
  token: string;
  chapters?: any[];
}

interface ComponentItem {
  id: string;
  type: 'video' | 'document' | 'exam';
  title: string;
  file: File | null;
  examId: string;
  durationMinutes: number;
  orderIndex: number;
}

export default function LessonActionMenu({ lesson, token, chapters = [] }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Edit Lesson Modal States
  const [editOpen, setEditOpen] = useState(false);
  const [title, setTitle] = useState(lesson.title || '');
  const [content, setContent] = useState(lesson.content || '');
  const [orderIndex, setOrderIndex] = useState(lesson.orderIndex || 1);
  const [chapterId, setChapterId] = useState(lesson.chapterId || (chapters[0]?.id || ''));

  // Materials / Contents States
  const [contents, setContents] = useState<any[]>([]);
  const [loadingContents, setLoadingContents] = useState(false);
  const [exams, setExams] = useState<any[]>([]);
  const [newItems, setNewItems] = useState<ComponentItem[]>([]);

  useEffect(() => {
    if (editOpen) {
      fetchContents();
      fetchExams();
      setNewItems([]);
    }
  }, [editOpen, lesson.id]);

  const fetchContents = async () => {
    try {
      setLoadingContents(true);
      const res = await fetch(`/api/lessons/contents/lesson/${lesson.id}`);
      if (res.ok) {
        const data = await res.json();
        setContents(data.sort((a: any, b: any) => a.orderIndex - b.orderIndex));
      }
    } catch (err) {
      console.error("Lỗi khi tải học liệu:", err);
    } finally {
      setLoadingContents(false);
    }
  };

  const fetchExams = async () => {
    try {
      const res = await fetch('/api/admin/exams');
      if (res.ok) {
        const data = await res.json();
        setExams(data);
      }
    } catch (err) {
      console.error('Failed to fetch exams:', err);
    }
  };

  const handleAddNewItem = (type: 'video' | 'document' | 'exam') => {
    const defaultTitle = 
      type === 'video' ? 'Video bài giảng' : 
      type === 'document' ? 'Tài liệu học tập' : 'Đề thi trắc nghiệm';

    setNewItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        type,
        title: defaultTitle,
        file: null,
        examId: exams[0]?.id || '',
        durationMinutes: 10,
        orderIndex: contents.length + prev.length + 1,
      },
    ]);
  };

  const handleRemoveNewItem = (id: string) => {
    setNewItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateNewItem = (id: string, fields: Partial<ComponentItem>) => {
    setNewItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...fields } : item)));
  };

  const handleDeleteExistingContent = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa học liệu này? Phục hồi không khả thi.")) return;

    try {
      const res = await fetch(`/api/lessons/contents/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Lỗi khi xóa học liệu");
      setContents((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Đã xảy ra lỗi");
    }
  };

  const ingestLesson = () => {
    setIsOpen(false);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/rag/ingest/lesson/${lesson.id}`, {
          method: 'POST',
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || 'Đồng bộ bài học với AI thất bại');
        }
        alert('Bắt đầu đồng bộ thành công! Cơ sở tri thức AI đang được cập nhật.');
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
      }
    });
  };

  const deleteLesson = () => {
    if (!confirm(`Bạn có chắc chắn muốn xóa bài học "${lesson.title}" không? Hành động này không thể hoàn tác.`)) return;
    setIsOpen(false);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/lessons/${lesson.id}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || 'Xóa bài học thất bại');
        }
        router.refresh();
        window.location.reload();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
      }
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isPending) return;

    if (!chapterId) {
      alert('Bài học bắt buộc phải thuộc về một chương. Vui lòng chọn chương học.');
      return;
    }

    startTransition(async () => {
      try {
        // 1. Update lesson meta info
        const res = await fetch(`/api/lessons/${lesson.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            content: content.trim() || null,
            orderIndex: Number(orderIndex),
            chapterId: chapterId,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || 'Cập nhật bài học thất bại');
        }

        // 2. Upload files and create contents
        const supabase = getSupabaseClient(token);
        for (const item of newItems) {
          let urlPath = '';

          if (item.type === 'video' || item.type === 'document') {
            if (!item.file) {
              throw new Error(`Vui lòng chọn tệp tin cho thành phần "${item.title}"`);
            }
            const fileExt = item.file.name.split('.').pop();
            const folder = item.type === 'video' ? 'videos' : 'documents';
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
            urlPath = `${folder}/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('course-media')
              .upload(urlPath, item.file);

            if (uploadError) {
              throw new Error(`Tải tệp "${item.file.name}" thất bại: ${uploadError.message}`);
            }
          } else if (item.type === 'exam') {
            if (!item.examId) {
              throw new Error(`Vui lòng chọn đề thi cho thành phần "${item.title}"`);
            }
            urlPath = item.examId;
          }

          // Create content entry
          const contentRes = await fetch('/api/lessons/contents', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              lessonId: lesson.id,
              type: item.type,
              title: item.title,
              url: urlPath,
              durationMinutes: item.type === 'video' ? item.durationMinutes : null,
              orderIndex: item.orderIndex
            })
          });

          if (!contentRes.ok) {
            const contentErr = await contentRes.json().catch(() => ({}));
            throw new Error(contentErr.error || `Không thể lưu thành phần "${item.title}"`);
          }
        }

        setEditOpen(false);
        router.refresh();
        window.location.reload();
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
        className="p-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-55 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-750 dark:hover:text-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
      >
        {isPending ? <Loader2 size={16} className="animate-spin text-gray-500" /> : <MoreVertical size={16} />}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
            
            {/* Edit Lesson */}
            <button 
              onClick={() => {
                setIsOpen(false);
                setEditOpen(true);
              }}
              className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 cursor-pointer"
            >
              <Edit2 size={14} className="text-primary shrink-0" /> 
              <span>Chỉnh sửa thông tin</span>
            </button>

            {/* Sync to AI Option */}
            <button 
              onClick={ingestLesson}
              className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 border-t border-gray-100 dark:border-gray-850 flex items-center gap-2 cursor-pointer"
            >
              <BrainCircuit size={14} className="text-primary shrink-0" /> 
              <span>Đồng bộ với AI</span>
            </button>

            {/* Delete Lesson */}
            <div className="h-px bg-gray-200 dark:bg-gray-800 my-1" />
            <button 
              onClick={deleteLesson}
              className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2 cursor-pointer"
            >
              <Trash2 size={14} className="shrink-0" /> 
              <span>Xóa bài học</span>
            </button>
          </div>
        </>
      )}

      {/* --- EDIT LESSON & MATERIALS MODAL --- */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-sm font-extrabold text-gray-950 dark:text-white flex items-center gap-2">
                <Edit2 size={18} className="text-primary" />
                Chỉnh sửa bài học & học liệu
              </h2>
              <button
                onClick={() => setEditOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-750 dark:hover:text-gray-200 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Title & Order Index */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-450 dark:text-gray-500 mb-1.5">
                    Tiêu đề bài học *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-850 px-4 py-2.5 text-gray-900 dark:text-white focus:border-primary outline-none"
                    placeholder="Nhập tiêu đề..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-450 dark:text-gray-500 mb-1.5">
                    Thứ tự hiển thị *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={orderIndex}
                    onChange={(e) => setOrderIndex(Number(e.target.value) || 1)}
                    className="w-full text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-850 px-4 py-2.5 text-gray-900 dark:text-white focus:border-primary outline-none"
                  />
                </div>
              </div>

              {/* Chapter Select */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-450 dark:text-gray-500 mb-1.5">
                  Chương học *
                </label>
                {chapters.length === 0 ? (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-450 border border-amber-200 dark:border-amber-900 rounded-xl text-xs">
                    Không tìm thấy chương học nào. Vui lòng tạo chương trước.
                  </div>
                ) : (
                  <select
                    value={chapterId}
                    onChange={(e) => setChapterId(e.target.value)}
                    className="w-full text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-850 px-4 py-2.5 text-gray-900 dark:text-white focus:border-primary outline-none"
                    required
                  >
                    {chapters.map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        {ch.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Description Content */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-450 dark:text-gray-500 mb-1.5">
                  Nội dung / Mô tả
                </label>
                <textarea
                  rows={3}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-850 px-4 py-2.5 text-gray-900 dark:text-white focus:border-primary outline-none resize-none"
                  placeholder="Viết nội dung bài giảng lý thuyết..."
                ></textarea>
              </div>

              {/* --- CURRENT ATTACHED MATERIALS --- */}
              <div className="border-t border-gray-200 dark:border-gray-800 pt-5 space-y-3">
                <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <FilePlus className="text-primary" size={16} />
                  Học liệu hiện tại
                </h3>

                {loadingContents ? (
                  <div className="flex justify-center items-center py-4 text-gray-400">
                    <Loader2 size={18} className="animate-spin mr-2" />
                    <span className="text-[11px] font-medium">Đang tải học liệu hiện có...</span>
                  </div>
                ) : contents.length === 0 ? (
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 italic py-2">
                    Bài giảng này chưa có học liệu đính kèm.
                  </p>
                ) : (
                  <div className="border border-gray-200 dark:border-gray-800 rounded-xl divide-y divide-gray-200 dark:divide-gray-800 overflow-hidden bg-gray-50/20 dark:bg-gray-900/40">
                    {contents.map((c) => {
                      const isVideo = c.type === 'video';
                      const isDoc = c.type === 'document';
                      const Icon = isVideo ? Video : isDoc ? FileText : BookOpen;

                      return (
                        <div key={c.id} className="p-3 flex items-center justify-between gap-3 hover:bg-gray-100/50 dark:hover:bg-gray-800/10">
                          <div className="min-w-0 flex items-center gap-2">
                            <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                              #{c.orderIndex}
                            </span>
                            <Icon size={14} className={isVideo ? "text-blue-500 shrink-0" : isDoc ? "text-emerald-500 shrink-0" : "text-amber-500 shrink-0"} />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate max-w-md">
                                {c.title}
                              </p>
                              {isVideo && c.durationMinutes && (
                                <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5 font-medium">
                                  Thời lượng: {c.durationMinutes} phút
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteExistingContent(c.id)}
                            className="p-1.5 hover:bg-gray-150 dark:hover:bg-gray-800 text-gray-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                            title="Xóa học liệu"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* --- ADD NEW ATTACHED MATERIALS --- */}
              <div className="border-t border-gray-200 dark:border-gray-800 pt-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <Plus className="text-primary" size={16} />
                      Thêm học liệu đính kèm mới
                    </h3>
                    <p className="text-[10px] text-gray-450 dark:text-gray-500 mt-0.5">Thêm các Videos, Tài liệu hoặc Đề thi trực tiếp vào bài học.</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddNewItem('video')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-[11px] font-bold hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all cursor-pointer"
                    >
                      <Video size={12} /> + Video
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddNewItem('document')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 text-[11px] font-bold hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all cursor-pointer"
                    >
                      <FileText size={12} /> + Tài liệu
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddNewItem('exam')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 text-[11px] font-bold hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-all cursor-pointer"
                    >
                      <BookOpen size={12} /> + Đề thi
                    </button>
                  </div>
                </div>

                {/* New items list */}
                {newItems.length > 0 && (
                  <div className="space-y-3">
                    {newItems.map((item, index) => {
                      const isVideo = item.type === 'video';
                      const isDoc = item.type === 'document';
                      const isExam = item.type === 'exam';

                      return (
                        <div 
                          key={item.id}
                          className={`p-4 rounded-2xl border transition-all relative overflow-hidden bg-white dark:bg-gray-900/40 shadow-xs flex flex-col gap-4 ${
                            isVideo ? 'border-blue-100 dark:border-blue-900/40' : 
                            isDoc ? 'border-emerald-100 dark:border-emerald-900/40' : 
                            'border-amber-100 dark:border-amber-900/40'
                          }`}
                        >
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                            isVideo ? 'bg-blue-500' : isDoc ? 'bg-emerald-500' : 'bg-amber-500'
                          }`} />

                          <div className="flex items-center justify-between gap-4">
                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                              isVideo ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-450' :
                              isDoc ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-450' :
                              'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-450'
                            }`}>
                              Mới #{index + 1} - {isVideo ? 'Video' : isDoc ? 'Tài liệu' : 'Đề thi'}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleRemoveNewItem(item.id)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                              title="Gỡ bỏ"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end pl-2">
                            {/* Title input */}
                            <div className="lg:col-span-2 space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                                Tiêu đề hiển thị *
                              </label>
                              <input
                                type="text"
                                value={item.title}
                                onChange={(e) => handleUpdateNewItem(item.id, { title: e.target.value })}
                                required
                                className="w-full text-xs rounded-lg border border-gray-250 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-1.5 text-gray-900 dark:text-white focus:border-primary outline-none"
                                placeholder="Nhập tiêu đề hiển thị..."
                              />
                            </div>

                            {/* Order index input */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                                Thứ tự
                              </label>
                              <input
                                type="number"
                                value={item.orderIndex}
                                onChange={(e) => handleUpdateNewItem(item.id, { orderIndex: parseInt(e.target.value) || 1 })}
                                required
                                min={1}
                                className="w-full text-xs rounded-lg border border-gray-250 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-1.5 text-gray-900 dark:text-white focus:border-primary outline-none"
                              />
                            </div>

                            {/* Video duration & file upload */}
                            {isVideo && (
                              <>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                                    Thời lượng (phút)
                                  </label>
                                  <input
                                    type="number"
                                    value={item.durationMinutes}
                                    onChange={(e) => handleUpdateNewItem(item.id, { durationMinutes: parseInt(e.target.value) || 0 })}
                                    min={1}
                                    required
                                    className="w-full text-xs rounded-lg border border-gray-250 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-1.5 text-gray-900 dark:text-white focus:border-primary outline-none"
                                  />
                                </div>

                                <div className="sm:col-span-2">
                                  <label className="flex items-center justify-center border-2 border-dashed border-blue-200 dark:border-blue-900/50 hover:bg-blue-50/20 dark:hover:bg-blue-950/10 rounded-xl px-4 py-1.5 cursor-pointer transition-colors text-xs font-semibold text-blue-600 dark:text-blue-400">
                                    <UploadCloud size={14} className="mr-1.5" />
                                    {item.file ? item.file.name : 'Chọn file Video bài giảng'}
                                    <input
                                      type="file"
                                      accept="video/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                          handleUpdateNewItem(item.id, { file: e.target.files[0] });
                                        }
                                      }}
                                      required={!item.file}
                                    />
                                  </label>
                                </div>
                              </>
                            )}

                            {/* Document upload */}
                            {isDoc && (
                              <div className="sm:col-span-3">
                                <label className="flex items-center justify-center border-2 border-dashed border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/10 rounded-xl px-4 py-1.5 cursor-pointer transition-colors text-xs font-semibold text-emerald-600 dark:text-emerald-450">
                                  <UploadCloud size={14} className="mr-1.5" />
                                  {item.file ? item.file.name : 'Chọn tài liệu đính kèm (PDF, DOCX, ZIP...)'}
                                  <input
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files.length > 0) {
                                        handleUpdateNewItem(item.id, { file: e.target.files[0] });
                                      }
                                    }}
                                    required={!item.file}
                                  />
                                </label>
                              </div>
                            )}

                            {/* Exam select */}
                            {isExam && (
                              <div className="sm:col-span-3 space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                                  Chọn đề thi từ danh sách *
                                </label>
                                <select
                                  value={item.examId}
                                  onChange={(e) => handleUpdateNewItem(item.id, { examId: e.target.value })}
                                  className="w-full text-xs rounded-lg border border-gray-250 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-1.5 text-gray-900 dark:text-white focus:border-primary outline-none"
                                  required
                                >
                                  {exams.length === 0 ? (
                                    <option value="">Chưa có đề thi nào trong hệ thống</option>
                                  ) : (
                                    exams.map((ex) => (
                                      <option key={ex.id} value={ex.id}>
                                        {ex.title} (ID: {ex.id.substring(0, 8).toUpperCase()})
                                      </option>
                                    ))
                                  )}
                                </select>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-150 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="px-4 py-2 text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-755 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || isPending || chapters.length === 0}
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
    </div>
  );
}
