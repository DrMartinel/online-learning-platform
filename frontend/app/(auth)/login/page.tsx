'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Đăng nhập thất bại');
      }

      // Sync session to browser Supabase client so onAuthStateChange fires
      // and the Header updates immediately (fixes cookie-name mismatch in Docker)
      if (data.session?.access_token && data.session?.refresh_token) {
        const supabase = createClient();
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }

      const next = searchParams.get('next');
      router.push(next && next.startsWith('/') ? next : '/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">Chào mừng trở lại</h2>
        <p className="text-neutral-400">Nhập thông tin để đăng nhập.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 text-sm font-medium text-red-200 bg-red-950/50 border border-red-900/50 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-300" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 px-4 py-3 text-sm text-white placeholder-neutral-500 shadow-sm transition-all hover:bg-neutral-800/50 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Nhập email của bạn"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-300" htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 px-4 py-3 text-sm text-white placeholder-neutral-500 shadow-sm transition-all hover:bg-neutral-800/50 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-xl transition-all hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>

      <p className="text-center text-sm text-neutral-400">
        Chưa có tài khoản?{' '}
        <Link href="/signup" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
          Đăng ký ngay
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
