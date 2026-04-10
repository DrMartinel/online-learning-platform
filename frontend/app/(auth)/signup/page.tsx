'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign up');
      }

      router.push('/dashboard');
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
        <h2 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">Create an account</h2>
        <p className="text-neutral-400">Join us to start learning today.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 text-sm font-medium text-red-200 bg-red-950/50 border border-red-900/50 rounded-lg animate-in fade-in slide-in-from-top-1">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-300" htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 px-4 py-3 text-sm text-white placeholder-neutral-500 shadow-sm transition-all hover:bg-neutral-800/50 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Jane Doe"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-300" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 px-4 py-3 text-sm text-white placeholder-neutral-500 shadow-sm transition-all hover:bg-neutral-800/50 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="jane@example.com"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-300" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 px-4 py-3 text-sm text-white placeholder-neutral-500 shadow-sm transition-all hover:bg-neutral-800/50 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-xl transition-all hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      <p className="text-center text-sm text-neutral-400">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
          Sign In
        </Link>
      </p>
    </div>
  );
}
