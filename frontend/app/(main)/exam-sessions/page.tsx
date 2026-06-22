"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Plus, Search, Calendar, Clock, Lock, Globe, Eye, Trash2, Edit2, 
  ChevronRight, ArrowLeft, Loader2, Award, BookOpen, AlertCircle, X, Check, FileText, Copy
} from 'lucide-react';

interface Exam {
  id: string;
  title: string;
}

interface Course {
  id: string;
  title: string;
}

interface ExamSession {
  id: string;
  title: string;
  examId: string;
  courseId: string | null;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  accessCode: string | null;
  status: 'draft' | 'active' | 'finished';
  createdAt: string;
}

export default function ExamSessionsPage() {
  const router = useRouter();
  
  // Data States
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form/Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<ExamSession | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    examId: '',
    scope: 'public', // public or course
    courseId: '',
    startTime: '',
    endTime: '',
    durationMinutes: 60,
    accessCode: '',
    status: 'draft' as 'draft' | 'active' | 'finished',
  });
  
  // Custom Toast State
  const [toast, setToast] = useState<{ message: string | null; type: 'success' | 'error' | null }>({ message: null, type: null });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sessionsRes, examsRes, coursesRes] = await Promise.all([
        fetch('/api/admin/exam-sessions'),
        fetch('/api/admin/exams'),
        fetch('/api/courses'),
      ]);

      if (sessionsRes.ok) {
        const data = await sessionsRes.json();
        setSessions(data);
      }
      if (examsRes.ok) {
        const data = await examsRes.json();
        setExams(data);
      }
      if (coursesRes.ok) {
        const data = await coursesRes.json();
        setCourses(data.courses || data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      showToast('Có lỗi xảy ra khi tải dữ liệu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: null, type: null }), 3000);
  };

  const handleOpenCreateModal = () => {
    setEditingSession(null);
    setFormData({
      title: '',
      examId: exams[0]?.id || '',
      scope: 'public',
      courseId: courses[0]?.id || '',
      startTime: '',
      endTime: '',
      durationMinutes: 60,
      accessCode: '',
      status: 'draft',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (session: ExamSession) => {
    setEditingSession(session);
    
    // Format dates to datetime-local inputs (YYYY-MM-DDTHH:MM)
    const startFormatted = new Date(session.startTime).toISOString().slice(0, 16);
    const endFormatted = new Date(session.endTime).toISOString().slice(0, 16);

    setFormData({
      title: session.title,
      examId: session.examId,
      scope: session.courseId ? 'course' : 'public',
      courseId: session.courseId || courses[0]?.id || '',
      startTime: startFormatted,
      endTime: endFormatted,
      durationMinutes: session.durationMinutes,
      accessCode: session.accessCode || '',
      status: session.status,
    });
    setIsModalOpen(true);
  };

  const handleDeleteSession = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa đợt thi "${title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/exam-sessions/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        showToast('Xóa đợt thi thành công!', 'success');
        setSessions(sessions.filter(s => s.id !== id));
      } else {
        showToast('Lỗi khi xóa đợt thi.', 'error');
      }
    } catch (e) {
      showToast('Có lỗi xảy ra.', 'error');
    }
  };

  const handleCopyLink = (sessionId: string) => {
    const url = `${window.location.origin}/exam-sessions/enter?sessionId=${sessionId}`;
    navigator.clipboard.writeText(url).then(() => {
      showToast('Đã sao chép link đợt thi!', 'success');
    }).catch(() => {
      showToast('Không thể sao chép link.', 'error');
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      showToast('Vui lòng điền tên đợt thi.', 'error');
      return;
    }
    if (!formData.examId) {
      showToast('Vui lòng chọn đề thi.', 'error');
      return;
    }
    if (!formData.startTime || !formData.endTime) {
      showToast('Vui lòng điền đầy đủ thời gian đợt thi.', 'error');
      return;
    }

    const start = new Date(formData.startTime);
    const end = new Date(formData.endTime);

    if (start >= end) {
      showToast('Thời gian bắt đầu phải trước thời gian kết thúc.', 'error');
      return;
    }

    try {
      setActionLoading(true);
      const url = editingSession 
        ? `/api/admin/exam-sessions/${editingSession.id}` 
        : '/api/admin/exam-sessions';
      
      const method = editingSession ? 'PUT' : 'POST';
      
      const payload = {
        title: formData.title,
        examId: formData.examId,
        courseId: formData.scope === 'course' ? formData.courseId : null,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        durationMinutes: Number(formData.durationMinutes),
        accessCode: formData.accessCode.trim() || null,
        status: formData.status,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast(editingSession ? 'Cập nhật đợt thi thành công!' : 'Tạo đợt thi mới thành công!', 'success');
        setIsModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Có lỗi xảy ra.', 'error');
      }
    } catch (error) {
      showToast('Có lỗi xảy ra kết nối server.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string, start: string, end: string) => {
    const now = new Date();
    const startTime = new Date(start);
    const endTime = new Date(end);

    if (status === 'finished' || now > endTime) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 flex items-center gap-1.5 w-fit">
          <Clock size={12} /> Đã kết thúc
        </span>
      );
    }

    if (status === 'active' && now >= startTime && now <= endTime) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 w-fit border border-emerald-500/20 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
          Đang diễn ra
        </span>
      );
    }

    if (status === 'active' && now < startTime) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center gap-1.5 w-fit border border-blue-500/20">
          <Calendar size={12} /> Sắp diễn ra
        </span>
      );
    }

    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center gap-1.5 w-fit border border-amber-500/20">
        <Edit2 size={12} /> Bản nháp
      </span>
    );
  };

  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 md:p-8 space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
            <Link href="/exams" className="hover:underline flex items-center gap-1">
              <ArrowLeft size={12} /> Quản lý đề thi
            </Link>
            <span>/</span>
            <span>Tổ chức thi</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Quản lý Tổ chức thi
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tạo các đợt thi theo thời gian thực trong lớp học hoặc thi công khai tự do.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-primary text-white text-sm font-extrabold hover:bg-primary/95 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all scale-100 hover:scale-[1.01] active:scale-95 cursor-pointer"
        >
          <Plus size={16} /> Tạo Đợt thi Mới
        </button>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-3xl shadow-sm">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm đợt tổ chức thi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400"
          />
        </div>
        <div className="text-xs font-bold text-gray-400 uppercase">
          Tổng số đợt thi: {filteredSessions.length}
        </div>
      </div>

      {/* DATA TABLE / LIST */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400 font-bold">Đang tải danh sách đợt thi...</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-16 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto text-gray-400">
            <Calendar size={28} />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white">Chưa có đợt thi nào</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Hãy tạo đợt thi đầu tiên từ đề thi có sẵn để bắt đầu đánh giá học viên của bạn.
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-primary/10 hover:bg-primary/15 text-primary rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus size={14} /> Tạo đợt thi ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map((session) => {
            const matchedExam = exams.find(e => e.id === session.examId);
            const matchedCourse = courses.find(c => c.id === session.courseId);

            return (
              <div 
                key={session.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Top Status */}
                <div className="flex items-center justify-between pb-4">
                  {getStatusBadge(session.status, session.startTime, session.endTime)}
                  
                  {session.courseId ? (
                    <span className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-extrabold uppercase tracking-wide border border-blue-500/10 flex items-center gap-1">
                      <BookOpen size={10} /> {matchedCourse?.title || 'Khóa học'}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold uppercase tracking-wide border border-emerald-500/10 flex items-center gap-1">
                      <Globe size={10} /> Công khai
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="space-y-2 flex-1">
                  <h3 className="font-extrabold text-gray-900 dark:text-white text-base leading-snug group-hover:text-primary transition-colors">
                    {session.title}
                  </h3>
                  <div className="text-xs text-gray-400 dark:text-gray-500 font-bold flex items-center gap-1">
                    <FileText size={12} /> Đề thi: {matchedExam?.title || 'Đề thi tĩnh'}
                  </div>

                  <div className="border-t border-gray-100 dark:border-gray-800 my-3 pt-3 space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Clock size={13} className="text-gray-400" />
                      <span>Thời gian làm bài: <strong>{session.durationMinutes} phút</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={13} className="text-gray-400" />
                      <span>Bắt đầu: {new Date(session.startTime).toLocaleString('vi-VN')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={13} className="text-gray-400" />
                      <span>Kết thúc: {new Date(session.endTime).toLocaleString('vi-VN')}</span>
                    </div>
                    {session.accessCode && (
                      <div className="flex items-center gap-2">
                        <Lock size={13} className="text-gray-400" />
                        <span>Mã bảo mật: <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-bold text-gray-600 dark:text-gray-300">{session.accessCode}</code></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Bottom */}
                <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4 mt-4">
                  <Link 
                    href={`/exam-sessions/${session.id}/dashboard`}
                    className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 hover:bg-primary/15 text-primary text-xs font-extrabold rounded-xl transition-all"
                  >
                    <Award size={13} /> Dashboard giám sát
                  </Link>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopyLink(session.id)}
                      className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-xl transition-all cursor-pointer"
                      title="Sao chép link đợt thi"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(session)}
                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all cursor-pointer"
                      title="Sửa đợt thi"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteSession(session.id, session.title)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                      title="Xóa đợt thi"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE & EDIT FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-150 dark:border-gray-800 pb-4">
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">
                {editingSession ? 'Chỉnh sửa Đợt thi' : 'Tạo Đợt tổ chức thi Mới'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-800 dark:hover:text-white transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                  Tên đợt thi *
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Kiểm tra giữa kỳ môn UML Lớp K65"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-white"
                  required
                />
              </div>

              {/* Select Exam */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                  Chọn đề thi để tổ chức *
                </label>
                <select
                  value={formData.examId}
                  onChange={(e) => setFormData({ ...formData, examId: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-white"
                  required
                >
                  {exams.length === 0 ? (
                    <option value="">Chưa có đề thi nào trong ngân hàng</option>
                  ) : (
                    exams.map(e => (
                      <option key={e.id} value={e.id}>{e.title}</option>
                    ))
                  )}
                </select>
              </div>

              {/* Scope Selection (Public vs Course) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                    Phạm vi thi
                  </label>
                  <select
                    value={formData.scope}
                    onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-white"
                  >
                    <option value="public">Công khai toàn trường</option>
                    <option value="course">Thi trong khóa học</option>
                  </select>
                </div>

                {/* Course List (Visible only if Course scope chosen) */}
                {formData.scope === 'course' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                      Chọn khóa học *
                    </label>
                    <select
                      value={formData.courseId}
                      onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-white"
                      required
                    >
                      {courses.length === 0 ? (
                        <option value="">Chưa có khóa học nào</option>
                      ) : (
                        courses.map(c => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))
                      )}
                    </select>
                  </div>
                )}
              </div>

              {/* Times */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                    Bắt đầu cho vào thi *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                    Hạn nộp bài cuối cùng *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              {/* Duration and Access Code */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                    Thời gian làm bài (Phút) *
                  </label>
                  <input
                    type="number"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-white"
                    min={1}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                    Mật khẩu vào thi (Nếu có)
                  </label>
                  <input
                    type="text"
                    placeholder="Không nhập nếu thi tự do"
                    value={formData.accessCode}
                    onChange={(e) => setFormData({ ...formData, accessCode: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Status (For Editing Mode) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                  Trạng thái đợt thi
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-white"
                >
                  <option value="draft">Bản nháp (Chưa cho phép vào thi)</option>
                  <option value="active">Kích hoạt (Học sinh có thể vào thi đúng giờ)</option>
                  <option value="finished">Đóng đợt thi (Khóa làm bài ngay lập tức)</option>
                </select>
              </div>

              {/* Modal Buttons Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-150 dark:border-gray-850 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/95 shadow-md shadow-primary/10 transition-all cursor-pointer"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Check size={14} /> {editingSession ? 'Cập nhật' : 'Tạo mới'}
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* TOAST ALERT */}
      {toast.message && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border animate-in slide-in-from-bottom-5 duration-300 ${
          toast.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
        }`}>
          {toast.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          <span className="text-sm font-bold">{toast.message}</span>
        </div>
      )}

    </div>
  );
}
