'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  FileText, 
  PlayCircle, 
  Link as LinkIcon,
  CheckCircle2
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
  order_index: number;
}

interface LessonMedia {
  id: string;
  lesson_id: string;
  title: string;
  type: 'video' | 'document' | 'link';
  url: string;
}

export default function CurriculumView({ courseId, token }: { courseId: string; token?: string }) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [mediaList, setMediaList] = useState<LessonMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsedChapters, setCollapsedChapters] = useState<Record<string, boolean>>({});

  const supabase = getSupabaseClient(token || '');

  useEffect(() => {
    const loadCurriculum = async () => {
      try {
        if (token) {
          await supabase.auth.setSession({ access_token: token, refresh_token: '' });
        }

        // 1. Fetch chapters
        const { data: chData } = await supabase
          .from('chapters')
          .select('*')
          .eq('course_id', courseId)
          .order('order_index', { ascending: true });

        const loadedChapters = chData || [];
        setChapters(loadedChapters);

        if (loadedChapters.length > 0) {
          const chapterIds = loadedChapters.map(c => c.id);

          // 2. Fetch lessons
          const { data: lesData } = await supabase
            .from('lessons')
            .select('*')
            .in('chapter_id', chapterIds)
            .order('order_index', { ascending: true });

          const loadedLessons = lesData || [];
          setLessons(loadedLessons);

          if (loadedLessons.length > 0) {
            const lessonIds = loadedLessons.map(l => l.id);

            // 3. Fetch lesson media
            const { data: medData } = await supabase
              .from('lesson_media')
              .select('*')
              .in('lesson_id', lessonIds)
              .order('order_index', { ascending: true });

            if (medData) {
              setMediaList(medData);
            }
          }
        }
      } catch (e) {
        console.error('Error loading public curriculum view:', e);
      } finally {
        setLoading(false);
      }
    };

    loadCurriculum();
  }, [courseId, token]);

  const toggleCollapse = (id: string) => {
    setCollapsedChapters(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
        <p className="text-xs">Đang tải giáo trình...</p>
      </div>
    );
  }

  if (chapters.length === 0) {
    return (
      <p className="text-sm text-gray-400 dark:text-gray-500 italic py-6 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
        Chưa có chương học nào được cấu hình cho khóa học này.
      </p>
    );
  }

  return (
    <div className="space-y-3.5">
      {chapters.map((chapter, chIdx) => {
        const chLessons = lessons.filter(l => l.chapter_id === chapter.id);
        const isCollapsed = collapsedChapters[chapter.id];

        return (
          <div 
            key={chapter.id}
            className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-gray-900"
          >
            {/* Chapter header trigger */}
            <button
              onClick={() => toggleCollapse(chapter.id)}
              className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-gray-50/50 dark:hover:bg-gray-850/10 transition-colors border-b border-gray-100 dark:border-gray-850"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xs font-bold text-gray-400 shrink-0">Chương {chIdx + 1}:</span>
                <span className="font-bold text-sm text-gray-850 dark:text-gray-100 truncate">
                  {chapter.title}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-gray-400">
                <span className="text-xs font-semibold text-gray-450">{chLessons.length} bài giảng</span>
                {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </div>
            </button>

            {/* Nested Lessons */}
            {!isCollapsed && (
              <div className="p-4 bg-gray-50/20 dark:bg-gray-950/5 space-y-3">
                {chLessons.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-4">Chương này chưa có bài học.</p>
                ) : (
                  <ol className="space-y-2">
                    {chLessons.map((lesson, lesIdx) => {
                      const lesMedia = mediaList.filter(m => m.lesson_id === lesson.id);

                      return (
                        <li key={lesson.id}>
                          <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-850/50 transition-colors group">
                            <Link 
                              href={`/learn/${courseId}/${lesson.id}`}
                              className="flex items-start gap-3 w-full"
                            >
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20 text-primary text-[10px] font-extrabold mt-0.5 group-hover:bg-primary group-hover:text-white transition-colors">
                                {lesIdx + 1}
                              </span>
                              
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-primary transition-colors block">
                                  {lesson.title}
                                </span>
                                {lesson.content && (
                                  <p className="text-xs text-gray-450 dark:text-gray-500 mt-0.5 line-clamp-1">
                                    {lesson.content}
                                  </p>
                                )}
                              </div>
                            </Link>

                            {/* Nested Lesson Resources / Media */}
                            {lesMedia.length > 0 && (
                              <div className="ml-9 pt-2 border-t border-gray-100 dark:border-gray-850 flex flex-wrap gap-2">
                                {lesMedia.map((media) => (
                                  <div 
                                    key={media.id}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 text-[10px] font-semibold text-gray-500 dark:text-gray-400"
                                  >
                                    {media.type === 'video' ? (
                                      <PlayCircle size={10} className="text-blue-500" />
                                    ) : media.type === 'document' ? (
                                      <FileText size={10} className="text-emerald-500" />
                                    ) : (
                                      <LinkIcon size={10} className="text-amber-500" />
                                    )}
                                    <span className="max-w-[120px] truncate">{media.title}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
