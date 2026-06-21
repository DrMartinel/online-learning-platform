"use client";

import { useState, useEffect, use, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Save, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';


export default function ExamAttemptTakePage({ params }: { params: Promise<{ attemptId: string }> }) {
  const router = useRouter();
  const { attemptId } = use(params);
  
  const [attempt, setAttempt] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [examData, setExamData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [katexLoaded, setKatexLoaded] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Refs để tránh stale closure trong auto-submit khi hết giờ
  const submittingRef = useRef(false);
  const answersRef = useRef<Record<string, any>>({});
  const handleSubmitRef = useRef<((autoSubmit?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    // Check if katex is already on page
    if ((window as any).katex) {
      setKatexLoaded(true);
      return;
    }

    // Add KaTeX CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css';
    document.head.appendChild(link);

    // Add KaTeX Script
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js';
    script.onload = () => {
      setKatexLoaded(true);
    };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    fetchData();
  }, [attemptId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch attempt
      const attemptRes = await fetch(`/api/exam-sessions/attempts/${attemptId}`);
      if (!attemptRes.ok) throw new Error('Không thể tải thông tin làm bài');
      const attemptData = await attemptRes.json();
      
      if (attemptData.status !== 'inprogress') {
        router.push(`/exam-sessions/attempts/${attemptId}/result`);
        return;
      }
      
      setAttempt(attemptData);
      setAnswers(attemptData.answers || {});

      // 2. Fetch session
      const sessionRes = await fetch(`/api/exam-sessions/${attemptData.sessionId}`);
      if (!sessionRes.ok) throw new Error('Không thể tải thông tin đợt thi');
      const sessionData = await sessionRes.json();
      setSession(sessionData);

      // 3. Fetch exam data
      const examDataRes = await fetch(`/api/exam-sessions/attempts/${attemptId}/exam-data`);
      if (!examDataRes.ok) throw new Error('Không thể tải nội dung đề thi');
      const examDataJson = await examDataRes.json();
      setExamData(examDataJson);

      // 4. Calculate time left
      const startTime = new Date(attemptData.startTime).getTime();
      const endTimeByDuration = startTime + sessionData.durationMinutes * 60 * 1000;
      const sessionEndTime = new Date(sessionData.endTime).getTime();
      const finalEndTime = Math.min(endTimeByDuration, sessionEndTime);
      
      const updateTimer = () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((finalEndTime - now) / 1000));
        setTimeLeft(remaining);
      };
      
      updateTimer();
      const timerInterval = setInterval(updateTimer, 1000);
      
      return () => clearInterval(timerInterval);
    } catch (err: any) {
      setError(err.message || 'Lỗi không xác định');
    } finally {
      setLoading(false);
    }
  };

  // Auto-submit khi hết giờ — dùng ref để tránh stale closure và vòng lặp deps
  useEffect(() => {
    if (timeLeft !== null && timeLeft <= 0 && !submittingRef.current) {
      handleSubmitRef.current?.(true);
    }
  }, [timeLeft]);

  const handleAnswerChange = (questionId: string, value: any) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    answersRef.current = newAnswers; // Cập nhật ref để auto-submit dùng được answers mới nhất
    
    // Auto save with debounce
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setSaving(true);
    saveTimeoutRef.current = setTimeout(() => {
      saveProgress(newAnswers);
    }, 2000);
  };

  const saveProgress = async (currentAnswers: Record<string, any>) => {
    try {
      await fetch(`/api/exam-sessions/attempts/${attemptId}/save-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: currentAnswers }),
      });
    } catch (e) {
      console.error('Lỗi khi lưu bài', e);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = useCallback(async (autoSubmit = false) => {
    if (submittingRef.current) return;

    if (!autoSubmit && !window.confirm('Bạn có chắc chắn muốn nộp bài? Sau khi nộp sẽ không thể sửa lại.')) {
      return;
    }
    
    try {
      submittingRef.current = true;
      setSubmitting(true);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      
      // Dùng answersRef.current để lấy answers mới nhất, tránh stale closure
      const currentAnswers = autoSubmit ? answersRef.current : answers;
      
      const res = await fetch(`/api/exam-sessions/attempts/${attemptId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: currentAnswers }),
      });
      
      if (res.ok) {
        router.push(`/exam-sessions/attempts/${attemptId}/result`);
      } else {
        const data = await res.json();
        alert(data.error || 'Có lỗi khi nộp bài');
        submittingRef.current = false;
        setSubmitting(false);
      }
    } catch (e) {
      alert('Lỗi kết nối khi nộp bài');
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [answers, attemptId, router]);

  // Luôn cập nhật ref để auto-submit effect gọi được phiên bản mới nhất
  handleSubmitRef.current = handleSubmit;

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const renderLaTeX = (text: string) => {
    if (!katexLoaded || !(window as any).katex || !text) {
      return text;
    }
    const katex = (window as any).katex;
    
    // Replace block math $$...$$
    let parsedText = text.replace(/\$\$([\s\S]*?)\$\$/g, (match: string, math: string) => {
      try {
        return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
      } catch (e) {
        return match;
      }
    });

    // Replace inline math $...$
    parsedText = parsedText.replace(/\$([\s\S]*?)\$/g, (match: string, math: string) => {
      try {
        return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
      } catch (e) {
        return match;
      }
    });

    // Convert newlines to <br/>
    parsedText = parsedText.replace(/\n/g, '<br/>');

    return parsedText;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-center">
        <div className="max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Lỗi</h1>
          <p className="text-gray-500 mb-4">{error}</p>
          <button onClick={() => router.push('/exam-sessions/enter')} className="btn-primary px-4 py-2 rounded-lg">
            Trở về
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header Sticky */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-bold text-lg truncate flex-1">
            {examData?.exam?.title}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              {saving ? (
                <span className="flex items-center gap-1 text-amber-500"><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</span>
              ) : (
                <span className="flex items-center gap-1 text-green-500"><CheckCircle className="w-4 h-4" /> Đã lưu</span>
              )}
            </div>
            
            <div className={`flex items-center gap-2 font-mono text-lg font-bold px-3 py-1.5 rounded-lg ${timeLeft !== null && timeLeft < 300 ? 'bg-red-100 text-red-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'}`}>
              <Clock className="w-5 h-5" />
              {formatTime(timeLeft)}
            </div>

            <button 
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium shadow-sm flex items-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span className="hidden sm:inline">Nộp bài</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Main content - questions list */}
          <div className="flex-1 space-y-8 w-full">
            {examData?.exam?.headerContent && (
              <div 
                className="prose dark:prose-invert max-w-none bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
                dangerouslySetInnerHTML={{ __html: renderLaTeX(examData.exam.headerContent) }}
              />
            )}

            {examData?.questions?.map((q: any, index: number) => {
          // Simplification: assume first variant is used. In a real scenario, you might have specific variants assigned to attempts, or just pick the first.
          const variant = q.variants?.[0]; 
          if (!variant) return null;

          const isTrueFalse = q.tags?.includes('type:true_false');
          const isMultipleChoice = q.type === 'multiple_choice' && !isTrueFalse;
          const isSingleChoice = q.type === 'single_choice' && !isTrueFalse;
          const isEssay = q.type === 'essay';

          return (
            <div key={q.id} id={`question-${q.id}`} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
              <div className="flex gap-4 mb-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Câu hỏi {index + 1}</span>
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-300">
                      {q.points} điểm
                    </span>
                  </div>
                  <div 
                    className="prose dark:prose-invert max-w-none text-gray-900 dark:text-gray-100"
                    dangerouslySetInnerHTML={{ __html: renderLaTeX(variant.content) }}
                  />
                </div>
              </div>

              <div className="ml-0 sm:ml-12 mt-6">
                {isTrueFalse && variant.options && variant.options.length > 0 && (
                  <div className="space-y-3">
                    {variant.options.map((opt: any, oIndex: number) => {
                      const currentAnswer = answers[q.questionId]?.[oIndex];
                      return (
                        <div key={oIndex} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                          <div className="text-gray-800 dark:text-gray-200 flex gap-2 flex-1">
                            <span className="font-bold">{opt.label}.</span>
                            <span dangerouslySetInnerHTML={{ __html: renderLaTeX(opt.text) }} />
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer border transition-colors ${currentAnswer === 'true' ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-400' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'}`}>
                              <input 
                                type="radio" 
                                name={`q_${q.questionId}_${oIndex}`} 
                                value="true" 
                                checked={currentAnswer === 'true'} 
                                onChange={() => handleAnswerChange(q.questionId, { ...(answers[q.questionId] || {}), [oIndex]: 'true' })}
                                className="w-4 h-4 text-green-600 focus:ring-green-500"
                              />
                              <span className="font-medium text-sm">Đúng</span>
                            </label>
                            <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer border transition-colors ${currentAnswer === 'false' ? 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'}`}>
                              <input 
                                type="radio" 
                                name={`q_${q.questionId}_${oIndex}`} 
                                value="false" 
                                checked={currentAnswer === 'false'} 
                                onChange={() => handleAnswerChange(q.questionId, { ...(answers[q.questionId] || {}), [oIndex]: 'false' })}
                                className="w-4 h-4 text-red-600 focus:ring-red-500"
                              />
                              <span className="font-medium text-sm">Sai</span>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {isMultipleChoice && variant.options && variant.options.length > 0 && (
                  <div className="space-y-3">
                    {variant.options.map((opt: any, oIndex: number) => {
                      const currentAnswers = Array.isArray(answers[q.questionId]) ? answers[q.questionId] : [];
                      const isChecked = currentAnswers.includes(oIndex);
                      
                      return (
                        <label 
                          key={oIndex} 
                          className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer border transition-colors ${
                            isChecked 
                              ? 'border-primary bg-primary/5 dark:bg-primary/10' 
                              : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          }`}
                        >
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleAnswerChange(q.questionId, [...currentAnswers, oIndex]);
                              } else {
                                handleAnswerChange(q.questionId, currentAnswers.filter((idx: number) => idx !== oIndex));
                              }
                            }}
                            className="mt-1 w-4 h-4 rounded text-primary bg-gray-100 border-gray-300 focus:ring-primary dark:bg-gray-700 dark:border-gray-600"
                          />
                          <div className="text-gray-800 dark:text-gray-200 flex gap-2">
                            <span className="font-bold">{opt.label}.</span>
                            <span dangerouslySetInnerHTML={{ __html: renderLaTeX(opt.text) }} />
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}

                {isSingleChoice && variant.options && variant.options.length > 0 && (
                  <div className="space-y-3">
                    {variant.options.map((opt: any, oIndex: number) => {
                      const isChecked = answers[q.questionId] === oIndex;
                      return (
                        <label 
                          key={oIndex} 
                          className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer border transition-colors ${
                            isChecked 
                              ? 'border-primary bg-primary/5 dark:bg-primary/10' 
                              : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          }`}
                        >
                          <input 
                            type="radio"
                            name={`q_${q.questionId}`}
                            value={oIndex}
                            checked={isChecked}
                            onChange={() => handleAnswerChange(q.questionId, oIndex)}
                            className="mt-1 w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary dark:bg-gray-700 dark:border-gray-600"
                          />
                          <div className="text-gray-800 dark:text-gray-200 flex gap-2">
                            <span className="font-bold">{opt.label}.</span>
                            <span dangerouslySetInnerHTML={{ __html: renderLaTeX(opt.text) }} />
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}

                {isEssay && (
                  <textarea 
                    value={answers[q.questionId] || ''}
                    onChange={(e) => handleAnswerChange(q.questionId, e.target.value)}
                    placeholder="Nhập câu trả lời của bạn..."
                    className="w-full min-h-[150px] p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-gray-900 dark:text-white resize-y"
                  />
                )}
              </div>
            </div>
              );
            })}
          </div>

          {/* Right - Question Navigation Sidebar */}
          <div className="w-full lg:w-72 shrink-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm lg:sticky lg:top-24 space-y-4">
            <h4 className="font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-3">
              Mục lục câu hỏi
            </h4>
            <div className="grid grid-cols-5 gap-2 max-h-[60vh] overflow-y-auto pr-1">
              {examData?.questions?.map((q: any, index: number) => {
                let isAnswered = false;
                const ans = answers[q.questionId];
                if (ans !== undefined && ans !== null && ans !== '') {
                  if (Array.isArray(ans)) {
                    isAnswered = ans.length > 0;
                  } else if (typeof ans === 'object') {
                    isAnswered = Object.keys(ans).length > 0;
                  } else {
                    isAnswered = true;
                  }
                }
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      const el = document.getElementById(`question-${q.id}`);
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.classList.add('ring-2', 'ring-primary/50', 'transition-all', 'duration-300');
                        setTimeout(() => {
                          el.classList.remove('ring-2', 'ring-primary/50');
                        }, 2000);
                      }
                    }}
                    className={`h-10 rounded-xl text-sm font-bold flex items-center justify-center transition-all border ${
                      isAnswered 
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-primary/50 dark:hover:border-primary/50'
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
            
            <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span>Đã làm</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"></div>
                <span>Chưa làm</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
