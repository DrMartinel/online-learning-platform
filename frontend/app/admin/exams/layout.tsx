import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function ExamsLayout({ children }: { children: React.ReactNode }) {
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Premium Minimal Header */}
      <header className="h-16 flex items-center justify-between px-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/admin/exams" className="text-xl font-bold text-gray-900 dark:text-white hover:text-primary transition-colors">
            Học liệu & Đề thi
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors dark:text-gray-400">
            Back to Site
          </Link>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
