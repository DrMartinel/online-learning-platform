"use client";

import { useState, useEffect } from "react";
import { 
  PlayCircle, 
  FileText, 
  ExternalLink, 
  Download, 
  Video, 
  FolderOpen
} from "lucide-react";
import VideoPlayer from "./VideoPlayer";
import { getMediaUrl } from "@/lib/supabase";

interface MediaItem {
  id: string;
  title: string;
  type: "video" | "document" | "link";
  url: string;
  orderIndex?: number;
}

interface LessonMediaViewerProps {
  videos: MediaItem[];
  documents: MediaItem[];
  lessonTitle: string;
}

export default function LessonMediaViewer({
  videos,
  documents,
  lessonTitle,
}: LessonMediaViewerProps) {
  const [activeVideo, setActiveVideo] = useState<MediaItem | null>(null);

  // Sync active video when the lesson changes
  useEffect(() => {
    if (videos.length > 0) {
      setActiveVideo(videos[0]);
    } else {
      setActiveVideo(null);
    }
  }, [videos]);

  const hasVideos = videos.length > 0;
  const hasDocs = documents.length > 0;

  return (
    <div className="space-y-6">
      {/* 1. Main Media Area (Video Player or Reading Material Placeholder) */}
      {hasVideos && activeVideo ? (
        <VideoPlayer 
          src={getMediaUrl(activeVideo.url)} 
          title={activeVideo.title} 
        />
      ) : (
        <div className="aspect-video rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center border border-gray-200 dark:border-gray-700 shadow-inner">
          <div className="text-center p-6">
            <FileText
              size={56}
              className="mx-auto mb-3 text-gray-300 dark:text-gray-600 animate-pulse"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 font-bold">
              Bài học này là tài liệu đọc
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs mx-auto">
              Không có video bài giảng nào đi kèm. Bạn vui lòng xem các tài nguyên đính kèm bên dưới.
            </p>
          </div>
        </div>
      )}

      {/* 2. Playlist Switcher (When there are MULTIPLE videos) */}
      {hasVideos && videos.length > 1 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
            <Video size={16} className="text-blue-500" />
            <h4 className="text-sm font-bold">Danh sách Video bài giảng ({videos.length})</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {videos.map((vid, idx) => {
              const isActive = activeVideo?.id === vid.id;
              return (
                <button
                  key={vid.id}
                  onClick={() => setActiveVideo(vid)}
                  className={`
                    flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-200
                    ${isActive 
                      ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-sm" 
                      : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-gray-50/30 dark:bg-gray-900/40"
                    }
                  `}
                >
                  <PlayCircle 
                    size={16} 
                    className={`mt-0.5 shrink-0 ${isActive ? "text-primary fill-primary/10 animate-pulse" : "text-gray-400"}`} 
                  />
                  <div className="min-w-0">
                    <p className={`text-xs font-bold ${isActive ? "text-primary" : "text-gray-500 dark:text-gray-400"}`}>
                      Video {idx + 1}
                    </p>
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate mt-0.5">
                      {vid.title}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Attachments & Resources Area */}
      {hasDocs && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
            <FolderOpen size={18} className="text-emerald-500" />
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
              Tài nguyên & Tài liệu đính kèm ({documents.length})
            </h3>
          </div>
          <div className="space-y-2">
            {documents.map((doc) => {
              const isLink = doc.type === "link";
              const Icon = isLink ? ExternalLink : Download;
              const targetUrl = getMediaUrl(doc.url);

              return (
                <a
                  key={doc.id}
                  href={targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-4 p-3 rounded-xl border border-gray-200 dark:border-gray-800/80 bg-gray-50/20 dark:bg-gray-950/10 hover:bg-gray-50 dark:hover:bg-gray-850/50 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`
                      flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold
                      ${isLink 
                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" 
                        : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                      }
                    `}>
                      {isLink ? "LINK" : "PDF"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200 group-hover:text-primary transition-colors truncate">
                        {doc.title}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 font-medium truncate max-w-md">
                        {doc.url}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 group-hover:border-primary/40 group-hover:text-primary transition-all text-gray-400">
                    <Icon size={14} />
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
