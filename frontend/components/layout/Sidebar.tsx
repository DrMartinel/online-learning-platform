"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  GraduationCap,
  User,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  LogOut,
  PlayCircle,
  Sun,
  Moon,
  FileText,
  Home,
  PlusCircle,
  X
} from "lucide-react";
import { useTheme } from "@/components/layout/ThemeProvider";

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: string;
  permissions?: string[];
}

function getInitials(user: UserProfile): string {
  if (user.fullName) {
    return user.fullName
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  if (user.email) {
    return user.email.slice(0, 2).toUpperCase();
  }
  return "U";
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mounted, setMounted] = useState(false);
  const { darkMode, toggleTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch(() => setUser(null));
  }, []);

  if (!mounted) return null;

  const navItems = [
    { href: "/", label: "Trang chủ", icon: Home },
    { href: "/courses", label: "Khóa học", icon: BookOpen },
    { href: "/my-courses", label: "Khóa học của tôi", icon: GraduationCap },
    { href: "/exams", label: "Học liệu & Đề thi", icon: FileText },
    { href: "/profile", label: "Hồ sơ cá nhân", icon: User },
  ];

  if (user?.permissions?.includes('action:course:create')) {
    navItems.push({ href: "/courses/create", label: "Tạo khóa học", icon: PlusCircle });
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => setIsCollapsed(true)}
        className={`fixed inset-y-0 left-0 md:sticky md:top-0 z-50 md:z-30 flex flex-col h-full md:h-screen border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-300 shrink-0 w-64 ${
          isCollapsed ? "md:w-20" : "md:w-64"
        } ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <Link href="/" className="flex items-center gap-2 shrink-0" onClick={onClose}>
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <PlayCircle size={20} className="text-white" />
            </div>
            {(!isCollapsed || isOpen) && (
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                EduSpace
              </span>
            )}
          </Link>
          {isOpen && (
            <button 
              onClick={onClose}
              className="p-1 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-primary/10 text-primary dark:bg-primary/20"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 hover:text-gray-950 dark:hover:text-gray-50"
                }`}
              >
                <Icon
                  size={20}
                  className={`transition-transform duration-200 group-hover:scale-110 shrink-0 ${
                    isActive ? "text-primary" : "text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100"
                  }`}
                />
                {(!isCollapsed || isOpen) && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}

          {/* Admin Dashboard link if user is admin */}
          {user?.role === "admin" && (
            <Link
              href="/admin"
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                pathname.startsWith("/admin")
                  ? "bg-primary/10 text-primary dark:bg-primary/20"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 hover:text-gray-950 dark:hover:text-gray-50"
              }`}
            >
              <LayoutDashboard
                size={20}
                className={`transition-transform duration-200 group-hover:scale-110 shrink-0 ${
                  pathname.startsWith("/admin") ? "text-primary" : "text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100"
                }`}
              />
              {(!isCollapsed || isOpen) && <span className="truncate">Admin Dashboard</span>}
            </Link>
          )}
        </div>

        {/* User Profile Card at bottom */}
        {user && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 shrink-0 bg-gray-50/50 dark:bg-gray-900/50">
            {(!isCollapsed || isOpen) ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {getInitials(user)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {user.fullName || user.email}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={toggleTheme}
                    className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-150 dark:hover:bg-gray-800 transition-colors flex items-center justify-center flex-1 border border-gray-200 dark:border-gray-800 cursor-pointer"
                    title="Đổi giao diện"
                  >
                    {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center justify-center flex-1 border border-red-200/50 dark:border-red-950/50 cursor-pointer"
                    title="Đăng xuất"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
                  {getInitials(user)}
                </div>
                <div className="flex flex-col gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 w-full items-center">
                  <button
                    onClick={toggleTheme}
                    className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-150 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-800 cursor-pointer"
                    title="Đổi giao diện"
                  >
                    {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors border border-red-200/50 dark:border-red-950/50 cursor-pointer"
                    title="Đăng xuất"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
