"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, BookOpen, Shield, FileText, CreditCard } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Roles & Permissions', href: '/admin/iam', icon: Shield },
  { name: 'Exams & Questions', href: '/admin/exams', icon: FileText },
  { name: 'Exam Sessions', href: '/admin/exam-sessions', icon: BookOpen },
  { name: 'Transactions', href: '/admin/transactions', icon: CreditCard },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full md:w-64 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border-r border-gray-200 dark:border-gray-800 shrink-0 md:h-screen sticky top-0 flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
            O
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
            AdminOS
          </span>
        </div>
      </div>
      
      <nav className="flex-1 px-4 pb-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? "bg-primary/10 text-primary dark:bg-primary/20" 
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              <item.icon size={18} className={isActive ? "text-primary" : "text-gray-500"} />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
