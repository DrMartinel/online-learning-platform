"use client";

import { useState, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  SkipForward,
  SkipBack,
  Settings,
  Lock, // Bổ sung icon Lock
} from "lucide-react";
import Link from "next/link"; // Bổ sung Link để điều hướng

interface VideoPlayerProps {
  src?: string | null;
  title?: string;
  isLocked?: boolean; // <--- Nhận cờ khóa bài học
  courseId?: string;  // <--- Nhận ID khóa học để tạo nút quay lại mua
}

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function VideoPlayer({ src, title, isLocked, courseId }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showCC, setShowCC] = useState(false);

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  // === 1. LOGIC PAYWALL XUẤT HIỆN Ở ĐÂY ===
  if (isLocked) {
    return (
      <div className="relative bg-gray-900 rounded-2xl overflow-hidden group aspect-video shadow-lg flex items-center justify-center border border-gray-800">
        {/* Ảnh nền giả lập video bị làm mờ */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1616469829581-73993eb86b02?q=80&w=1000')] bg-cover bg-center opacity-20 blur-md"></div>
        
        {/* Nội dung thông báo khóa */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white/10 p-4 rounded-full mb-4 shadow-2xl">
            <Lock size={40} className="text-primary drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight">Nội dung độc quyền</h3>
          <p className="text-gray-300 mb-6 max-w-md text-sm md:text-base leading-relaxed">
            Bài học này thuộc chương trình trả phí. Vui lòng nâng cấp để mở khóa toàn bộ video và tài liệu chất lượng cao.
          </p>
          
          <Link 
            href={`/courses/${courseId}`} 
            className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-full font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg"
          >
            Mở khóa ngay
          </Link>
        </div>
      </div>
    );
  }

  // === 2. CÁC HÀM XỬ LÝ VIDEO CŨ CỦA BẠN GIỮ NGUYÊN ===
  const togglePlay = () => {
    if (!videoRef.current) {
      setIsPlaying((v) => !v);
      return;
    }
    if (videoRef.current.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted((v) => !v);
  };

  const seek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressBarRef.current) return;
      const rect = progressBarRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const newTime = Math.floor(ratio * (duration || 1));
      if (videoRef.current) {
        videoRef.current.currentTime = newTime;
      }
      setCurrentTime(newTime);
    },
    [duration]
  );

  const skip = (delta: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(
        0,
        Math.min(duration, videoRef.current.currentTime + delta)
      );
    } else {
      setCurrentTime((t) => Math.max(0, Math.min(duration, t + delta)));
    }
  };

  const onLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  const onTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };

  const onPlay = () => setIsPlaying(true);
  const onPause = () => setIsPlaying(false);

  const fullscreen = () => {
    const el = videoRef.current?.parentElement;
    if (el?.requestFullscreen) el.requestFullscreen();
  };

  // === 3. GIAO DIỆN VIDEO PLAYER CŨ CỦA BẠN GIỮ NGUYÊN ===
  return (
    <div className="relative bg-gray-900 rounded-2xl overflow-hidden group aspect-video shadow-lg">
      {src ? (
        <video
          ref={videoRef}
          src={src}
          className="absolute inset-0 w-full h-full object-contain"
          onLoadedMetadata={onLoadedMetadata}
          onTimeUpdate={onTimeUpdate}
          onPlay={onPlay}
          onPause={onPause}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 via-gray-900 to-gray-950">
          <div className="text-center">
            <button
              onClick={togglePlay}
              className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 hover:bg-white/20 hover:scale-105 transition-all"
            >
              {isPlaying ? (
                <Pause size={30} className="text-white" />
              ) : (
                <Play size={30} className="text-white ml-1" />
              )}
            </button>
            {title && (
              <p className="text-white/70 text-sm font-medium px-4">{title}</p>
            )}
            <p className="text-white/40 text-xs mt-1">Nội dung bài học</p>
          </div>
        </div>
      )}

      {showCC && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/70 text-white text-sm px-4 py-2 rounded-lg max-w-lg text-center">
          {title ?? "Nội dung bài học đang phát..."}
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div
          ref={progressBarRef}
          onClick={seek}
          className="w-full h-1 bg-white/25 rounded-full mb-3 cursor-pointer hover:h-1.5 transition-all group/pg"
        >
          <div
            className="h-full bg-primary rounded-full relative"
            style={{ width: `${pct}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow opacity-0 group-hover/pg:opacity-100 transition-opacity" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="text-white hover:text-primary transition-colors"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button
            onClick={() => skip(-10)}
            className="text-white/60 hover:text-white transition-colors"
          >
            <SkipBack size={18} />
          </button>
          <button
            onClick={() => skip(10)}
            className="text-white/60 hover:text-white transition-colors"
          >
            <SkipForward size={18} />
          </button>
          <button
            onClick={toggleMute}
            className="text-white/60 hover:text-white transition-colors"
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <span className="text-white/60 text-xs font-mono">
            {fmt(currentTime)} / {fmt(duration)}
          </span>
          <div className="flex-1" />
          <button
            onClick={() => setShowCC((v) => !v)}
            className={`text-xs px-2 py-0.5 rounded border transition-colors ${
              showCC
                ? "border-primary text-primary"
                : "border-white/30 text-white/60 hover:text-white hover:border-white/60"
            }`}
          >
            CC
          </button>
          <button className="text-white/60 hover:text-white transition-colors">
            <Settings size={18} />
          </button>
          <button
            onClick={fullscreen}
            className="text-white/60 hover:text-white transition-colors"
          >
            <Maximize size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}