"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Key, Loader2, ArrowRight } from 'lucide-react';

function EnterExamSessionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sid = searchParams.get('sessionId');
    if (sid) {
      setSessionId(sid);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId.trim()) {
      setError('Vui lòng nhập mã đợt thi.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/exam-sessions/${sessionId.trim()}/enter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode: accessCode.trim() }),
      });

      if (res.ok) {
        // Lưu accessCode vào sessionStorage để lobby page dùng khi startAttempt
        // (backend sẽ xác thực lại accessCode khi bắt đầu làm bài)
        if (accessCode.trim()) {
          sessionStorage.setItem(`exam_access_${sessionId.trim()}`, accessCode.trim());
        }
        // Success, redirect to the session lobby page
        router.push(`/exam-sessions/${sessionId.trim()}`);
      } else {
        const data = await res.json();
        setError(data.error || 'Có lỗi xảy ra khi truy cập đợt thi.');
      }
    } catch (err) {
      setError('Lỗi kết nối. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Mã đợt thi (Session ID) <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          placeholder="VD: 123e4567-e89b-12d3..."
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-gray-900 dark:text-white"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex justify-between">
          <span>Mã truy cập (Access Code)</span>
          <span className="text-gray-400 text-xs font-normal">Tùy chọn</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Key className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="password"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            placeholder="Nhập mật khẩu (nếu có)"
            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-lg shadow-primary/25 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            Truy cập đợt thi <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </form>
  );
}

export default function EnterExamSessionPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="p-8">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 mx-auto">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Vào phòng thi</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Nhập mã đợt thi để bắt đầu làm bài</p>
          </div>

          <Suspense fallback={<div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}>
            <EnterExamSessionForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
