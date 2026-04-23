import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ProfileForm from '@/components/user/ProfileForm';
import { BookOpen, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hồ sơ của tôi – EduSpace',
  description: 'Xem và chỉnh sửa thông tin tài khoản EduSpace.',
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/profile');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role, created_at, avatar_url')
    .eq('id', user.id)
    .single();

  const initialProfile = {
    id: user.id,
    fullName: (profile?.full_name as string) ?? null,
    role: (profile?.role as string) ?? 'student',
    createdAt: (profile?.created_at as string) ?? user.created_at,
    avatarUrl: (profile?.avatar_url as string) ?? null,
    email: user.email,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 mb-6">
          <Link href="/" className="hover:text-[var(--color-primary)] transition-colors">Trang chủ</Link>
          <span>/</span>
          <span className="text-gray-700 dark:text-gray-300">Hồ sơ</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Hồ sơ của tôi
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400 text-sm">
            Quản lý thông tin cá nhân và chi tiết tài khoản.
          </p>
        </div>

        {/* Quick nav links */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <Link
            href="/my-courses"
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] text-gray-700 dark:text-gray-300 transition group"
          >
            <BookOpen className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
            <span className="text-sm font-medium">Khóa học của tôi</span>
          </Link>
          <Link
            href="/courses"
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] text-gray-700 dark:text-gray-300 transition group"
          >
            <LayoutDashboard className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
            <span className="text-sm font-medium">Khám phá khóa học</span>
          </Link>
        </div>

        {/* Profile form card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Thông tin tài khoản
          </h2>
          <ProfileForm initialProfile={initialProfile} />
        </div>
      </div>
    </div>
  );
}
