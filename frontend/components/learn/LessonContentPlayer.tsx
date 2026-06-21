"use client";

import { useState } from "react";
import { PlayCircle, FileText, Download, Play, BookOpen, ExternalLink, Video } from "lucide-react";
import VideoPlayer from "./VideoPlayer";
import Link from "next/link";

interface LessonContent {
  id: string;
  lessonId: string;
  type: string; // 'video' | 'document'
  title: string;
  url: string;
  durationMinutes?: number | null;
  orderIndex: number;
  signedUrl?: string; // Pre-signed URL resolved by server
}

interface LessonContentPlayerProps {
  contents: LessonContent[];
  fallbackVideoUrl?: string | null;
  fallbackContent?: string | null;
  lessonTitle: string;
}

export default function LessonContentPlayer({
  contents,
  fallbackVideoUrl,
  fallbackContent,
  lessonTitle,
}: LessonContentPlayerProps) {
  // Sort contents by orderIndex
  const sortedContents = [...contents].sort((a, b) => a.orderIndex - b.orderIndex);

  // Determine initial selected content
  const [selectedContentId, setSelectedContentId] = useState<string | null>(
    sortedContents.length > 0 ? sortedContents[0].id : null
  );

  const selectedContent = sortedContents.find((c) => c.id === selectedContentId);

  // If no new contents are defined, fall back to old properties
  const hasContents = sortedContents.length > 0;

  return (
    <div className="space-y-4">
      {/* Media Viewer Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Main Content Player/View */}
        <div className="lg:col-span-3">
          {hasContents ? (
            selectedContent ? (
              selectedContent.type === "video" ? (
                selectedContent.signedUrl ? (
                  <VideoPlayer src={selectedContent.signedUrl} title={selectedContent.title} />
                ) : (
                  <div className="aspect-video rounded-2xl bg-gray-900 flex flex-col items-center justify-center border border-gray-800 text-white p-6 text-center">
                    <p className="text-gray-400">Không thể tạo đường dẫn video an toàn.</p>
                  </div>
                )
              ) : selectedContent.type === "document" ? (
                /* Document View */
                (() => {
                  const isPdf = selectedContent.url.toLowerCase().includes('.pdf') || 
                                selectedContent.signedUrl?.toLowerCase().includes('.pdf');
                  if (isPdf) {
                    return (
                      <div className="w-full h-[550px] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900">
                        <iframe
                          src={selectedContent.signedUrl || selectedContent.url}
                          className="w-full h-full border-none"
                          title={selectedContent.title}
                        />
                      </div>
                    );
                  }
                  return (
                    <div className="aspect-video rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 flex flex-col items-center justify-center border border-gray-200 dark:border-gray-800 p-6 text-center shadow-inner">
                      <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-4 border border-emerald-200 dark:border-emerald-800">
                        <FileText size={32} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2 truncate max-w-md">
                        {selectedContent.title}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
                        Tài liệu học tập đính kèm bài giảng. Bạn có thể mở liên kết hoặc tải xuống thiết bị của mình.
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <a
                          href={selectedContent.signedUrl || selectedContent.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-emerald-600/10 cursor-pointer"
                        >
                          <Download size={16} />
                          Tải tài liệu xuống
                        </a>
                      </div>
                    </div>
                  );
                })()
              ) : (
                /* Exam View */
                <div className="aspect-video rounded-2xl bg-gradient-to-br from-gray-55 to-gray-100 dark:from-gray-950 dark:to-gray-900 flex flex-col items-center justify-center border border-gray-205 dark:border-gray-800 p-6 text-center shadow-inner">
                  <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mb-4 border border-amber-200 dark:border-amber-800">
                    <BookOpen size={32} className="text-amber-600 dark:text-amber-400" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2 truncate max-w-md">
                    {selectedContent.title}
                  </h4>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mb-6 max-w-sm">
                    Bài thi đánh giá đính kèm bài giảng. Vui lòng bấm nút bên dưới để tham gia làm bài thi trực tuyến.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/exams/${selectedContent.url}`}
                      target="_blank"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-amber-600/10 cursor-pointer"
                    >
                      <Play size={16} />
                      Bắt đầu làm bài thi
                    </Link>
                  </div>
                </div>
              )
            ) : null
          ) : /* Fallback to old video/text */
          fallbackVideoUrl ? (
            <VideoPlayer src={fallbackVideoUrl} title={lessonTitle} />
          ) : (
            <div className="aspect-video rounded-2xl bg-gradient-to-br from-gray-55 to-gray-100 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center border border-gray-250 dark:border-gray-800">
              <div className="text-center">
                <BookOpen size={48} className="mx-auto mb-3 text-gray-300 dark:text-gray-650" />
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  Bài giảng lý thuyết đọc (không có video)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Contents Sidebar (Only show if there are multiple contents) */}
        {hasContents && (
          <div className="lg:col-span-1 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-2xl p-4 space-y-3 flex flex-col h-auto max-h-[360px] lg:max-h-none overflow-y-auto">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Học liệu bài học
            </h4>
            <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
              {sortedContents.map((c) => {
                const isSelected = c.id === selectedContentId;
                const isVideo = c.type === "video";
                const Icon = isVideo ? PlayCircle : FileText;

                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedContentId(c.id)}
                    className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left border transition-all ${
                      isSelected
                        ? "bg-primary/5 dark:bg-primary/10 border-primary text-primary"
                        : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/40 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <Icon
                      size={16}
                      className={`shrink-0 mt-0.5 ${
                        isSelected
                          ? "text-primary"
                          : isVideo
                          ? "text-blue-500"
                          : "text-emerald-500"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold leading-tight line-clamp-2">
                        {c.title}
                      </p>
                      {isVideo && c.durationMinutes && (
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                          Thời lượng: {c.durationMinutes} phút
                        </p>
                      )}
                      {!isVideo && (
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                          Tài liệu đọc
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Description / Content fallbacks */}
      {!hasContents && fallbackContent && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-2">
          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">Chi tiết bài giảng</h4>
          <p className="text-sm text-gray-650 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
            {fallbackContent}
          </p>
        </div>
      )}
    </div>
  );
}
