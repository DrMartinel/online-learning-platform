'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { 
  FolderPlus, 
  Plus, 
  Pencil, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  FileText, 
  PlayCircle, 
  Link as LinkIcon,
  Video,
  GripVertical
} from 'lucide-react';
import Link from 'next/link';

interface Chapter {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
}

interface Lesson {
  id: string;
  chapter_id: string;
  title: string;
  content?: string | null;
  video_url?: string | null; // fallback for old schema
  order_index: number;
}

interface LessonMedia {
  id: string;
  lesson_id: string;
  title: string;
  type: 'video' | 'document' | 'link';
  url: string;
  order_index: number;
}

export default function CurriculumManager({ courseId, token }: { courseId: string; token: string }) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [mediaList, setMediaList] = useState<LessonMedia[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [addingChapter, setAddingChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editingChapterTitle, setEditingChapterTitle] = useState('');
  const [collapsedChapters, setCollapsedChapters] = useState<Record<string, boolean>>({});

  const supabase = getSupabaseClient(token);

  // Load curriculum data
  const loadData = async () => {
    setLoading(true);
    try {
      await supabase.auth.setSession({ access_token: token, refresh_token: '' });

      // 1. Fetch chapters
      const { data: chData, error: chErr } = await supabase
        .from('chapters')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });
        
      if (chErr) throw chErr;
      const loadedChapters = chData || [];
      setChapters(loadedChapters);

      if (loadedChapters.length > 0) {
        const chapterIds = loadedChapters.map(c => c.id);

        // 2. Fetch lessons in these chapters
        const { data: lesData, error: lesErr } = await supabase
          .from('lessons')
          .select('*')
          .in('chapter_id', chapterIds)
          .order('order_index', { ascending: true });

        if (lesErr) throw lesErr;
        const loadedLessons = lesData || [];
        setLessons(loadedLessons);

        if (loadedLessons.length > 0) {
          const lessonIds = loadedLessons.map(l => l.id);

          // 3. Fetch all media for these lessons
          const { data: medData, error: medErr } = await supabase
            .from('lesson_media')
            .select('*')
            .in('lesson_id', lessonIds)
            .order('order_index', { ascending: true });

          if (!medErr && medData) {
            setMediaList(medData);
          }
        }
      }
    } catch (e) {
      console.error('Lỗi khi tải giáo trình phân tầng:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [courseId, token]);

  const handleAddChapter = async () => {
    if (!newChapterTitle.trim()) return;
    try {
      await supabase.auth.setSession({ access_token: token, refresh_token: '' });
      const orderIndex = chapters.length;
      const { error } = await supabase.from('chapters').insert({
        course_id: courseId,
        title: newChapterTitle.trim(),
        order_index: orderIndex
      });

      if (error) throw error;
      setNewChapterTitle('');
      setAddingChapter(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      alert('Không thể tạo chương học mới: ' + (err.message || String(err)));
    }
  };

  const handleUpdateChapter = async (id: string) => {
    if (!editingChapterTitle.trim()) return;
    try {
      await supabase.auth.setSession({ access_token: token, refresh_token: '' });
      const { error } = await supabase
        .from('chapters')
        .update({ title: editingChapterTitle.trim() })
        .eq('id', id);

      if (error) throw error;
      setEditingChapterId(null);
      loadData();
    } catch (err: any) {
      console.error(err);
      alert('Không thể cập nhật chương học: ' + (err.message || String(err)));
    }
  };

  const handleDeleteChapter = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa chương "${title}"? Tất cả bài giảng và tài liệu bên trong sẽ bị xóa vĩnh viễn.`)) return;
    try {
      await supabase.auth.setSession({ access_token: token, refresh_token: '' });
      const { error } = await supabase.from('chapters').delete().eq('id', id);
      if (error) throw error;
      loadData();
    } catch (err: any) {
      console.error(err);
      alert('Lỗi xảy ra khi xóa chương: ' + (err.message || String(err)));
    }
  };

  const handleDeleteLesson = async (id: string, title: string) => {
    if (!confirm(`Xóa bài học "${title}"?`)) return;
    try {
      await supabase.auth.setSession({ access_token: token, refresh_token: '' });
      const { error } = await supabase.from('lessons').delete().eq('id', id);
      if (error) throw error;
      loadData();
    } catch (err: any) {
      console.error(err);
      alert('Lỗi khi xóa bài học: ' + (err.message || String(err)));
    }
  };

  const toggleCollapse = (id: string) => {
    setCollapsedChapters(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-xs">Đang tải cấu trúc giáo trình...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* List of chapters */}
      {chapters.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
          <FolderPlus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Chưa có chương học nào</h4>
          <p className="text-xs text-gray-500 mt-1 mb-4">Khóa học này cần ít nhất một chương để bắt đầu thêm bài học.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {chapters.map((chapter, chIdx) => {
            const chLessons = lessons.filter(l => l.chapter_id === chapter.id);
            const isCollapsed = collapsedChapters[chapter.id];

            return (
              <div 
                key={chapter.id} 
                className="bg-gray-50/60 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow transition-all"
              >
                {/* Chapter Header */}
                <div className="px-5 py-4 flex items-center justify-between gap-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 group/chapter">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button 
                      onClick={() => toggleCollapse(chapter.id)}
                      className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 shrink-0"
                    >
                      {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    </button>
                    
                    {editingChapterId === chapter.id ? (
                      <div className="flex items-center gap-2 flex-1 max-w-md">
                        <input
                          type="text"
                          value={editingChapterTitle}
                          onChange={(e) => setEditingChapterTitle(e.target.value)}
                          className="w-full px-3 py-1.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 focus:border-primary outline-none"
                        />
                        <button
                          onClick={() => handleUpdateChapter(chapter.id)}
                          className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold"
                        >
                          Lưu
                        </button>
                        <button
                          onClick={() => setEditingChapterId(null)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs font-semibold px-2"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold text-gray-400 shrink-0">Chương {chIdx + 1}:</span>
                        <h4 className="font-bold text-sm text-gray-800 dark:text-gray-100 truncate">
                          {chapter.title}
                        </h4>
                      </div>
                    )}
                  </div>

                  {editingChapterId !== chapter.id && (
                    <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover/chapter:opacity-100 transition-all">
                      <button
                        onClick={() => {
                          setEditingChapterId(chapter.id);
                          setEditingChapterTitle(chapter.title);
                        }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20"
                        title="Đổi tên chương"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteChapter(chapter.id, chapter.title)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                        title="Xóa chương học"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Lessons inside Chapter */}
                {!isCollapsed && (
                  <div className="p-5 space-y-3 bg-white/40 dark:bg-gray-900/10">
                    {chLessons.length === 0 ? (
                      <div className="text-center py-6 text-xs text-gray-400 italic">
                        Chưa có bài học nào trong chương này.
                      </div>
                    ) : (
                      <div className="relative pl-6 border-l-2 border-blue-500/20 dark:border-blue-500/10 ml-4 space-y-5 py-2">
                        {chLessons.map((lesson, lesIdx) => {
                          const lesMedia = mediaList.filter(m => m.lesson_id === lesson.id);

                          return (
                            <div key={lesson.id} className="relative group/lesson">
                              
                              {/* Blue timeline dot marker */}
                              <span className="absolute -left-[31px] top-4.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 border-4 border-white dark:border-gray-950 shadow-sm shrink-0 z-10" />

                              <div className="flex flex-col gap-3 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-primary/20 dark:hover:border-primary/20 hover:shadow-md transition-all">
                                
                                {/* Lesson Header */}
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <GripVertical size={14} className="text-gray-300 dark:text-gray-700 shrink-0 cursor-grab active:cursor-grabbing" />
                                    <h5 className="font-bold text-sm text-gray-850 dark:text-gray-200 truncate">
                                      {lesson.title}
                                    </h5>
                                  </div>

                                  {/* Lesson Controls */}
                                  <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover/lesson:opacity-100 transition-all">
                                    <button 
                                      className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                      title="Di chuyển lên"
                                    >
                                      <ChevronUp size={14} />
                                    </button>
                                    <button 
                                      className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                      title="Di chuyển xuống"
                                    >
                                      <ChevronDown size={14} />
                                    </button>
                                    <div className="w-px h-3.5 bg-gray-200 dark:bg-gray-800" />
                                    <Link
                                      href={`/courses/${courseId}/lessons/${lesson.id}/edit?chapterId=${chapter.id}`}
                                      className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20"
                                      title="Chỉnh sửa bài giảng"
                                    >
                                      <Pencil size={13} />
                                    </Link>
                                    <button
                                      onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20"
                                      title="Xóa bài giảng"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </div>

                                {/* Lesson Description (if any) */}
                                {lesson.content && (
                                  <p className="text-xs text-gray-400 dark:text-gray-500 pl-6 line-clamp-1">
                                    {lesson.content}
                                  </p>
                                )}

                                {/* Media Attachment List */}
                                {lesMedia.length > 0 && (
                                  <div className="pl-6 space-y-1.5 pt-2.5 border-t border-gray-100 dark:border-gray-850">
                                    {lesMedia.map((media) => {
                                      const isVideo = media.type === 'video';
                                      const isLink = media.type === 'link';

                                      return (
                                        <div 
                                          key={media.id}
                                          className="flex items-center justify-between gap-3 p-2 rounded-xl bg-gray-50/60 dark:bg-gray-950/20 border border-gray-200/50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-850/50 transition-colors group/media"
                                        >
                                          <div className="flex items-center gap-2.5 min-w-0">
                                            {isVideo ? (
                                              <PlayCircle size={14} className="text-blue-500 shrink-0" />
                                            ) : isLink ? (
                                              <ExternalLink size={14} className="text-amber-500 shrink-0" />
                                            ) : (
                                              <FileText size={14} className="text-emerald-500 shrink-0" />
                                            )}
                                            <span className="text-xs font-bold text-gray-800 dark:text-gray-250 truncate">
                                              {media.title}
                                            </span>
                                            <span className="text-[10px] text-gray-400 dark:text-gray-550 font-semibold shrink-0">
                                              {isVideo ? "• Video bài giảng" : isLink ? "• Liên kết" : "• Tài liệu PDF"}
                                            </span>
                                          </div>

                                          <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover/media:opacity-100 transition-all">
                                            <Link
                                              href={`/courses/${courseId}/lessons/${lesson.id}/edit?chapterId=${chapter.id}`}
                                              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-850 text-gray-400 hover:text-primary"
                                              title="Sửa phương tiện"
                                            >
                                              <Pencil size={11} />
                                            </Link>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Quick add lesson button per chapter */}
                    <div className="pt-2 pl-4">
                      <Link
                        href={`/courses/${courseId}/lessons/create?chapterId=${chapter.id}`}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-primary/30 rounded-xl text-xs font-bold text-gray-500 hover:text-primary dark:hover:text-primary/90 transition-all bg-white/50 dark:bg-gray-900/5"
                      >
                        <Plus size={12} />
                        Thêm bài giảng vào Chương {chIdx + 1}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Chapter Creator Section */}
      <div className="border-t border-gray-200 dark:border-gray-850 pt-4">
        {addingChapter ? (
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-3 animate-in slide-in-from-bottom-2 duration-200">
            <h5 className="text-xs font-bold text-gray-700 dark:text-gray-300">Tạo chương học mới</h5>
            <input
              type="text"
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              placeholder="Nhập tiêu đề chương (VD: Chương 1: Biến và Hằng số)..."
              className="w-full px-4 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 focus:border-primary outline-none"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setAddingChapter(false)}
                className="px-4 py-2 text-gray-500 hover:text-gray-700 font-semibold"
              >
                Hủy
              </button>
              <button
                onClick={handleAddChapter}
                className="px-4 py-2 rounded-xl bg-primary text-white font-bold"
              >
                Tạo chương
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingChapter(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 font-bold text-sm border border-indigo-100/50 hover:bg-indigo-100/60 dark:hover:bg-indigo-950/40 transition-all active:scale-98"
          >
            <FolderPlus size={16} />
            Tạo chương học mới
          </button>
        )}
      </div>
    </div>
  );
}
