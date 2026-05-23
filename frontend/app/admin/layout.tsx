import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, BookOpen, LogOut, Settings } from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('olp_session')?.value;

  if (!token) {
    redirect('/login');
  }

  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) return redirect('/login');

  const res = await fetch(`${backendUrl}/users/me`, {
    headers: { 'Authorization': `Bearer ${token}` },
    cache: 'no-store'
  });

  if (!res.ok) {
    redirect('/login');
  }

  const data = await res.json();
  
  if (data.role !== 'admin') {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col md:flex-row">
      <AdminSidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 flex items-center justify-between px-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Admin Console</h1>
          </div>
          <div className="flex items-center gap-4">
             <Link href="/" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
               Back to Site
             </Link>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6 md:p-8 relative">
          {children}
        </div>
      </main>
    </div>
  );
}
