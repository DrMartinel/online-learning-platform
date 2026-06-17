"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Calendar, AlertCircle, Loader2, PlayCircle, ShieldCheck } from 'lucide-react';

export default function ExamSessionLobbyPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const router = useRouter();
  const { sessionId } = use(params);
  
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startLoading, setStartLoading] = useState(false);

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/exam-sessions/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setSession(data);
      } else {
        const err = await res.json();
        setError(err.error || 'Không tìm thấy thông tin đợt thi.');
      }
    } catch (e) {
      setError('Lỗi kết nối khi tải đợt thi.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartAttempt = async () => {
    try {
      setStartLoading(true);
      const res = await fetch(`/api/exam-sessions/attempts/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }), // Access code was already validated during enter, but we might need it if the backend requires it. 
        // Note: Start attempt will create or resume attempt.
      });

      if (res.ok) {
        const attempt = await res.json();
        router.push(`/exam-sessions/attempts/${attempt.id}/take`);
      } else {
        const err = await res.json();
        alert(err.error || 'Có lỗi xảy ra khi bắt đầu làm bài.');
        setStartLoading(false);
      }
    } catch (e) {
      alert('Lỗi kết nối khi bắt đầu thi.');
      setStartLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-4">
          <AlertCircle size={32} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Lỗi truy cập đợt thi</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">{error}</p>
        <button 
          onClick={() => router.push('/exam-sessions/enter')}
          className="mt-6 px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Quay lại trang nhập mã
        </button>
      </div>
    );
  }

  const startTime = new Date(session.startTime);
  const endTime = new Date(session.endTime);
  const now = new Date();
  
  let statusText = 'Đang diễn ra';
  let statusColor = 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/10';
  let canStart = true;

  if (now < startTime) {
    statusText = 'Chưa bắt đầu';
    statusColor = 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10';
    canStart = false;
  } else if (now > endTime || session.status === 'finished') {
    statusText = 'Đã kết thúc';
    statusColor = 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-500/10';
    canStart = false;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 md:p-10">
          <div className="flex items-center gap-3 mb-6">
            <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${statusColor}`}>
              {statusText}
            </span>
            {session.accessCode === 'REQUIRED' && (
              <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10 flex items-center gap-1">
                <ShieldCheck size={12} /> Cần mật khẩu
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
            {session.title}
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="flex items-start gap-4 p-5 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Thời gian làm bài</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">{session.durationMinutes} phút</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Thời hạn</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                  Từ: {startTime.toLocaleString('vi-VN')}
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Đến: {endTime.toLocaleString('vi-VN')}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Bạn đã sẵn sàng chưa? Đảm bảo kết nối mạng ổn định.
            </div>
            <button
              onClick={handleStartAttempt}
              disabled={!canStart || startLoading}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                canStart 
                  ? 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
              }`}
            >
              {startLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <PlayCircle size={20} /> Bắt đầu / Tiếp tục thi
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
