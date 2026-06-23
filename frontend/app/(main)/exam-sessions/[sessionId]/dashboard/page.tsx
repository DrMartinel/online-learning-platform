"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Users, Clock, Award, FileText, CheckCircle, HelpCircle, 
  Loader2, AlertCircle, RefreshCw, Star, ChevronRight, UserCheck, Link as LinkIcon
} from 'lucide-react';

interface SessionStats {
  totalAttempts: number;
  inProgressCount: number;
  submittedCount: number;
  maxScore: number | null;
  minScore: number | null;
  avgScore: number | null;
}

interface Attempt {
  id: string;
  userId: string;
  fullName: string;
  username: string;
  startTime: string;
  submitTime: string | null;
  score: number | null;
  status: 'inprogress' | 'submitted' | 'graded';
}

interface SessionDetail {
  id: string;
  title: string;
  status: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  examTitle: string;
}

interface DashboardData {
  session: SessionDetail;
  stats: SessionStats;
  scoreDistribution: Record<string, number>;
  attempts: Attempt[];
}

export default function SessionDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<{ message: string | null; type: 'success' | 'error' | null }>({ message: null, type: null });

  useEffect(() => {
    fetchDashboardData();
  }, [sessionId]);

  const fetchDashboardData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      
      const res = await fetch(`/api/admin/exam-sessions/${sessionId}/dashboard`);
      if (res.ok) {
        const dashboardData = await res.json();
        setData(dashboardData);
      } else {
        showToast('Không tìm thấy dữ liệu đợt thi.', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Lỗi khi tải dữ liệu dashboard.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: null, type: null }), 3000);
  };

  const getStatusBadge = (status: string, end: string) => {
    const now = new Date();
    const endTime = new Date(end);

    if (status === 'finished' || now > endTime) {
      return (
        <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-gray-100 dark:bg-gray-800 text-gray-500 uppercase border border-gray-200 dark:border-gray-700">
          Đóng đợt thi
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase border border-emerald-500/20 animate-pulse">
        Đang mở / Đang hoạt động
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-gray-500 dark:text-gray-400 font-bold">Đang tải Dashboard thống kê đợt thi...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Không tải được dữ liệu đợt thi</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">Đợt thi này không tồn tại hoặc bạn không có quyền xem thông tin.</p>
        <Link href="/exam-sessions" className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-md">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const { session, stats, scoreDistribution, attempts } = data;

  // Tính phần trăm phân phối điểm số
  const maxDistributionCount = Math.max(...Object.values(scoreDistribution), 1);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 md:p-8 space-y-8">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
            <Link href="/exam-sessions" className="hover:underline flex items-center gap-1">
              <ArrowLeft size={12} /> Quay lại Danh sách đợt thi
            </Link>
          </div>
          <div className="flex items-center gap-3 flex-wrap pt-1">
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {session.title}
            </h1>
            {getStatusBadge(session.status, session.endTime)}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-bold flex items-center gap-1">
            <FileText size={12} /> Đề thi gốc: {session.examTitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const url = `${window.location.origin}/exam-sessions/enter?sessionId=${sessionId}`;
              navigator.clipboard.writeText(url).then(() => {
                showToast('Đã sao chép link vào thi!', 'success');
              }).catch(() => {
                showToast('Không thể sao chép link.', 'error');
              });
            }}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <LinkIcon size={14} />
            Sao chép link thi
          </button>
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Đang làm mới...' : 'Làm mới kết quả'}
          </button>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total students */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div className="space-y-0.5">
            <div className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Học sinh đã vào thi</div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">{stats.totalAttempts}</div>
            <div className="text-[10px] text-gray-400 font-semibold">{stats.inProgressCount} học sinh đang làm bài</div>
          </div>
        </div>

        {/* Submitted attempts */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle size={20} />
          </div>
          <div className="space-y-0.5">
            <div className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Số bài đã nộp</div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">{stats.submittedCount}</div>
            <div className="text-[10px] text-gray-400 font-semibold">Tỷ lệ nộp: {stats.totalAttempts > 0 ? ((stats.submittedCount / stats.totalAttempts) * 100).toFixed(0) : 0}%</div>
          </div>
        </div>

        {/* Avg score */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Award size={20} />
          </div>
          <div className="space-y-0.5">
            <div className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Điểm trung bình</div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">
              {stats.avgScore !== null ? `${stats.avgScore}` : '--'}
            </div>
            <div className="text-[10px] text-gray-400 font-semibold">Trên thang điểm 10</div>
          </div>
        </div>

        {/* Min/Max score */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Star size={20} />
          </div>
          <div className="space-y-0.5">
            <div className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Điểm Cao / Thấp nhất</div>
            <div className="text-xl font-black text-gray-900 dark:text-white">
              {stats.maxScore !== null ? `${stats.maxScore}` : '--'} <span className="text-xs font-normal text-gray-400">/</span> {stats.minScore !== null ? `${stats.minScore}` : '--'}
            </div>
            <div className="text-[10px] text-gray-400 font-semibold">Thống kê tự động</div>
          </div>
        </div>

      </div>

      {/* LOWER GRID: DISTRIBUTION CHART & ACTIVE SESSIONS DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Score Distribution Chart */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="font-extrabold text-gray-900 dark:text-white text-base">Phổ điểm đợt thi</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500">Phân tích tỷ lệ điểm số đạt được của học sinh.</p>
          </div>
          
          <div className="space-y-4 pt-2">
            {Object.entries(scoreDistribution).map(([range, count]) => {
              const percent = stats.submittedCount > 0 ? (count / stats.submittedCount) * 100 : 0;
              return (
                <div key={range} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-gray-600 dark:text-gray-400">
                    <span>Dải điểm: {range}</span>
                    <span>{count} em ({percent.toFixed(0)}%)</span>
                  </div>
                  
                  {/* Tailwind Progress Bar */}
                  <div className="h-3.5 w-full bg-gray-50 dark:bg-gray-800 rounded-full overflow-hidden border border-gray-200 dark:border-gray-800">
                    <div 
                      className="h-full bg-gradient-to-r from-primary/70 to-primary rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Attempt Details Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm lg:col-span-2 space-y-4">
          <div>
            <h3 className="font-extrabold text-gray-900 dark:text-white text-base">Bảng theo dõi thí sinh</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500">Danh sách học viên và điểm số lượt làm bài tương ứng.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th scope="col" className="py-3 px-4">Họ và Tên</th>
                  <th scope="col" className="py-3 px-4">Username</th>
                  <th scope="col" className="py-3 px-4">Bắt đầu lúc</th>
                  <th scope="col" className="py-3 px-4">Thời gian thi</th>
                  <th scope="col" className="py-3 px-4">Điểm số</th>
                  <th scope="col" className="py-3 px-4">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {attempts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-gray-400 font-bold">
                      Chưa có học sinh nào tham gia đợt thi này.
                    </td>
                  </tr>
                ) : (
                  attempts.map((attempt) => {
                    // Tính thời gian thi
                    let durationText = '--';
                    if (attempt.submitTime) {
                      const start = new Date(attempt.startTime);
                      const submit = new Date(attempt.submitTime);
                      const diffSec = Math.floor((submit.getTime() - start.getTime()) / 1000);
                      const min = Math.floor(diffSec / 60);
                      const sec = diffSec % 60;
                      durationText = `${min} phút ${sec} giây`;
                    } else {
                      durationText = 'Đang làm...';
                    }

                    return (
                      <tr key={attempt.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all">
                        <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white">
                          {attempt.fullName}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-mono">
                          {attempt.username}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          {new Date(attempt.startTime).toLocaleTimeString('vi-VN')}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-semibold">
                          {durationText}
                        </td>
                        <td className="py-3.5 px-4">
                          {attempt.score !== null ? (
                            <span className="text-sm font-black text-primary bg-primary/5 px-2.5 py-1 rounded-xl">
                              {attempt.score}
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-lg border border-gray-100 dark:border-gray-800">
                              Chờ chấm
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {attempt.status === 'inprogress' ? (
                            <span className="px-2 py-0.5 text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded border border-amber-500/10 uppercase tracking-wide">
                              Đang làm
                            </span>
                          ) : attempt.status === 'submitted' ? (
                            <span className="px-2 py-0.5 text-[9px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded border border-blue-500/10 uppercase tracking-wide">
                              Đã nộp bài
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded border border-emerald-500/10 uppercase tracking-wide">
                              Đã chấm xong
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* TOAST ALERT */}
      {toast.message && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border animate-in slide-in-from-bottom-5 duration-300 ${
          toast.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
        }`}>
          <AlertCircle size={16} />
          <span className="text-sm font-bold">{toast.message}</span>
        </div>
      )}

    </div>
  );
}
