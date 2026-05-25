"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  PlayCircle, 
  FileText, 
  ExternalLink, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  ZoomIn, 
  ZoomOut, 
  MessageSquare,
  X,
  BookOpen,
  HelpCircle
} from "lucide-react";
import VideoPlayer from "./VideoPlayer";
import { getMediaUrl } from "@/lib/supabase";
import CompleteButton from "./CompleteButton";

interface MediaItem {
  id: string;
  title: string;
  type: "video" | "document" | "link";
  url: string;
  orderIndex?: number;
}

interface Lesson {
  id: string;
  courseId: string;
  title: string;
  content?: string | null;
  videoUrl?: string | null; // legacy fallback
  media?: MediaItem[];
}

interface ActiveLessonPlaygroundProps {
  courseId: string;
  courseTitle: string;
  lesson: Lesson;
  initialCompleted?: boolean;
  nextLesson?: Lesson | null;
  prevLesson?: Lesson | null;
}

export default function ActiveLessonPlayground({
  courseId,
  courseTitle,
  lesson,
  initialCompleted = false,
  nextLesson,
  prevLesson,
}: ActiveLessonPlaygroundProps) {
  // Combine media items
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [activeMedia, setActiveMedia] = useState<MediaItem | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);

  useEffect(() => {
    const list: MediaItem[] = [];
    
    // Add legacy video if present
    if (lesson.videoUrl) {
      list.push({
        id: "legacy-video",
        title: "Tổng quan lý thuyết và ví dụ",
        type: "video",
        url: lesson.videoUrl,
      });
    }

    // Add lesson_media from db
    if (lesson.media && lesson.media.length > 0) {
      lesson.media.forEach((m) => {
        // Avoid duplicating if legacy URL matches
        if (m.url !== lesson.videoUrl) {
          list.push(m);
        }
      });
    }

    // Fallback if no media exists
    if (list.length === 0) {
      list.push({
        id: "placeholder-text",
        title: "Tài liệu đọc lý thuyết",
        type: "document",
        url: "",
      });
    }

    setMediaItems(list);
    setActiveMedia(list[0] || null);
  }, [lesson]);

  const totalVideos = mediaItems.filter(m => m.type === "video").length;
  const totalDocs = mediaItems.filter(m => m.type === "document").length;
  const totalLinks = mediaItems.filter(m => m.type === "link").length;

  const handleZoom = (direction: "in" | "out") => {
    if (direction === "in") {
      setZoomLevel(prev => Math.min(200, prev + 10));
    } else {
      setZoomLevel(prev => Math.max(50, prev - 10));
    }
  };

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-950 overflow-hidden font-sans">
      
      {/* ── LEFT COLUMN: Media Sidebar ── */}
      <aside className="w-80 shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full shadow-sm z-10">
        
        {/* Back Link */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <Link 
            href={`/courses/${courseId}`} 
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors"
          >
            <ChevronLeft size={14} />
            Quay lại danh sách học phần
          </Link>
        </div>

        {/* Active Lesson Header Info */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 shrink-0 space-y-2">
          <div className="inline-flex items-center justify-center p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <BookOpen size={18} />
          </div>
          <h2 className="text-base font-extrabold text-gray-850 dark:text-gray-100 leading-snug tracking-tight">
            {lesson.title}
          </h2>
          <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            {courseTitle}
          </p>
        </div>

        {/* Media Playlist Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="px-1 shrink-0">
            <h3 className="text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Nội dung bài học
            </h3>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold mt-0.5">
              {totalVideos > 0 && `${totalVideos} Video `}
              {totalDocs > 0 && `• ${totalDocs} Tài liệu `}
              {totalLinks > 0 && `• ${totalLinks} Liên kết`}
            </p>
          </div>

          <div className="space-y-1.5">
            {mediaItems.map((item) => {
              const isActive = activeMedia?.id === item.id;
              const isVideo = item.type === "video";
              const isLink = item.type === "link";

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveMedia(item)}
                  className={`
                    w-full flex items-start gap-3 p-3 rounded-2xl border text-left transition-all duration-200 group
                    ${isActive 
                      ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-sm" 
                      : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/40"
                    }
                  `}
                >
                  <span className={`
                    flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors mt-0.5
                    ${isActive 
                      ? "bg-primary text-white" 
                      : isVideo 
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-500" 
                        : isLink
                          ? "bg-amber-50 dark:bg-amber-900/20 text-amber-500"
                          : "bg-red-50 dark:bg-red-900/20 text-red-500"
                    }
                  `}>
                    {isVideo ? (
                      <PlayCircle size={16} />
                    ) : (
                      <FileText size={16} />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className={`
                      text-xs font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2
                      ${isActive ? "text-primary" : "text-gray-800 dark:text-gray-200"}
                    `}>
                      {item.title}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-550 mt-1 font-semibold">
                      {isVideo ? "Video bài giảng • 10-15 phút" : isLink ? "Liên kết ngoài" : "Tài liệu đọc PDF"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* ── RIGHT COLUMN: Content Playground ── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Top Header Bar */}
        <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 shrink-0 z-10">
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-primary/80 uppercase tracking-wider">
              {activeMedia?.type === "video" ? "Video bài giảng" : "Tài nguyên bài giảng"}
            </span>
            <h1 className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate mt-0.5">
              {activeMedia?.title}
            </h1>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <CompleteButton
              lessonId={lesson.id}
              courseId={courseId}
              initialCompleted={initialCompleted}
            />
            {nextLesson && (
              <Link
                href={`/learn/${courseId}/${nextLesson.id}`}
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 transition-colors"
                title="Bài tiếp theo"
              >
                Tiếp theo
                <ChevronRight size={14} />
              </Link>
            )}
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-1 hidden sm:block"></div>
            <Link 
              href={`/courses/${courseId}`} 
              className="p-1.5 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              title="Đóng trang học"
            >
              <X size={16} />
            </Link>
          </div>
        </header>

        {/* Viewport content */}
        <div className="flex-1 overflow-hidden flex flex-col items-center justify-center p-6 relative">
          {activeMedia?.type === "video" ? (
            /* Video player mode */
            <div className="w-full max-w-4xl aspect-video rounded-3xl overflow-hidden shadow-2xl bg-black border border-gray-200 dark:border-gray-800">
              <VideoPlayer 
                src={getMediaUrl(activeMedia.url)} 
                title={activeMedia.title} 
              />
            </div>
          ) : activeMedia?.type === "link" ? (
            /* Link mode */
            <div className="max-w-md text-center p-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-xl space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-500 flex items-center justify-center mx-auto shadow-sm">
                <ExternalLink size={24} />
              </div>
              <h3 className="text-base font-bold text-gray-850 dark:text-gray-100">
                Mở liên kết tham chiếu bên ngoài
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto leading-relaxed">
                Tài liệu này được lưu trữ bên ngoài EduSpace. Vui lòng nhấn nút dưới đây để truy cập.
              </p>
              <a
                href={activeMedia.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/95 transition-all shadow-sm active:scale-95"
              >
                Mở liên kết
                <ExternalLink size={14} />
              </a>
            </div>
          ) : (
            /* PDF document mode */
            <div className="w-full flex-1 max-w-4xl bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col relative">
              <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-950 p-6 flex justify-center items-start">
                {activeMedia?.url ? (
                  <iframe
                    src={`${getMediaUrl(activeMedia.url)}#toolbar=0&navpanes=0`}
                    className="w-full h-full bg-white dark:bg-gray-900 border-none rounded-2xl shadow-sm transition-all duration-200"
                    style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top center" }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
                    <HelpCircle size={48} className="text-gray-300 dark:text-gray-600 mb-3" />
                    <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      Chưa có nội dung đọc đính kèm
                    </h4>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs">
                      Bài giảng này chưa tải lên tài liệu đính kèm nào.
                    </p>
                  </div>
                )}
              </div>

              {/* Floating PDF Controls inside the card */}
              {activeMedia?.url && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-gray-200/80 dark:border-gray-800/80 shadow-lg shrink-0 text-gray-600 dark:text-gray-300 transition-all">
                  <button 
                    onClick={() => handleZoom("out")}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    title="Thu nhỏ"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <span className="text-xs font-bold font-mono min-w-[36px] text-center shrink-0 select-none">
                    {zoomLevel}%
                  </span>
                  <button 
                    onClick={() => handleZoom("in")}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    title="Phóng to"
                  >
                    <ZoomIn size={16} />
                  </button>
                  <div className="w-px h-4 bg-gray-200 dark:bg-gray-850 shrink-0" />
                  <a 
                    href={getMediaUrl(activeMedia.url)}
                    download
                    target="_blank"
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-primary"
                    title="Tải xuống tài liệu"
                  >
                    <Download size={16} />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Float Hỏi bài Button at bottom right */}
        <button className="fixed bottom-6 right-6 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-primary hover:bg-primary/95 text-white text-xs font-bold shadow-xl hover:scale-105 active:scale-95 transition-all z-20">
          <MessageSquare size={16} className="fill-white/10" />
          Hỏi bài
        </button>
      </main>
    </div>
  );
}
