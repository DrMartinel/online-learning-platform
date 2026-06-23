"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Plus, Search, FileText, Link as LinkIcon, Eye, Edit, Trash2, Settings, BookOpen, Clock, 
  HelpCircle, Shield, Globe, Lock, Printer, Loader2, X, Play
} from 'lucide-react';

interface Exam {
  id: string;
  title: string;
  courseId: string | null;
  questionLabel: string;
  tags: string[];
  accessRights: string;
  createdAt: string;
  questions: any[];
}

export default function ExamsDashboard() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('Tất cả');

  // Custom Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | null }>({ message: '', type: null });

  // Custom Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; examId: string; examTitle: string }>({ isOpen: false, examId: '', examTitle: '' });

  // Custom Tag Modal State
  const [showTagModal, setShowTagModal] = useState(false);
  const [customTagName, setCustomTagName] = useState('');

  // States for Print Preview Modal inside admin exams list
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewExam, setPreviewExam] = useState<any | null>(null);
  const [previewConfig, setPreviewConfig] = useState<any | null>(null);
  const [previewQuestionLinks, setPreviewQuestionLinks] = useState<any[]>([]);
  const [previewHeaderHtml, setPreviewHeaderHtml] = useState('');
  const [katexLoaded, setKatexLoaded] = useState(false);

  // Dynamic KaTeX script injection for perfect formulas rendering
  useEffect(() => {
    if ((window as any).katex) {
      setKatexLoaded(true);
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js';
    script.onload = () => setKatexLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Parse exam config
  const parseExamConfig = (headerContent: string | null) => {
    const defaultConfig = {
      showIds: true,
      showPoints: true,
      parts: [{ id: 'default', title: 'Câu hỏi', questionLinkIds: [] }],
    };

    if (!headerContent) return { config: defaultConfig, rawHeader: '' };

    const configMatch = headerContent.match(/<!-- EXAM_CONFIG:([\s\S]*?):EXAM_CONFIG -->/);
    if (!configMatch) return { config: defaultConfig, rawHeader: headerContent };

    try {
      const parsed = JSON.parse(configMatch[1]);
      const rawHeader = headerContent.replace(/<!-- EXAM_CONFIG:[\s\S]*?:EXAM_CONFIG -->\n?/, '');
      return {
        config: {
          showIds: parsed.showIds ?? true,
          showPoints: parsed.showPoints ?? true,
          parts: parsed.parts?.length ? parsed.parts : defaultConfig.parts,
        },
        rawHeader,
      };
    } catch {
      return { config: defaultConfig, rawHeader: headerContent };
    }
  };

  const handleOpenPrintPreview = async (examId: string) => {
    try {
      setPreviewLoading(true);
      setShowPrintPreview(true);
      
      const res = await fetch(`/api/admin/exams/${examId}`);
      if (!res.ok) {
        showToast('Không tìm thấy tài liệu đề thi.', 'error');
        setShowPrintPreview(false);
        setPreviewLoading(false);
        return;
      }
      const data = await res.json();
      setPreviewExam(data);
      
      const { config, rawHeader } = parseExamConfig(data.headerContent);
      setPreviewConfig(config);
      setPreviewHeaderHtml(rawHeader);

      const linksWithQuestions: any[] = [];
      for (const qLink of data.questions) {
        try {
          const qRes = await fetch(`/api/admin/questions/${qLink.questionId}`);
          if (qRes.ok) {
            const fullQuestion = await qRes.json();
            linksWithQuestions.push({
              ...qLink,
              question: fullQuestion
            });
          } else {
            linksWithQuestions.push(qLink);
          }
        } catch {
          linksWithQuestions.push(qLink);
        }
      }

      // Sort by orderIndex
      const sorted = linksWithQuestions.sort((a, b) => a.orderIndex - b.orderIndex);
      
      // Assign unassigned to first part
      const allAssigned = new Set(config.parts.flatMap((p: any) => p.questionLinkIds));
      const unassigned = sorted.filter(l => !allAssigned.has(l.id)).map(l => l.id);
      if (unassigned.length > 0 && config.parts.length > 0) {
        config.parts[0].questionLinkIds = [...config.parts[0].questionLinkIds, ...unassigned];
      }
      
      setPreviewConfig({ ...config });
      setPreviewQuestionLinks(sorted);
      setPreviewLoading(false);
    } catch (e) {
      console.error(e);
      showToast('Lỗi khi tải bản in PDF.', 'error');
      setShowPrintPreview(false);
      setPreviewLoading(false);
    }
  };

  const renderLaTeX = (text: string): string => {
    if (!text) return '';
    if (!katexLoaded || !(window as any).katex) {
      return text.replace(/\n/g, '<br />');
    }

    const katex = (window as any).katex;

    try {
      let processed = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, math) => {
        try {
          return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
        } catch {
          return match;
        }
      });

      processed = processed.replace(/\$(.*?)\$/g, (match, math) => {
        try {
          return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
        } catch {
          return match;
        }
      });

      processed = processed.replace(/\*\*([\s\S]*?)\*\*/g, '<strong>$1</strong>');
      processed = processed.replace(/\*([\s\S]*?)\*/g, '<em>$1</em>');
      processed = processed.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;margin:8px 0;" />');

      return processed.replace(/\n/g, '<br />');
    } catch (e) {
      console.error('KaTeX rendering error:', e);
      return text.replace(/\n/g, '<br />');
    }
  };

  const getGlobalQuestionIndex = (linkId: string, config: any, questionLinkMap?: Record<string, any>) => {
    let idx = 0;
    if (!config || !config.parts) return 0;
    for (const part of config.parts) {
      for (const lid of part.questionLinkIds) {
        if (questionLinkMap && !questionLinkMap[lid]) continue;
        idx++;
        if (lid === linkId) return idx;
      }
    }
    return idx;
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: '', type: null });
    }, 4000);
  };

  // Hardcoded default tags for filters - cleared preset tags as requested
  const defaultTags = [
    'Tất cả'
  ];

  const [tags, setTags] = useState<string[]>(defaultTags);

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchExams();
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const [res, sessRes] = await Promise.all([
        fetch('/api/admin/exams'),
        fetch('/api/admin/exam-sessions')
      ]);

      if (res.ok) {
        const data = await res.json();
        setExams(data);

        // Dynamically add any tags from loaded exams to available filters
        const loadedTags = new Set<string>(['Tất cả']);
        data.forEach((e: Exam) => {
          (e.tags || []).forEach(t => loadedTags.add(t));
        });
        setTags(Array.from(loadedTags));
      }

      if (sessRes.ok) {
        const sessData = await sessRes.json();
        setSessions(sessData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExam = async () => {
    try {
      const res = await fetch('/api/admin/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Đề thi mới chưa đặt tên',
          questionLabel: 'Câu',
          tags: [],
          accessRights: 'private',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        showToast('Tạo tài liệu đề thi mới thành công!', 'success');
        router.push(`/exams/${data.id}/edit`);
      } else {
        showToast('Không thể tạo đề thi mới.', 'error');
      }
    } catch (error) {
      console.error('Failed to create exam:', error);
      showToast('Có lỗi xảy ra khi tạo đề thi.', 'error');
    }
  };

  const triggerDeleteConfirm = (id: string, title: string) => {
    setConfirmModal({ isOpen: true, examId: id, examTitle: title });
  };

  const executeDeleteExam = async () => {
    const id = confirmModal.examId;
    try {
      const res = await fetch(`/api/admin/exams/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setExams(exams.filter(e => e.id !== id));
        showToast('Đã xoá tài liệu đề thi thành công!', 'success');
      } else {
        showToast('Có lỗi xảy ra khi xoá tài liệu.', 'error');
      }
    } catch (error) {
      console.error('Failed to delete exam:', error);
      showToast('Có lỗi xảy ra khi xoá tài liệu.', 'error');
    } finally {
      setConfirmModal({ isOpen: false, examId: '', examTitle: '' });
    }
  };

  // Filter exams based on search query and tag selection
  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          exam.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === 'Tất cả' || exam.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  // Filter sessions based on search query
  const activeSessions = sessions.filter(s => s.status === 'active');
  const filteredSessions = activeSessions.filter(session => {
    return session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           session.id.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'public':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
            <Globe size={12} /> Công khai
          </span>
        );
      case 'link':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
            <LinkIcon size={12} /> Có liên kết
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
            <Lock size={12} /> Không công khai
          </span>
        );
    }
  };

  const isInstructor = user?.role === 'admin' || user?.role === 'operator';

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {isInstructor ? "Tài liệu đề thi" : "Kỳ thi đang diễn ra"}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {isInstructor 
              ? "Quản lý kho học liệu cá nhân của bạn." 
              : "Danh sách các kỳ thi đang được tổ chức và diễn ra."}
          </p>
        </div>
        {isInstructor && (
          <button
            onClick={handleCreateExam}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-semibold shadow-lg shadow-primary/20 hover:shadow-xl transition-all duration-300 ease-out"
          >
            <Plus size={20} /> Tạo mới
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-505" size={20} />
        <input
          type="text"
          placeholder={isInstructor ? "Nhập tên, mô tả, mã đề thi để tìm kiếm" : "Nhập tên kỳ thi để tìm kiếm"}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        />
      </div>

      {/* Tags Filter */}
      {isInstructor && (
        <div className="flex flex-wrap gap-2.5 items-center">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                selectedTag === tag
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'bg-white dark:bg-gray-900 text-gray-650 text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {tag}
            </button>
          ))}
          <button 
            onClick={() => setShowTagModal(true)}
            className="w-8 h-8 rounded-full border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium animate-pulse">Đang tải dữ liệu...</p>
          </div>
        ) : isInstructor ? (
          // Instructor view: Exams
          filteredExams.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center text-gray-400 dark:text-gray-600">
                <FileText size={32} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Không tìm thấy đề thi</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 max-w-xs">Hãy tạo tài liệu đề thi mới hoặc điều chỉnh bộ lọc tìm kiếm.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50 dark:bg-gray-800/20">
                    <th className="px-6 py-4">Tên đề thi</th>
                    <th className="px-6 py-4">Ngày sửa đổi</th>
                    <th className="px-6 py-4">Nội dung</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredExams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-gray-50/30 dark:hover:bg-gray-800/10 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 mt-1">
                            <FileText size={20} />
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-bold text-gray-900 dark:text-white text-base hover:text-primary transition-colors">
                              <Link href={`/exams/${exam.id}/questions`}>{exam.title}</Link>
                            </h4>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-500 dark:text-gray-400">
                                {exam.id.substring(0, 8).toUpperCase()}
                              </span>
                              {exam.tags.slice(0, 3).map((tag, idx) => (
                                <span key={idx} className="text-xs px-2 py-0.5 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium">
                                  {tag}
                                </span>
                              ))}
                              {exam.tags.length > 3 && (
                                <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 font-medium">
                                  +{exam.tags.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {new Date(exam.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-5 text-sm font-bold text-gray-900 dark:text-white">
                        {exam.questions?.length || 0} câu
                      </td>
                      <td className="px-6 py-5">
                        {getStatusBadge(exam.accessRights)}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <Link
                            href={`/exams/${exam.id}`}
                            title="Truy cập link đề thi"
                            className="p-2 rounded-xl border border-gray-100 dark:border-gray-800 text-gray-400 hover:text-primary hover:bg-gray-50 dark:hover:bg-gray-800 transition-all inline-block"
                          >
                            <LinkIcon size={16} />
                          </Link>
                          <button
                            onClick={() => handleOpenPrintPreview(exam.id)}
                            title="Xem PDF Preview"
                            className="p-2 rounded-xl border border-gray-100 dark:border-gray-800 text-gray-400 hover:text-primary hover:bg-gray-50 dark:hover:bg-gray-800 transition-all inline-block cursor-pointer"
                          >
                            <Eye size={16} />
                          </button>
                          <Link
                            href={`/exams/${exam.id}/edit`}
                            title="Thiết lập đề thi"
                            className="p-2 rounded-xl border border-gray-100 dark:border-gray-800 text-gray-400 hover:text-primary hover:bg-gray-50 dark:hover:bg-gray-800 transition-all inline-block"
                          >
                            <Settings size={16} />
                          </Link>
                          <button
                            onClick={() => triggerDeleteConfirm(exam.id, exam.title)}
                            title="Xoá tài liệu"
                            className="p-2 rounded-xl border border-red-50 dark:border-red-500/10 text-red-400 hover:text-red-655 hover:bg-red-55/10 dark:hover:bg-red-500/10 transition-all cursor-pointer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          // Student view: Exam Sessions (ongoing/active)
          filteredSessions.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center text-gray-400 dark:text-gray-600">
                <Clock size={32} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Không có kỳ thi nào đang diễn ra</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 max-w-xs">Hiện tại không có đợt tổ chức thi nào đang hoạt động.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50 dark:bg-gray-800/20">
                    <th className="px-6 py-4">Tên kỳ thi</th>
                    <th className="px-6 py-4">Thời gian bắt đầu</th>
                    <th className="px-6 py-4">Thời hạn kết thúc</th>
                    <th className="px-6 py-4">Thời lượng</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50/30 dark:hover:bg-gray-800/10 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 mt-1">
                            <Clock size={20} />
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-bold text-gray-900 dark:text-white text-base hover:text-primary transition-colors">
                              <Link href={`/exam-sessions/enter?sessionId=${session.id}`}>{session.title}</Link>
                            </h4>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-500 dark:text-gray-400">
                                {session.id.substring(0, 8).toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {new Date(session.startTime).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {new Date(session.endTime).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-6 py-5 text-sm font-bold text-gray-900 dark:text-white">
                        {session.durationMinutes} phút
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/exam-sessions/enter?sessionId=${session.id}`}
                            className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
                          >
                            <Play size={12} /> Vào thi ngay
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Beautiful Custom Confirm Delete Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Xác nhận xoá tài liệu</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Hành động này không thể hoàn tác.</p>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Bạn có chắc chắn muốn xoá tài liệu đề thi <strong className="text-gray-900 dark:text-white">"{confirmModal.examTitle}"</strong> khỏi kho học liệu?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmModal({ isOpen: false, examId: '', examTitle: '' })}
                className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-900 text-xs transition-colors"
              >
                Huỷ
              </button>
              <button
                onClick={executeDeleteExam}
                className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-colors shadow-lg shadow-rose-500/20"
              >
                Xoá tài liệu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Tag Input Prompt Modal */}
      {showTagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-6 mx-4 animate-in zoom-in-95 duration-200">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Thêm chủ đề mới</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Nhập tên chủ đề mới để phân loại học liệu của bạn.</p>
            </div>
            
            <input
              type="text"
              autoFocus
              placeholder="Ví dụ: Giải tích 1, HUST, Lập trình C..."
              value={customTagName}
              onChange={(e) => setCustomTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const trimmed = customTagName.trim();
                  if (trimmed) {
                    if (!tags.includes(trimmed)) {
                      setTags([...tags, trimmed]);
                    }
                    setCustomTagName('');
                    setShowTagModal(false);
                  }
                }
              }}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
            />
            
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCustomTagName('');
                  setShowTagModal(false);
                }}
                className="px-4.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Huỷ bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  const trimmed = customTagName.trim();
                  if (trimmed) {
                    if (!tags.includes(trimmed)) {
                      setTags([...tags, trimmed]);
                    }
                    setCustomTagName('');
                    setShowTagModal(false);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-xs font-bold text-white transition-all shadow-md shadow-primary/10"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== PRINT PREVIEW MODAL ===== */}
      {showPrintPreview && (
        <div className="fixed-print-modal-container fixed inset-0 z-50 flex flex-col bg-gray-900/90 backdrop-blur-md animate-in fade-in duration-200 print:bg-white print:p-0 print:m-0 text-white">
          {previewLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-sm font-semibold animate-pulse text-gray-300">Đang tải và lắp ráp tài liệu đề thi...</p>
            </div>
          ) : (
            <>
              <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                  body * {
                    visibility: hidden !important;
                  }
                  .fixed-print-modal-container, .fixed-print-modal-container * {
                    visibility: visible !important;
                  }
                  html, body, main, 
                  .min-h-screen, 
                  .flex-1,
                  .overflow-hidden,
                  .overflow-auto,
                  .print-sheet-wrapper {
                    overflow: visible !important;
                    height: auto !important;
                    max-height: none !important;
                    position: static !important;
                    display: block !important;
                    background: white !important;
                    color: black !important;
                  }
                  .fixed-print-modal-container {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    height: auto !important;
                    background: white !important;
                  }
                  .print-control-bar {
                    display: none !important;
                  }
                  .print-preview-sheet {
                    width: 100% !important;
                    max-width: 100% !important;
                    margin: 0 !important;
                    padding: 15mm 15mm !important;
                    box-shadow: none !important;
                    border: none !important;
                    background: white !important;
                    color: black !important;
                  }
                  .print-preview-sheet .print-q-label {
                    font-weight: 700 !important;
                  }
                  .break-inside-avoid {
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                  }
                }
              `}} />

              {/* Top Control Panel */}
              <div className="print-control-bar h-16 flex items-center justify-between px-6 bg-white/10 border-b border-white/10 z-10 shrink-0 print:hidden text-white">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <Printer size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">{previewExam?.title}</h4>
                    <p className="text-[10px] text-gray-400">Xem trước PDF đề thi thực tế trước khi in hoặc xuất bản.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setShowPrintPreview(false);
                      setPreviewExam(null);
                      setPreviewQuestionLinks([]);
                    }}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-all cursor-pointer"
                  >
                    Đóng Preview
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-4.5 py-2 rounded-xl bg-primary hover:bg-primary/95 text-xs font-bold transition-all shadow-md shadow-primary/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer size={14} /> Tải xuống
                  </button>
                </div>
              </div>

              {/* Print sheet */}
              <div className="print-sheet-wrapper flex-1 overflow-y-auto p-4 md:p-8 bg-gray-950/20 flex justify-center items-start print:bg-white print:p-0 print:overflow-visible">
                <div className="print-preview-sheet w-full max-w-[210mm] bg-white text-gray-900 shadow-2xl rounded-lg p-8 md:p-12 space-y-6 print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none print:w-full print:max-w-full" style={{ fontFamily: "'Times New Roman', 'Noto Serif', serif" }}>
                  
                  {/* Exam Header */}
                  <div className="space-y-4">
                    {previewHeaderHtml && (
                      <div 
                        className="text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: previewHeaderHtml }}
                      />
                    )}
                  </div>

                  {/* Questions by Parts */}
                  {previewConfig?.parts.map((part: any, partIdx: number) => {
                    const questionLinkMap: Record<string, any> = {};
                    previewQuestionLinks.forEach(l => { questionLinkMap[l.id] = l; });

                    const partQuestionLinks = part.questionLinkIds
                      .map((lid: string) => questionLinkMap[lid])
                      .filter(Boolean);
                    
                    if (partQuestionLinks.length === 0) return null;

                    return (
                      <div key={part.id} className="space-y-4">
                        <div className="text-center mt-4">
                          <h2 className="text-base font-bold uppercase tracking-wide" style={{ fontFamily: "'Times New Roman', 'Noto Serif', serif" }}>
                            {part.title}
                          </h2>
                        </div>

                        <div className="space-y-3">
                          {partQuestionLinks.map((link: any) => {
                            if (!link || !link.question) return null;
                            const q = link.question;
                            const firstVar = q.variants?.[0];
                            if (!firstVar) return null;
                            const globalIdx = getGlobalQuestionIndex(link.id, previewConfig, questionLinkMap);

                            return (
                              <div key={link.id} className="break-inside-avoid" style={{ fontSize: '11pt', lineHeight: '1.6' }}>
                                <div className="text-left" style={{ fontSize: '11pt', lineHeight: '1.6' }}>
                                  <span className="font-bold print-q-label mr-1 inline" style={{ fontFamily: "'Times New Roman', 'Noto Serif', serif" }}>
                                    {previewExam?.questionLabel} {globalIdx}
                                    {previewConfig.showIds && q.serialNumber && <span className="font-bold"> [ID:{q.serialNumber}]</span>}
                                    {previewConfig.showPoints && <span className="font-normal"> ({link.points} điểm)</span>}
                                    .
                                  </span>
                                  <span 
                                    className="render-math inline text-justify"
                                    dangerouslySetInnerHTML={{ __html: renderLaTeX(firstVar.content) }}
                                  />
                                </div>

                                {firstVar.options && firstVar.options.length > 0 && (
                                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 pl-6 mt-1">
                                    {firstVar.options.map((opt: any, oIdx: number) => (
                                      <div key={oIdx} className="flex items-start gap-1.5">
                                        <span className="font-bold shrink-0">{opt.label}.</span>
                                        <div 
                                          className="render-math flex-1 text-left"
                                          dangerouslySetInnerHTML={{ __html: renderLaTeX(opt.text) }}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Custom Toast Alert Component */}
      {toast.type && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border animate-in slide-in-from-bottom-5 duration-300 ${
          toast.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
            : toast.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
              : 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400'
        } bg-white dark:bg-gray-900`}>
          <div className={`w-2 h-2 rounded-full ${
            toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-rose-500' : 'bg-blue-500'
          }`} />
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
