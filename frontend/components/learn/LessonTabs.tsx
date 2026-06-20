"use client";

import { useState } from "react";
import { BookOpen, MessageSquare } from "lucide-react";

interface LessonTabsProps {
  overviewContent: React.ReactNode;
  commentsContent: React.ReactNode;
}

export default function LessonTabs({ overviewContent, commentsContent }: LessonTabsProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "discussion">("overview");

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/10">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold transition-all relative cursor-pointer ${
            activeTab === "overview"
              ? "text-primary"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <BookOpen size={14} />
          <span>Tổng quan</span>
          {activeTab === "overview" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-in fade-in duration-200" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("discussion")}
          className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold transition-all relative cursor-pointer ${
            activeTab === "discussion"
              ? "text-primary"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <MessageSquare size={14} />
          <span>Thảo luận</span>
          {activeTab === "discussion" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-in fade-in duration-200" />
          )}
        </button>
      </div>

      {/* Tab content */}
      <div className="p-5">
        {activeTab === "overview" ? overviewContent : commentsContent}
      </div>
    </div>
  );
}
