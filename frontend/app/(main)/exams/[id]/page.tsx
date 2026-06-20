"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Eye, EyeOff, Save, Lock, Link as LinkIcon, Globe, FileText, CheckCircle2, 
  HelpCircle, ChevronDown, ChevronUp, Loader2, Sparkles, Edit3, Trash2, Image as ImageIcon, Check,
  Printer, Search, Play, Calendar, Users, Hash, X, BookOpen
} from 'lucide-react';
import { getSupabaseClient, getMediaUrl } from '@/lib/supabase';

interface QuestionVariant {
  id: string;
  content: string;
  options: { label: string; text: string }[] | null;
  correctAnswer: any | null;
  explanation: string | null;
}

interface Question {
  id: string;
  type: 'essay' | 'single_choice' | 'multiple_choice';
  tags: string[];
  variants: QuestionVariant[];
  serialNumber?: number;
}

interface ExamQuestionLink {
  id: string;
  questionId: string;
  orderIndex: number;
  points: number;
  question?: Question;
}

interface ExamPart {
  id: string;
  title: string;
  questionLinkIds: string[];
}

interface ExamConfig {
  showIds: boolean;
  showPoints: boolean;
  parts: ExamPart[];
}

interface Exam {
  id: string;
  title: string;
  headerContent: string | null;
  questionLabel: string;
  tags: string[];
  accessRights: string;
  createdAt?: string;
  questions: ExamQuestionLink[];
}

