'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import {
  Loader2,
  UploadCloud,
  Video,
  FileText,
  Link as LinkIcon,
  Trash2,
  Plus,
  Save,
  ChevronLeft
} from 'lucide-react';
import Link from 'next/link';

interface Chapter {
  id: string;
  title: string;
}

interface MediaItemInput {
  title: string;
  type: 'video' | 'document' | 'link';
  file?: File;
  url?: string;
  isUploading?: boolean;
}

export default function CreateLessonForm({ courseId, token }: { courseId: string; token: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialChapterId = searchParams.get('chapterId') || '';

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState(initialChapterId);
  const [loading, setLoading] = useState(false);
  const [loadingChapters, setLoadingChapters] = useState(true);
  const [error, setError] = useState('');

  // Form Fields
  const [title, setTitle] = useState('');
  const [orderIndex, setOrderIndex] = useState(0);
  const [content, setContent] = useState('');

  // Multiple Media Attachments State
  const [attachments, setAttachments] = useState<MediaItemInput[]>([]);

  const supabase = getSupabaseClient(token);

  // Load chapters to let them choose
  useEffect(() => {
    const fetchChapters = async () => {
      try {
        await supabase.auth.setSession({ access_token: token, refresh_token: '' });
        const { data, error } = await supabase
          .from('chapters')
          .select('id, title')
          .eq('course_id', courseId)
          .order('order_index', { ascending: true });

        if (error) throw error;
        const loaded = data || [];
        setChapters(loaded);
        if (loaded.length > 0 && !selectedChapterId) {
          setSelectedChapterId(loaded[0].id);
        }
      } catch (err) {
        console.error('Failed to load chapters for lesson form:', err);
      } finally {
        setLoadingChapters(false);
      }
    };
    fetchChapters();
  }, [courseId, token]);

  const addAttachmentRow = (type: 'video' | 'document' | 'link') => {
    setAttachments(prev => [
      ...prev,
      { title: '', type, url: '' }
    ]);
  };

  const removeAttachmentRow = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const updateAttachment = (index: number, key: keyof MediaItemInput, value: any) => {
    setAttachments(prev => prev.map((item, i) => {
      if (i === index) {
        return { ...item, [key]: value };
      }
      return item;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChapterId) {
      setError('Vui lòng chọn hoặc tạo ít nhất một chương học trước.');
      return;
    }
    if (!title.trim()) {
      setError('Tiêu đề bài học là bắt buộc.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await supabase.auth.setSession({ access_token: token, refresh_token: '' });

      // 1. Create the lesson
      const { data: newLesson, error: lessonError } = await supabase
        .from('lessons')
        .insert({
          course_id: courseId,
          chapter_id: selectedChapterId,
          title: title.trim(),
          content: content.trim() || null,
          order_index: orderIndex
        })
        .select()
        .single();

      if (lessonError) throw lessonError;

      // 2. Handle attachments
      if (attachments.length > 0) {
        for (let i = 0; i < attachments.length; i++) {
          const item = attachments[i];
          let finalUrl = item.url || '';

          // If a file is uploaded, upload to Supabase storage
          if (item.file) {
            updateAttachment(i, 'isUploading', true);
            const fileExt = item.file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
            const folder = item.type === 'video' ? 'videos' : 'documents';
            const filePath = `${folder}/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('course-media')
              .upload(filePath, item.file);

            if (uploadError) throw new Error(`Tải file thất bại: ${uploadError.message}`);
            finalUrl = filePath;
            updateAttachment(i, 'isUploading', false);
          }

          // Insert into public.lesson_media table
          if (finalUrl) {
            const { error: mediaError } = await supabase.from('lesson_media').insert({
              lesson_id: newLesson.id,
              title: item.title.trim() || item.file?.name || 'Tài liệu bổ trợ',
              type: item.type,
              url: finalUrl,
              order_index: i
            });
            if (mediaError) throw mediaError;
          }
        }
      }

      router.push(`/courses/${courseId}/edit`);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Có lỗi xảy ra khi tạo bài học.');
      setLoading(false);
    }
  };

  if (loadingChapters) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-xs">Đang tải danh sách chương học...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 text-red-650 dark:text-red-400 rounded-2xl text-sm border border-red-100 dark:border-red-900/50">
          {error}
        </div>
      )}

      {/* Chapter Selection */}
      <div>
        <label htmlFor="chapter" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Thuộc chương học <span className="text-red-500">*</span>
        </label>
        {chapters.length === 0 ? (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-xs text-amber-600">
            Khóa học hiện chưa có chương nào. Bạn cần vào cấu hình trang chỉnh sửa khóa học để thêm ít nhất 1 chương học trước khi tạo bài giảng.
          </div>
        ) : (
          <select
            id="chapter"
            value={selectedChapterId}
            onChange={(e) => setSelectedChapterId(e.target.value)}
            className="w-full rounded-xl border border-gray-300 dark:border-gray-750 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
          >
            {chapters.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        )}
      </div>

      {/* Lesson Title & Order */}
      <div className="grid sm:grid-cols-4 gap-4">
        <div className="sm:col-span-3">
          <label htmlFor="title" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Tiêu đề bài học <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            placeholder="Nhập tiêu đề bài giảng..."
          />
        </div>
        <div className="sm:col-span-1">
          <label htmlFor="orderIndex" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Thứ tự bài học
          </label>
          <input
            type="number"
            id="orderIndex"
            required
            min={0}
            value={orderIndex}
            onChange={(e) => setOrderIndex(parseInt(e.target.value) || 0)}
            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-center"
          />
        </div>
      </div>

      {/* Content Textarea */}
      <div>
        <label htmlFor="content" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
          Nội dung văn bản (Quiz/Ghi chú học tập)
        </label>
        <textarea
          id="content"
          rows={5}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
          placeholder="Nhập các ghi chú, bài tập hoặc mã code hướng dẫn học tập..."
        ></textarea>
      </div>

      {/* Multiple Media Assets Section */}
      <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Video & Tài liệu học tập</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Bài giảng này có thể tải lên nhiều video, tài liệu hỗ trợ hoặc đường link hữu ích.</p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => addAttachmentRow('video')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-bold text-xs hover:bg-blue-100/60 transition-all"
            >
              <Video size={12} />
              + Video
            </button>
            <button
              type="button"
              onClick={() => addAttachmentRow('document')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs hover:bg-emerald-100/60 transition-all"
            >
              <FileText size={12} />
              + Tài liệu PDF
            </button>
            <button
              type="button"
              onClick={() => addAttachmentRow('link')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 font-bold text-xs hover:bg-amber-100/60 transition-all"
            >
              <LinkIcon size={12} />
              + Link ngoài
            </button>
          </div>
        </div>

        {attachments.length === 0 ? (
          <div className="text-center py-8 rounded-2xl bg-gray-50/40 dark:bg-gray-900/10 border border-gray-200 dark:border-gray-800 text-gray-400 text-xs italic">
            Chưa có tài liệu hoặc video nào được thêm. Hãy chọn các nút ở trên để tạo tài nguyên bài học.
          </div>
        ) : (
          <div className="space-y-4">
            {attachments.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/20 dark:bg-gray-900/10 space-y-3 relative group"
              >
                <button
                  type="button"
                  onClick={() => removeAttachmentRow(idx)}
                  className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                  title="Xóa tài nguyên"
                >
                  <Trash2 size={14} />
                </button>

                <div className="grid sm:grid-cols-2 gap-3 pr-8">
                  {/* Title of Attachment */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      Tên tài nguyên
                    </label>
                    <input
                      type="text"
                      required
                      value={item.title}
                      onChange={(e) => updateAttachment(idx, 'title', e.target.value)}
                      placeholder={item.type === 'video' ? 'VD: Video bài giảng chi tiết' : 'VD: Slide bài học PDF / Link GitHub'}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 focus:border-primary outline-none"
                    />
                  </div>

                  {/* Attachment source upload or URL */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      {item.type === 'link' ? 'Địa chỉ liên kết' : 'Tệp đính kèm'}
                    </label>
                    {item.type === 'link' ? (
                      <input
                        type="url"
                        required
                        value={item.url}
                        onChange={(e) => updateAttachment(idx, 'url', e.target.value)}
                        placeholder="https://example.com/slide"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 focus:border-primary outline-none"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <label className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-750 bg-white dark:bg-gray-950 text-xs text-gray-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                          <span className="truncate max-w-[180px] font-semibold">
                            {item.file ? item.file.name : 'Chọn tệp tải lên...'}
                          </span>
                          <UploadCloud size={14} className="text-gray-400" />
                          <input
                            type="file"
                            required={!item.file}
                            accept={item.type === 'video' ? 'video/*' : '*'}
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files.length > 0) {
                                updateAttachment(idx, 'file', e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action footer */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
        <Link
          href={`/courses/${courseId}/edit`}
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl border border-gray-300 dark:border-gray-750 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
        >
          Hủy
        </Link>
        <button
          type="submit"
          disabled={loading || chapters.length === 0}
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark shadow-md active:scale-97 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Đang tạo bài học...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Lưu bài giảng
            </>
          )
          }
        </button >
      </div >
    </form >
  );
}
