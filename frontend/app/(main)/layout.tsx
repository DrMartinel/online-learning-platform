"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import ChatWidget from "@/components/rag/ChatWidget";
import { Menu, PlayCircle } from "lucide-react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Don't show global ChatWidget on pages that have their own course-specific one
  const hasCourseChat = /^\/courses\/[^/]+$/.test(pathname) || pathname.startsWith('/learn/');

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950 flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="flex md:hidden items-center justify-between px-4 h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shrink-0">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <PlayCircle size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            EduSpace
          </span>
        </Link>
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Menu size={20} />
        </button>
      </div>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      {!hasCourseChat && <ChatWidget />}
    </div>
  );
}