function parseExamConfig(headerContent: string | null): { config: ExamConfig; rawHeader: string } {
  const defaultConfig: ExamConfig = {
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
}

export default function PublicExamViewer() {
  const { id: examId } = useParams() as { id: string };
  const router = useRouter();

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [katexLoaded, setKatexLoaded] = useState(false);
  const [examConfig, setExamConfig] = useState<ExamConfig>({ showIds: true, showPoints: true, parts: [] });
  const [rawHeader, setRawHeader] = useState('');

  // States for accordion toggles (expanded explanations)
  const [expandedExplanations, setExpandedExplanations] = useState<Record<string, boolean>>({});

  // States for editable drafts (linkId -> explanation text)
  const [explanationDrafts, setExplanationDrafts] = useState<Record<string, string>>({});
  // States for editable drafts of correct answers
  const [correctAnswerDrafts, setCorrectAnswerDrafts] = useState<Record<string, any>>({});
  
  // States for tracking active inline editing inside drawers (questionId -> boolean)
  const [inlineEditingIds, setInlineEditingIds] = useState<Record<string, boolean>>({});
  // State for client-side storage uploads
  const [uploadingQuestionId, setUploadingQuestionId] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string>('');

  const [savingQuestionId, setSavingQuestionId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null });

  // Interactive practice states
  const [trueFalseAnswers, setTrueFalseAnswers] = useState<Record<string, Record<number, 'true' | 'false' | undefined>>>({});
  const [essayAnswers, setEssayAnswers] = useState<Record<string, string>>({});
  const [essayVerification, setEssayVerification] = useState<Record<string, boolean>>({});

  // Print Preview Modal State
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  // Active Solution popup modal states
  const [activeSolutionQuestion, setActiveSolutionQuestion] = useState<Question | null>(null);
  const [activeSolutionQuestionIdx, setActiveSolutionQuestionIdx] = useState<number>(0);
  const [activeSolutionQuestionPoints, setActiveSolutionQuestionPoints] = useState<number>(0);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  // Question navigation grid sidebar toggle
  const [showQuestionPalette, setShowQuestionPalette] = useState(true);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: '', type: null });
    }, 4000);
  };

  // Dynamic KaTeX stylesheet and script injection
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

  useEffect(() => {
    checkAdminRole();
    fetchExamData();
  }, [examId]);

  const checkAdminRole = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user?.role === 'admin') {
          setIsAdmin(true);
          setSessionToken(data.token || '');
        }
      }
    } catch (e) {
      console.error('Failed to verify admin status:', e);
    }
  };

  const fetchExamData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/exams/${examId}`);
      if (!res.ok) {
        showToast('Không tìm thấy tài liệu đề thi.', 'error');
        return;
      }
      const data: Exam = await res.json();
      
      const { config, rawHeader: rh } = parseExamConfig(data.headerContent);
      setExamConfig(config);
      setRawHeader(rh);
      setExam(data);

      const linksWithQuestions: ExamQuestionLink[] = [];
      const drafts: Record<string, string> = {};
      const answerDrafts: Record<string, any> = {};

      for (const qLink of data.questions) {
        try {
          const qRes = await fetch(`/api/admin/questions/${qLink.questionId}`);
          if (qRes.ok) {
            const fullQuestion: Question = await qRes.json();
            linksWithQuestions.push({
              ...qLink,
              question: fullQuestion
            });

            const firstVar = fullQuestion.variants?.[0];
            if (firstVar) {
              drafts[fullQuestion.id] = firstVar.explanation || '';
              answerDrafts[fullQuestion.id] = firstVar.correctAnswer || null;
            }
          } else {
            linksWithQuestions.push(qLink);
          }
        } catch {
          linksWithQuestions.push(qLink);
        }
      }

      setExplanationDrafts(drafts);
      setCorrectAnswerDrafts(answerDrafts);

      const sorted = linksWithQuestions.sort((a, b) => a.orderIndex - b.orderIndex);

      // Assign to parts if not already
      const allAssigned = new Set(config.parts.flatMap(p => p.questionLinkIds));
      const unassigned = sorted.filter(l => !allAssigned.has(l.id)).map(l => l.id);
      if (unassigned.length > 0 && config.parts.length > 0) {
        config.parts[0].questionLinkIds = [...config.parts[0].questionLinkIds, ...unassigned];
      }
      setExamConfig({ ...config });

      setExam({
        ...data,
        questions: sorted
      });
    } catch (error) {
      console.error('Failed to load exam data:', error);
      showToast('Có lỗi xảy ra khi tải đề thi.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Safe CDN LaTeX parsing function using KaTeX
  const renderLaTeX = (text: string): string => {
    if (!katexLoaded || !(window as any).katex || !text) {
      return (text || '').replace(/\n/g, '<br />');
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

      // Process Markdown bold **...**
      processed = processed.replace(/\*\*([\s\S]*?)\*\*/g, '<strong>$1</strong>');

      // Process Markdown italic *...*
      processed = processed.replace(/\*([\s\S]*?)\*/g, '<em>$1</em>');

      // Process markdown images
      processed = processed.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;margin:8px 0;" />');

      return processed.replace(/\n/g, '<br />');
    } catch (e) {
      console.error('KaTeX rendering error:', e);
      return text.replace(/\n/g, '<br />');
    }
  };

  // Get sequential question number
  const getGlobalQuestionIndex = (linkId: string): number => {
    const validLinkIds = examConfig.parts
      .flatMap(p => p.questionLinkIds)
      .filter(lid => {
        const qLink = questionLinkMap[lid];
        return qLink && qLink.question && qLink.question.variants?.[0];
      });
    const idx = validLinkIds.indexOf(linkId);
    if (idx >= 0) return idx + 1;
    
    // Fallback
    const allLinks = exam?.questions || [];
    const validLinks = allLinks.filter(l => l.question && l.question.variants?.[0]);
    const fallbackIdx = validLinks.findIndex(l => l.id === linkId);
    return fallbackIdx >= 0 ? fallbackIdx + 1 : validLinkIds.length + 1;
  };

  const handleUpdateExplanationDraft = (qId: string, value: string) => {
    setExplanationDrafts({
      ...explanationDrafts,
      [qId]: value
    });
  };

  const handleSelectCorrectOption = (qId: string, qType: string, optIdx: number) => {
    if (!inlineEditingIds[qId]) return;

    const currentAnswer = correctAnswerDrafts[qId];

    if (qType === 'single_choice') {
      setCorrectAnswerDrafts({
        ...correctAnswerDrafts,
        [qId]: { index: optIdx }
      });
    } else if (qType === 'multiple_choice') {
      const currentIndices = currentAnswer?.indices || [];
      const newIndices = currentIndices.includes(optIdx)
        ? currentIndices.filter((idx: number) => idx !== optIdx)
        : [...currentIndices, optIdx];

      setCorrectAnswerDrafts({
        ...correctAnswerDrafts,
        [qId]: { indices: newIndices }
      });
    }
  };

  const handleSaveExplanation = async (qId: string) => {
    try {
      setSavingQuestionId(qId);
      
      const payload = {
        explanation: explanationDrafts[qId] || '',
        correctAnswer: correctAnswerDrafts[qId] || null
      };

      const res = await fetch(`/api/admin/questions/${qId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast('Đã lưu đáp án & lời giải chi tiết thành công!', 'success');
        
        if (exam) {
          const updatedQuestions = exam.questions.map(qLink => {
            if (qLink.questionId === qId && qLink.question) {
              const updatedVariants = qLink.question.variants.map((v, vIdx) => {
                if (vIdx === 0) {
                  return {
                    ...v,
                    explanation: payload.explanation,
                    correctAnswer: payload.correctAnswer
                  };
                }
                return v;
              });
              return {
                ...qLink,
                question: {
                  ...qLink.question,
                  variants: updatedVariants
                }
              };
            }
            return qLink;
          });
          setExam({ ...exam, questions: updatedQuestions });
        }
      } else {
        showToast('Lưu thất bại. Vui lòng thử lại.', 'error');
      }
    } catch (e) {
      console.error('Failed to save explanation:', e);
      showToast('Có lỗi xảy ra khi lưu.', 'error');
    } finally {
      setSavingQuestionId(null);
    }
  };

  const handleDeleteExplanation = async (qId: string) => {
    try {
      setSavingQuestionId(qId);
      const payload = {
        explanation: '',
        correctAnswer: correctAnswerDrafts[qId] || null
      };

      const res = await fetch(`/api/admin/questions/${qId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast('Đã xoá lời giải thành công!', 'success');
        setExplanationDrafts(prev => ({ ...prev, [qId]: '' }));
        if (exam) {
          const updatedQuestions = exam.questions.map(qLink => {
            if (qLink.questionId === qId && qLink.question) {
              const updatedVariants = qLink.question.variants.map((v, vIdx) => {
                if (vIdx === 0) return { ...v, explanation: '' };
                return v;
              });
              return { ...qLink, question: { ...qLink.question, variants: updatedVariants } };
            }
            return qLink;
          });
          setExam({ ...exam, questions: updatedQuestions });
        }
      } else {
        showToast('Xoá thất bại. Vui lòng thử lại.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Có lỗi xảy ra khi xoá.', 'error');
    } finally {
      setSavingQuestionId(null);
    }
  };

  const handleStartInlineEdit = (qId: string) => {
    setInlineEditingIds(prev => ({ ...prev, [qId]: true }));
  };

  const handleCancelInlineEdit = (qId: string) => {
    setInlineEditingIds(prev => ({ ...prev, [qId]: false }));
    const qLink = exam?.questions.find(link => link.questionId === qId);
    const firstVar = qLink?.question?.variants?.[0];
    if (firstVar) {
      setExplanationDrafts(prev => ({ ...prev, [qId]: firstVar.explanation || '' }));
    }
  };

  const handleSaveInlineEdit = async (qId: string) => {
    await handleSaveExplanation(qId);
    setInlineEditingIds(prev => ({ ...prev, [qId]: false }));
  };

  const handleUploadImageForQuestion = async (qId: string, file: File) => {
    if (!file || !sessionToken) return;
    try {
      setUploadingQuestionId(qId);
      const supabase = getSupabaseClient(sessionToken);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `exams/images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('course-media')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const imageUrl = getMediaUrl(filePath);
      const markdownImage = `![Ảnh](${imageUrl})`;
      const currentDraft = explanationDrafts[qId] || '';
      
      setExplanationDrafts(prev => ({ 
        ...prev, 
        [qId]: currentDraft ? currentDraft + '\n' + markdownImage : markdownImage 
      }));
      
      showToast('Tải ảnh lên thành công!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Lỗi tải ảnh lên.', 'error');
    } finally {
      setUploadingQuestionId(null);
    }
  };

  if (loading || !exam) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium animate-pulse">Đang tải đề thi & bộ giải mã LaTeX...</p>
      </div>
    );
  }

  // Build a map for quick lookup
  const questionLinkMap: Record<string, ExamQuestionLink> = {};
  exam.questions.forEach(l => { questionLinkMap[l.id] = l; });

  // Generate exam code from id
  const examCode = exam.id.substring(0, 8).toUpperCase();
  const totalQuestions = exam.questions.filter(q => q.question).length;

  // Filter questions by search
  const filteredQuestionIds = searchQuery.trim()
    ? exam.questions
        .filter(q => {
          if (!q.question) return false;
          const idx = getGlobalQuestionIndex(q.id);
          const serial = q.question.serialNumber?.toString() || '';
          const content = q.question.variants?.[0]?.content || '';
          return (
            idx.toString().includes(searchQuery) ||
            serial.includes(searchQuery) ||
            content.toLowerCase().includes(searchQuery.toLowerCase())
          );
        })
        .map(q => q.id)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* === EXAM OVERVIEW CARD === */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 md:p-8 shadow-sm space-y-4">
          {/* Top row - date */}
          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
            <Calendar size={14} />
            <span>{exam.createdAt ? new Date(exam.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">
            {exam.title}
          </h1>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <Hash size={14} className="text-gray-400" />
              <span>Mã đề thi: <strong className="text-gray-900 dark:text-white">{examCode}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileText size={14} className="text-gray-400" />
              <span>Tổng số câu: <strong className="text-gray-900 dark:text-white">{totalQuestions}</strong></span>
            </div>
          </div>

          {/* Tags */}
          {exam.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {exam.tags.map((tag, idx) => (
                <span key={idx} className="text-xs px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Admin badge */}
          {isAdmin && (
            <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
              <Sparkles size={14} className="animate-pulse" />
              Quyền Admin: Chỉnh sửa trực tiếp trong Lời giải
            </div>
          )}
        </div>

        {/* === PDF PREVIEW LINK === */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 px-5 py-4 flex items-center justify-between shadow-sm flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500">
              <FileText size={18} />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              PDF của {exam.title}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const url = window.location.href;
                navigator.clipboard.writeText(url).then(() => {
                  showToast('Đã sao chép link đề thi!', 'success');
                }).catch(() => {
                  showToast('Không thể sao chép link.', 'error');
                });
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs transition-all cursor-pointer"
            >
              <LinkIcon size={14} /> Sao chép link
            </button>
            <button
              onClick={() => setShowPrintPreview(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs transition-all cursor-pointer"
            >
              <Play size={14} /> Xem ngay
            </button>
          </div>
        </div>

        {/* === SEARCH & TOGGLE NAV PALETTE === */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Danh sách câu hỏi</h2>
            <button
              onClick={() => setShowQuestionPalette(!showQuestionPalette)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                showQuestionPalette 
                  ? 'bg-primary/10 border-primary/20 text-primary' 
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <BookOpen size={14} /> {showQuestionPalette ? 'Ẩn mục lục câu hỏi' : 'Xem mục lục câu hỏi'}
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Nhập ID để tìm nhanh hoặc nội dung câu hỏi"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 shadow-sm"
            />
          </div>
        </div>

        {/* === LAYOUT GRID WITH PERSISTENT SIDEBAR QUESTION PALETTE === */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left - Questions List */}
          <div className="flex-1 space-y-8 w-full">
            {examConfig.parts.map((part, partIdx) => {
              const partQuestionLinks = part.questionLinkIds
                .map(lid => questionLinkMap[lid])
                .filter(Boolean)
                .filter(qLink => {
                  if (!qLink.question) return false;
                  if (!filteredQuestionIds) return true; // no active search
                  return filteredQuestionIds.includes(qLink.id);
                });

              if (partQuestionLinks.length === 0) return null;

              return (
                <div key={part.id} className="space-y-4">
                  {/* Part Header */}
                  <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 pb-2">
                    <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-extrabold">
                      {partIdx + 1}
                    </div>
                    <h3 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
                      {part.title}
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {partQuestionLinks.map((qLink) => {
                      const q = qLink.question!;
                      const firstVar = q.variants?.[0];
                      const globalIdx = getGlobalQuestionIndex(qLink.id);
                      
                      const currentAnswer = correctAnswerDrafts[q.id];
                      const currentExplanation = explanationDrafts[q.id] || '';

                      return (
                        <div 
                          key={q.id}
                          id={`question-card-${qLink.id}`}
                          className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 md:p-7 space-y-5 shadow-sm relative overflow-hidden transition-all duration-300"
                        >
                          {/* Card Header (Question Number, ID badge, points, and tags) */}
                          <div className="flex items-center justify-between border-b border-gray-50 dark:border-gray-800 pb-3 flex-wrap gap-2">
                            <span className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                              {exam.questionLabel} {globalIdx}
                              {examConfig.showIds && q.serialNumber && (
                                <span className="px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 font-bold text-[10px]">
                                  ID: {q.serialNumber}
                                </span>
                              )}
                              {examConfig.showPoints && (
                                <span className="text-gray-400 font-normal text-xs">
                                  ({qLink.points} điểm)
                                </span>
                              )}
                            </span>

                            {/* Two-part topics display */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {q.tags && q.tags.map((tag, tIdx) => {
                                if (tag.startsWith('main:')) {
                                  const val = tag.replace('main:', '');
                                  return (
                                    <span key={tIdx} className="text-[9px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider border border-blue-500/10">
                                      {val}
                                    </span>
                                  );
                                }
                                if (tag.startsWith('sub:')) {
                                  const val = tag.replace('sub:', '');
                                  return (
                                    <span key={tIdx} className="text-[9px] px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium border border-purple-500/10">
                                      {val}
                                    </span>
                                  );
                                }
                                return null;
                              })}
                            </div>
                          </div>

                          {/* Question Content */}
                          {firstVar && (
                            <div 
                              className="render-math text-gray-900 dark:text-white leading-relaxed font-medium text-sm"
                              dangerouslySetInnerHTML={{ __html: renderLaTeX(firstVar.content) }}
                            />
                          )}

                          {/* MCQ Options or True/False options or Essay answer input */}
                          {(() => {
                            const isTF = q.tags?.includes('type:true_false') || firstVar?.correctAnswer?.hasOwnProperty('trueIndices');
                            const isEssayWithAns = q.type === 'essay' && firstVar?.correctAnswer?.essayAnswer;

                            if (isEssayWithAns) {
                              return (
                                <div className="space-y-3 pl-2 max-w-md">
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      placeholder="Nhập đáp số..."
                                      value={essayAnswers[q.id] || ''}
                                      onChange={(e) => setEssayAnswers({ ...essayAnswers, [q.id]: e.target.value })}
                                      className="flex-1 px-4 py-2.5 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
                                    />
                                    <button
                                      onClick={() => {
                                        const studentAns = (essayAnswers[q.id] || '').trim().toLowerCase();
                                        const correctAns = String(firstVar.correctAnswer.essayAnswer).trim().toLowerCase();
                                        const normalize = (s: string) => s.replace(/\s+/g, ' ');
                                        const isCorrect = normalize(studentAns) === normalize(correctAns);
                                        setEssayVerification({ ...essayVerification, [q.id]: isCorrect });
                                      }}
                                      className="px-4 py-2.5 bg-primary text-white font-bold text-xs rounded-2xl hover:bg-primary/95 transition-all cursor-pointer shrink-0"
                                    >
                                      Kiểm tra
                                    </button>
                                  </div>
                                  {essayVerification[q.id] !== undefined && (
                                    <div className={`text-xs font-bold ${essayVerification[q.id] ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                      {essayVerification[q.id] ? 'Chính xác! 🎉' : 'Chưa đúng, thử lại nhé!'}
                                    </div>
                                  )}
                                </div>
                              );
                            }

                            if (isTF && firstVar?.options && firstVar.options.length > 0) {
                              return (
                                <div className="space-y-3 pl-2">
                                  {firstVar.options.map((opt, oIdx) => {
                                    const selection = trueFalseAnswers[q.id]?.[oIdx];
                                    return (
                                      <div key={oIdx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-gray-150 dark:border-gray-800 bg-gray-50/20 dark:bg-gray-950/20 shadow-sm">
                                        <div className="flex items-start gap-2">
                                          <span className="font-extrabold text-sm text-gray-900 dark:text-white">{opt.label})</span>
                                          <div 
                                            className="render-math font-medium text-sm text-gray-700 dark:text-gray-300 text-left"
                                            dangerouslySetInnerHTML={{ __html: renderLaTeX(opt.text) }}
                                          />
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
                                          <button
                                            onClick={() => {
                                              const current = trueFalseAnswers[q.id] || {};
                                              setTrueFalseAnswers({
                                                ...trueFalseAnswers,
                                                [q.id]: { ...current, [oIdx]: selection === 'true' ? undefined : 'true' }
                                              });
                                            }}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                              selection === 'true'
                                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                                                : 'bg-white dark:bg-gray-900 border-gray-250 dark:border-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                            }`}
                                          >
                                            Đúng
                                          </button>
                                          <button
                                            onClick={() => {
                                              const current = trueFalseAnswers[q.id] || {};
                                              setTrueFalseAnswers({
                                                ...trueFalseAnswers,
                                                [q.id]: { ...current, [oIdx]: selection === 'false' ? undefined : 'false' }
                                              });
                                            }}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                              selection === 'false'
                                                ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                                                : 'bg-white dark:bg-gray-900 border-gray-250 dark:border-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                            }`}
                                          >
                                            Sai
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            }

                            if (firstVar?.options && firstVar.options.length > 0) {
                              return (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pl-2">
                                  {firstVar.options.map((opt, oIdx) => (
                                    <div 
                                      key={oIdx} 
                                      className="flex items-start gap-2 text-sm p-3 rounded-2xl border transition-all bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300"
                                    >
                                      <span className="font-bold shrink-0 text-gray-900 dark:text-white">
                                        {opt.label}.
                                      </span>
                                      <div 
                                        className="render-math font-medium flex-1 text-left"
                                        dangerouslySetInnerHTML={{ __html: renderLaTeX(opt.text) }}
                                      />
                                    </div>
                                  ))}
                                </div>
                              );
                            }

                            return null;
                          })()}

                          {/* Bottom row (actions and metadata) */}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider bg-gray-50 dark:bg-gray-800/40 px-2.5 py-1 rounded-xl">
                              {q.type === 'essay' ? 'Tự luận' : (q.tags?.includes('type:true_false') || firstVar?.correctAnswer?.hasOwnProperty('trueIndices')) ? 'Đúng / Sai' : q.type === 'single_choice' ? 'Trắc nghiệm 1 đáp án' : 'Trắc nghiệm nhiều đáp án'}
                            </span>

                            {/* Explanation button to open Modal */}
                            {(firstVar?.explanation || firstVar?.correctAnswer || isAdmin) && (
                              <button
                                onClick={() => {
                                  setActiveSolutionQuestion(q);
                                  setActiveSolutionQuestionIdx(globalIdx);
                                  setActiveSolutionQuestionPoints(qLink.points);
                                }}
                                className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer transition-colors bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/10"
                              >
                                Xem lời giải ({firstVar?.explanation ? '1' : '0'})
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right - Sticky Question Palette Sidebar */}
          {showQuestionPalette && (
            <div className="w-full lg:w-72 shrink-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm lg:sticky lg:top-6 space-y-4 print-hide animate-in fade-in slide-in-from-right-3 duration-300">
              <div className="border-b border-gray-100 dark:border-gray-800 pb-3 flex items-center gap-2">
                <BookOpen size={16} className="text-primary animate-pulse" />
                <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Danh mục câu hỏi
                </h4>
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium leading-relaxed">
                Nhấn vào số câu để chuyển nhanh đến câu hỏi tương ứng trong đề thi, giúp luyện tập và rà soát cực kỳ thuận tiện.
              </p>
              <div className="grid grid-cols-5 gap-2 max-h-72 overflow-y-auto pr-1">
                {examConfig.parts.flatMap(part => 
                  part.questionLinkIds
                    .map(lid => questionLinkMap[lid])
                    .filter((l): l is ExamQuestionLink => !!l && !!l.question)
                ).map((qLink) => {
                  const globalIdx = getGlobalQuestionIndex(qLink.id);
                  return (
                    <button
                      key={qLink.id}
                      onClick={() => {
                        const el = document.getElementById(`question-card-${qLink.id}`);
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          // Add a premium active glow ring highlight
                          el.classList.add('ring-4', 'ring-primary/45', 'border-primary/50', 'scale-[1.01]', 'duration-300');
                          setTimeout(() => {
                            el.classList.remove('ring-4', 'ring-primary/45', 'border-primary/50', 'scale-[1.01]');
                          }, 2500);
                        }
                      }}
                      className="h-10 rounded-xl bg-gray-50 hover:bg-primary/10 hover:text-primary dark:bg-gray-800/50 hover:dark:bg-primary/10 text-gray-700 dark:text-gray-300 hover:border-primary/20 dark:hover:border-primary/20 font-extrabold text-sm border border-gray-100 dark:border-gray-800/80 cursor-pointer flex items-center justify-center transition-all shadow-sm"
                    >
                      {globalIdx}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ===== SOLUTION MODAL POPUP ===== */}
        {activeSolutionQuestion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0 bg-gray-50/50 dark:bg-gray-800/10">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="text-emerald-500" size={18} />
                    Đáp án & Lời giải chi tiết
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-semibold">
                    {exam.questionLabel} {activeSolutionQuestionIdx}
                    {activeSolutionQuestion.serialNumber && ` [ID: ${activeSolutionQuestion.serialNumber}]`}
                    {` (${activeSolutionQuestionPoints} điểm)`}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setActiveSolutionQuestion(null);
                    setInlineEditingIds(prev => ({ ...prev, [activeSolutionQuestion.id]: false }));
                  }}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Question Content inside solution modal */}
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-2">Đề bài</span>
                  <div 
                    className="render-math text-gray-900 dark:text-white leading-relaxed font-semibold text-sm animate-in fade-in duration-200"
                    dangerouslySetInnerHTML={{ __html: renderLaTeX(activeSolutionQuestion.variants?.[0]?.content || '') }}
                  />
                </div>

                {/* Editing Mode or Display Mode */}
                {inlineEditingIds[activeSolutionQuestion.id] ? (
                  /* ADMIN EDITING FORM INSIDE MODAL */
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-amber-500/10 pb-2">
                      <Sparkles size={14} className="animate-pulse" /> Chỉnh sửa đáp án & lời giải (Admin)
                    </h4>
                    
                    {/* Options Selector for Single/Multiple Choice */}
                    {activeSolutionQuestion.type !== 'essay' && activeSolutionQuestion.variants?.[0]?.options && (
                      <div className="space-y-2">
                        <label className="text-xs text-gray-500 font-bold">Chọn đáp án đúng:</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {activeSolutionQuestion.variants[0].options.map((opt, oIdx) => {
                            const isDraftCorrect = activeSolutionQuestion.type === 'single_choice'
                              ? correctAnswerDrafts[activeSolutionQuestion.id]?.index === oIdx
                              : correctAnswerDrafts[activeSolutionQuestion.id]?.indices?.includes(oIdx);

                            return (
                              <div 
                                key={oIdx} 
                                onClick={() => handleSelectCorrectOption(activeSolutionQuestion.id, activeSolutionQuestion.type, oIdx)}
                                className={`flex items-center justify-between text-xs p-3 rounded-xl border transition-all cursor-pointer ${
                                  isDraftCorrect 
                                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 font-bold' 
                                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                              >
                                <div className="flex items-start gap-1.5 flex-1 min-w-0">
                                  <span className="font-bold">{opt.label}.</span>
                                  <div 
                                    className="render-math truncate"
                                    dangerouslySetInnerHTML={{ __html: renderLaTeX(opt.text) }}
                                  />
                                </div>
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                  isDraftCorrect 
                                    ? 'bg-emerald-500 border-emerald-500 text-white' 
                                    : 'border-gray-300 dark:border-gray-700'
                                }`}>
                                  {isDraftCorrect && <span className="text-[10px] font-bold">✓</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Explanation Rich input */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-gray-500 font-bold">Lời giải chi tiết (Markdown/LaTeX):</label>
                        
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadImageForQuestion(activeSolutionQuestion.id, file);
                            }}
                            id={`modal-image-upload-${activeSolutionQuestion.id}`}
                            className="hidden"
                          />
                          <label
                            htmlFor={`modal-image-upload-${activeSolutionQuestion.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-bold cursor-pointer text-gray-600 dark:text-gray-300 transition-colors"
                          >
                            {uploadingQuestionId === activeSolutionQuestion.id ? (
                              <>
                                <Loader2 size={12} className="animate-spin" /> Đang tải ảnh...
                              </>
                            ) : (
                              <>
                                <ImageIcon size={12} /> Thêm ảnh từ máy
                              </>
                            )}
                          </label>
                        </div>
                      </div>

                      <textarea
                        rows={5}
                        value={explanationDrafts[activeSolutionQuestion.id] || ''}
                        onChange={(e) => handleUpdateExplanationDraft(activeSolutionQuestion.id, e.target.value)}
                        placeholder="Nhập lời giải chi tiết cho câu hỏi... Sử dụng $...$ cho LaTeX inline và $$...$$ cho công thức khối."
                        className="w-full p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-gray-900 dark:text-white"
                      />
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
                      <button
                        onClick={() => handleCancelInlineEdit(activeSolutionQuestion.id)}
                        className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        Huỷ bỏ
                      </button>
                      <button
                        onClick={() => handleSaveInlineEdit(activeSolutionQuestion.id)}
                        disabled={savingQuestionId === activeSolutionQuestion.id}
                        className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-md disabled:opacity-50 cursor-pointer"
                      >
                        {savingQuestionId === activeSolutionQuestion.id ? (
                          <>
                            <Loader2 size={12} className="animate-spin" /> Đang lưu...
                          </>
                        ) : (
                          <>
                            <Save size={12} /> Lưu thay đổi
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* STANDARD DISPLAY MODE */
                  <div className="space-y-6">
                    {/* Correct options for choice questions */}
                    {activeSolutionQuestion.type !== 'essay' && activeSolutionQuestion.variants?.[0]?.options && activeSolutionQuestion.variants[0].correctAnswer && (
                      <div className="space-y-3">
                        {(() => {
                          const var0 = activeSolutionQuestion.variants[0];
                          const isTF = activeSolutionQuestion.tags?.includes('type:true_false') || var0.correctAnswer?.hasOwnProperty('trueIndices');
                          
                          if (isTF) {
                            const trueIndices = var0.correctAnswer.trueIndices || [];
                            return (
                              <div className="space-y-2.5">
                                <span className="text-sm font-bold text-gray-800 dark:text-gray-200 block">Đáp án chi tiết các mệnh đề:</span>
                                <div className="space-y-2 pl-2">
                                  {var0.options?.map((opt, oIdx) => {
                                    const correctVal = trueIndices.includes(oIdx);
                                    const studentVal = trueFalseAnswers[activeSolutionQuestion.id]?.[oIdx];
                                    const isStudentCorrect = studentVal !== undefined && ((studentVal === 'true') === correctVal);
                                    
                                    return (
                                      <div key={oIdx} className="flex items-center justify-between text-xs p-3 rounded-2xl border border-gray-100 dark:border-gray-800/80 bg-gray-50/30 dark:bg-gray-800/10">
                                        <div className="flex items-start gap-1.5 min-w-0 flex-1">
                                          <span className="font-bold shrink-0">{opt.label})</span>
                                          <div 
                                            className="render-math text-gray-700 dark:text-gray-300 text-left font-medium"
                                            dangerouslySetInnerHTML={{ __html: renderLaTeX(opt.text) }}
                                          />
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0 ml-3">
                                          {studentVal !== undefined && (
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                              isStudentCorrect ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                            }`}>
                                              Bạn: {studentVal === 'true' ? 'Đúng' : 'Sai'}
                                            </span>
                                          )}
                                          <span className={`text-[10px] px-2.5 py-1 rounded-xl font-extrabold uppercase border ${
                                            correctVal 
                                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                                              : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                                          }`}>
                                            Đúng: {correctVal ? 'Đúng' : 'Sai'}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          } else {
                            // Show full option list with correct answers highlighted
                            const correctIndices: number[] = activeSolutionQuestion.type === 'single_choice'
                              ? (var0.correctAnswer?.index !== undefined ? [var0.correctAnswer.index] : [])
                              : (var0.correctAnswer?.indices || []);
                            return (
                              <div className="space-y-2.5">
                                <span className="text-sm font-bold text-gray-800 dark:text-gray-200 block">
                                  {activeSolutionQuestion.type === 'single_choice' ? 'Đáp án đúng:' : 'Các đáp án đúng:'}
                                </span>
                                <div className="grid grid-cols-1 gap-2 pl-0">
                                  {var0.options?.map((opt, oIdx) => {
                                    const isCorrect = correctIndices.includes(oIdx);
                                    return (
                                      <div
                                        key={oIdx}
                                        className={`flex items-start gap-2.5 text-sm p-3 rounded-2xl border transition-all ${
                                          isCorrect
                                            ? 'bg-emerald-500/8 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                                            : 'bg-gray-50/50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-400'
                                        }`}
                                      >
                                        <span className={`font-extrabold shrink-0 text-xs mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ${
                                          isCorrect
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                        }`}>
                                          {opt.label}
                                        </span>
                                        <div
                                          className="render-math font-medium flex-1 text-left leading-relaxed"
                                          dangerouslySetInnerHTML={{ __html: renderLaTeX(opt.text) }}
                                        />
                                        {isCorrect && (
                                          <span className="shrink-0 text-emerald-500">
                                            <Check size={16} strokeWidth={2.5} />
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    )}

                    {/* Essay answer for essay questions */}
                    {activeSolutionQuestion.type === 'essay' && activeSolutionQuestion.variants?.[0]?.correctAnswer?.essayAnswer && (
                      <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <span>Đáp số chính xác:</span>
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-extrabold border border-emerald-500/20">
                          {activeSolutionQuestion.variants[0].correctAnswer.essayAnswer}
                        </span>
                      </div>
                    )}

                    {/* Explanation text */}
                    {activeSolutionQuestion.variants?.[0]?.explanation ? (
                      <div className="space-y-2">
                        <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Lời giải chi tiết:</div>
                        <div 
                          className="render-math text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium text-left border-l-4 border-primary/20 pl-4 py-1"
                          dangerouslySetInnerHTML={{ __html: renderLaTeX(activeSolutionQuestion.variants[0].explanation) }}
                        />
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 dark:text-gray-500 italic">Chưa có lời giải chi tiết cho câu hỏi này.</p>
                    )}

                    {/* Admin controls */}
                    {isAdmin && (
                      <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <button
                          onClick={() => handleStartInlineEdit(activeSolutionQuestion.id)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 transition-all border border-gray-200 dark:border-gray-800 cursor-pointer"
                        >
                          <Edit3 size={12} /> Chỉnh sửa
                        </button>
                        {activeSolutionQuestion.variants?.[0]?.explanation && (
                          <button
                            onClick={() => {
                              if (confirm('Bạn có chắc chắn muốn xoá lời giải này?')) {
                                handleDeleteExplanation(activeSolutionQuestion.id);
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50/50 hover:bg-red-50 dark:bg-red-950/20 dark:hover:bg-red-950/30 text-xs font-bold text-red-600 dark:text-red-400 transition-all border border-red-100 dark:border-red-900/30 cursor-pointer"
                          >
                            <Trash2 size={12} /> Xoá lời giải
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Footer */}
              <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end bg-gray-50/30 dark:bg-gray-800/10 shrink-0">
                <button
                  onClick={() => {
                    setActiveSolutionQuestion(null);
                    setInlineEditingIds(prev => ({ ...prev, [activeSolutionQuestion.id]: false }));
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== PRINT PREVIEW MODAL ===== */}
        {showPrintPreview && (
          <div className="fixed-print-modal-container fixed inset-0 z-50 flex flex-col bg-gray-900/90 backdrop-blur-md animate-in fade-in duration-200 print:bg-white print:p-0 print:m-0">
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

            {/* Top Banner Control Panel (Hidden on Print) */}
            <div className="print-control-bar h-16 flex items-center justify-between px-6 bg-white/10 border-b border-white/10 z-10 shrink-0 print:hidden text-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Printer size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold">{exam.title}</h4>
                  <p className="text-[10px] text-gray-400">Xem trước bố cục tài liệu trước khi xuất bản PDF hoặc in ấn.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowPrintPreview(false)}
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

            {/* Scrollable sheet container */}
            <div className="print-sheet-wrapper flex-1 overflow-y-auto p-4 md:p-8 bg-gray-950/20 flex justify-center items-start print:bg-white print:p-0 print:overflow-visible">
              <div className="print-preview-sheet w-full max-w-[210mm] bg-white text-gray-900 shadow-2xl rounded-lg p-8 md:p-12 space-y-6 print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none print:w-full print:max-w-full" style={{ fontFamily: "'Times New Roman', 'Noto Serif', serif" }}>
                
                {/* Exam Header */}
                <div className="space-y-4">
                  {rawHeader && (
                    <div 
                      className="text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: rawHeader }}
                    />
                  )}
                </div>

                {/* Exam Questions List — Academic style */}
                {examConfig.parts.map((part, partIdx) => {
                  const partQuestionLinks = part.questionLinkIds
                    .map(lid => questionLinkMap[lid])
                    .filter(Boolean);
                  
                  if (partQuestionLinks.length === 0) return null;

                  return (
                    <div key={part.id} className="space-y-4">
                      {/* Part Title */}
                      <div className="text-center mt-4">
                        <h2 className="text-base font-bold uppercase tracking-wide" style={{ fontFamily: "'Times New Roman', 'Noto Serif', serif" }}>
                          {part.title}
                        </h2>
                      </div>

                      {/* Questions */}
                      <div className="space-y-3">
                        {partQuestionLinks.map((link) => {
                          if (!link || !link.question) return null;
                          const q = link.question;
                          const firstVar = q.variants?.[0];
                          if (!firstVar) return null;
                          const globalIdx = getGlobalQuestionIndex(link.id);

                          return (
                            <div key={link.id} className="break-inside-avoid" style={{ fontSize: '11pt', lineHeight: '1.6' }}>
                              <div className="text-left" style={{ fontSize: '11pt', lineHeight: '1.6' }}>
                                <span className="font-bold print-q-label mr-1 inline" style={{ fontFamily: "'Times New Roman', 'Noto Serif', serif" }}>
                                  {exam.questionLabel} {globalIdx}
                                  {examConfig.showIds && q.serialNumber && <span className="font-bold"> [ID:{q.serialNumber}]</span>}
                                  {examConfig.showPoints && <span className="font-normal"> ({link.points} điểm)</span>}
                                  .
                                </span>
                                <span 
                                  className="render-math inline text-justify"
                                  dangerouslySetInnerHTML={{ __html: renderLaTeX(firstVar.content) }}
                                />
                              </div>

                              {/* Options */}
                              {firstVar.options && firstVar.options.length > 0 && (
                                <div className={q.tags?.includes('type:true_false') || firstVar.correctAnswer?.hasOwnProperty('trueIndices') ? "space-y-1 pl-6 mt-1" : "grid grid-cols-2 gap-x-6 gap-y-1 pl-6 mt-1"}>
                                  {firstVar.options.map((opt, oIdx) => {
                                    const isTF = q.tags?.includes('type:true_false') || firstVar.correctAnswer?.hasOwnProperty('trueIndices');
                                    return (
                                      <div key={oIdx} className="flex items-start justify-between gap-1.5">
                                        <div className="flex items-start gap-1.5">
                                          <span className="font-bold shrink-0">{opt.label}{isTF ? ')' : '.'}</span>
                                          <div 
                                            className="render-math flex-1 text-left"
                                            dangerouslySetInnerHTML={{ __html: renderLaTeX(opt.text) }}
                                          />
                                        </div>
                                        {isTF && (
                                          <span className="text-[10pt] font-normal text-gray-400 shrink-0 select-none ml-4">
                                            [ Đúng / Sai ]
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
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
          </div>
        )}

      </div>

      {/* Custom Toast Alert Component */}
      {toast.type && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border animate-in slide-in-from-bottom-5 duration-300 ${
          toast.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
        } bg-white dark:bg-gray-900`}>
          <div className={`w-2 h-2 rounded-full ${
            toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
          }`} />
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
