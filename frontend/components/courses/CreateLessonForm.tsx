'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseProxyClient } from '@/lib/supabase-proxy';
import { createLessonAction } from '@/app/actions/lessons';
import { 
  Loader2, UploadCloud, Video, FileText, Trash2, Plus, 
  HelpCircle, BookOpen, AlertCircle, FilePlus
} from 'lucide-react';

interface Props {
  courseId: string;
  token: string;
  defaultChapterId?: string;
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

export default function CreateLessonForm({ courseId, token, defaultChapterId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Data States
  const [chapters, setChapters] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState(defaultChapterId || '');

  // Dynamic Components State
  const [items, setItems] = useState<ComponentItem[]>([]);

  const [uploadProgress, setUploadProgress] = useState<{ title: string; percent: number } | null>(null);

  // Fetch Chapters
  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const res = await fetch(`/api/chapters/course/${courseId}`);
        if (res.ok) {
          const data = await res.json();
          setChapters(data);
          // Set default chapter if not set
          if (!selectedChapterId && data.length > 0) {
            setSelectedChapterId(data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch chapters:', err);
      }
    };
    fetchChapters();
  }, [courseId]);

  // Fetch Exams
  useEffect(() => {
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
    fetchExams();
  }, []);

  const handleAddItem = (type: 'video' | 'document' | 'exam') => {
    const defaultTitle = 
      type === 'video' ? 'Video bài giảng' : 
      type === 'document' ? 'Tài liệu học tập' : 'Đề thi trắc nghiệm';

    setItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        type,
        title: defaultTitle,
        file: null,
        examId: exams[0]?.id || '',
        durationMinutes: 10,
        orderIndex: prev.length + 1,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateItem = (id: string, fields: Partial<ComponentItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...fields } : item)));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selectedChapterId || selectedChapterId === 'unassigned') {
      setError('Bài học bắt buộc phải thuộc về một chương. Vui lòng chọn chương học.');
      return;
    }

    setLoading(true);
    setUploadProgress(null);
    setError('');

    try {
      const formData = new FormData(e.currentTarget);
      const title = formData.get('title') as string;
      const orderIndex = parseInt(formData.get('orderIndex') as string || '1', 10);
      const content = formData.get('content') as string;

      // 1. Create the base lesson
      const lessonFormData = new FormData();
      lessonFormData.set('title', title);
      lessonFormData.set('chapterId', selectedChapterId);
      lessonFormData.set('orderIndex', orderIndex.toString());
      lessonFormData.set('content', content || '');

      const newLesson = await createLessonAction(courseId, lessonFormData);
      const lessonId = newLesson.id;

      // 2. Upload files and create lesson contents in database
      for (const item of items) {
        let urlPath = '';

        if (item.type === 'video' || item.type === 'document') {
          if (!item.file) {
            throw new Error(`Vui lòng chọn tệp tin cho thành phần "${item.title}"`);
          }
          const fileExt = item.file.name.split('.').pop();
          const folder = item.type === 'video' ? 'videos' : 'documents';
          const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
          urlPath = `${folder}/${fileName}`;

          try {
            if (item.type === 'video' || item.file.size > 50 * 1024 * 1024) {
              await supabaseProxyClient.uploadVideoResumable(
                'course-media', 
                urlPath, 
                item.file, 
                token,
                (uploaded, total) => {
                  setUploadProgress({ title: item.title, percent: Math.round((uploaded / total) * 100) });
                }
              );
            } else {
              setUploadProgress({ title: item.title, percent: 100 });
              await supabaseProxyClient.uploadObjectWithFormData('course-media', urlPath, item.file, token);
            }
          } catch (uploadError: any) {
            throw new Error(`Tải tệp "${item.file.name}" thất bại: ${uploadError.message || String(uploadError)}`);
          }
        } else if (item.type === 'exam') {
          if (!item.examId) {
            throw new Error(`Vui lòng chọn đề thi cho thành phần "${item.title}"`);
          }
          urlPath = item.examId; // For exams, we store the exam UUID in the url field
        }

        // Create content in backend
        const contentRes = await fetch('/api/lessons/contents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            lessonId,
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

      // Success - Redirect back to course detail page
      router.push(`/courses/${courseId}`);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Đã xảy ra lỗi khi tạo bài học.');
      setLoading(false);
      setUploadProgress(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-sm border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400 flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Title */}
        <div className="md:col-span-2">
          <label htmlFor="title" className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
            Tiêu đề bài học <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            id="title"
            required
            className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2.5 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm"
            placeholder="Nhập tiêu đề bài học..."
          />
        </div>

        {/* Order Index */}
        <div>
          <label htmlFor="orderIndex" className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
            Thứ tự hiển thị <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="orderIndex"
            id="orderIndex"
            required
            min={1}
            defaultValue={1}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2.5 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm"
          />
        </div>
      </div>

      {/* Chapter Dropdown */}
      <div>
        <label htmlFor="chapterId" className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
          Thuộc chương học <span className="text-red-500">*</span>
        </label>
        {chapters.length === 0 ? (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle size={16} />
            <span>Khóa học chưa có chương học nào. Vui lòng tạo chương học trước khi thêm bài học.</span>
          </div>
        ) : (
          <select
            name="chapterId"
            id="chapterId"
            value={selectedChapterId}
            onChange={(e) => setSelectedChapterId(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2.5 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm"
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
        <label htmlFor="content" className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
          Nội dung / Mô tả bài học
        </label>
        <textarea
          name="content"
          id="content"
          rows={4}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2.5 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all resize-none text-sm"
          placeholder="Giới thiệu sơ lược hoặc ghi chú bài học..."
        ></textarea>
      </div>

      {/* --- DYNAMIC COMPONENTS SECTION --- */}
      <div className="border-t border-gray-200 dark:border-gray-800 pt-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
              <FilePlus className="text-primary" size={18} />
              Thành phần học liệu đính kèm
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500">Bài học có thể đính kèm nhiều Video, Tài liệu hoặc Đề thi khác nhau.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleAddItem('video')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all cursor-pointer shadow-xs"
            >
              <Video size={13} /> + Video
            </button>
            <button
              type="button"
              onClick={() => handleAddItem('document')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 text-xs font-bold hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all cursor-pointer shadow-xs"
            >
              <FileText size={13} /> + Tài liệu
            </button>
            <button
              type="button"
              onClick={() => handleAddItem('exam')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 text-xs font-bold hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-all cursor-pointer shadow-xs"
            >
              <BookOpen size={13} /> + Đề thi
            </button>
          </div>
        </div>

        {/* Components List */}
        {items.length === 0 ? (
          <div className="border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl py-8 text-center bg-gray-50/30 dark:bg-gray-900/10">
            <p className="text-xs text-gray-400 dark:text-gray-500 italic">Chưa có thành phần học liệu nào. Hãy bấm các nút phía trên để thêm.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => {
              const isVideo = item.type === 'video';
              const isDocument = item.type === 'document';
              const isExam = item.type === 'exam';

              return (
                <div 
                  key={item.id} 
                  className={`p-4 rounded-2xl border transition-all relative overflow-hidden bg-white dark:bg-gray-900/40 shadow-xs flex flex-col gap-4 ${
                    isVideo ? 'border-blue-100 dark:border-blue-900/40' : 
                    isDocument ? 'border-emerald-100 dark:border-emerald-900/40' : 
                    'border-amber-100 dark:border-amber-900/40'
                  }`}
                >
                  {/* Left Color Indicator Badge */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                    isVideo ? 'bg-blue-500' : isDocument ? 'bg-emerald-500' : 'bg-amber-500'
                  }`} />

                  {/* Component Header */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        isVideo ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' :
                        isDocument ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' :
                        'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                      }`}>
                        #{index + 1} - {isVideo ? 'Video' : isDocument ? 'Tài liệu' : 'Đề thi'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                      title="Gỡ bỏ"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Component Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end pl-2">
                    {/* Title */}
                    <div className="lg:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                        Tiêu đề hiển thị *
                      </label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => handleUpdateItem(item.id, { title: e.target.value })}
                        required
                        className="w-full text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3.5 py-2 text-gray-900 dark:text-white focus:border-primary outline-none"
                        placeholder="Ví dụ: Video bài học lý thuyết"
                      />
                    </div>

                    {/* Order Index */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                        Thứ tự
                      </label>
                      <input
                        type="number"
                        value={item.orderIndex}
                        onChange={(e) => handleUpdateItem(item.id, { orderIndex: parseInt(e.target.value) || 1 })}
                        required
                        min={1}
                        className="w-full text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3.5 py-2 text-gray-900 dark:text-white focus:border-primary outline-none"
                      />
                    </div>

                    {/* Specific Inputs per Type */}
                    {isVideo && (
                      <>
                        {/* Video Duration */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                            Thời lượng (phút)
                          </label>
                          <input
                            type="number"
                            value={item.durationMinutes}
                            onChange={(e) => handleUpdateItem(item.id, { durationMinutes: parseInt(e.target.value) || 0 })}
                            min={1}
                            required
                            className="w-full text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3.5 py-2 text-gray-900 dark:text-white focus:border-primary outline-none"
                          />
                        </div>

                        {/* Video File Upload */}
                        <div className="sm:col-span-2">
                          <label className="flex items-center justify-center border-2 border-dashed border-blue-200 dark:border-blue-900/50 hover:bg-blue-50/20 dark:hover:bg-blue-950/10 rounded-xl px-4 py-2 cursor-pointer transition-colors text-xs font-semibold text-blue-600 dark:text-blue-400">
                            <UploadCloud size={14} className="mr-2" />
                            {item.file ? item.file.name : 'Chọn file Video bài giảng (MP4, WebM)'}
                            <input
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                  handleUpdateItem(item.id, { file: e.target.files[0] });
                                }
                              }}
                              required={!item.file}
                            />
                          </label>
                        </div>
                      </>
                    )}

                    {isDocument && (
                      <div className="sm:col-span-3">
                        <label className="flex items-center justify-center border-2 border-dashed border-emerald-250 dark:border-emerald-900/50 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/10 rounded-xl px-4 py-2 cursor-pointer transition-colors text-xs font-semibold text-emerald-600 dark:text-emerald-450">
                          <UploadCloud size={14} className="mr-2" />
                          {item.file ? item.file.name : 'Chọn tài liệu đính kèm (PDF, DOCX, ZIP,...)'}
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files.length > 0) {
                                handleUpdateItem(item.id, { file: e.target.files[0] });
                              }
                            }}
                            required={!item.file}
                          />
                        </label>
                      </div>
                    )}

                    {isExam && (
                      <div className="sm:col-span-3 space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                          Chọn đề thi học lực *
                        </label>
                        <select
                          value={item.examId}
                          onChange={(e) => handleUpdateItem(item.id, { examId: e.target.value })}
                          className="w-full text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3.5 py-2 text-gray-900 dark:text-white focus:border-primary outline-none"
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

      {/* Form Submission Actions */}
      <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push(`/courses/${courseId}`)}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-300 font-bold text-xs transition-colors cursor-pointer"
        >
          Hủy bỏ
        </button>
        <button
          type="submit"
          disabled={loading || chapters.length === 0}
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/95 shadow-lg shadow-primary/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[180px] relative overflow-hidden"
        >
          {loading ? (
            uploadProgress ? (
              <div className="absolute inset-0 w-full h-full bg-primary/80 flex items-center justify-center">
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-white/20 transition-all duration-300"
                  style={{ width: `${uploadProgress.percent}%` }}
                />
                <span className="relative z-10 flex items-center drop-shadow-md">
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  {uploadProgress.percent}% - {uploadProgress.title}
                </span>
              </div>
            ) : (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                Đang xử lý...
              </>
            )
          ) : (
            'Tạo bài học'
          )}
        </button>
      </div>
    </form>
  );
}
