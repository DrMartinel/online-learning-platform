"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Award, CheckCircle, XCircle, Clock, Loader2, FileText, Calendar, ArrowLeft } from 'lucide-react';


export default function ExamAttemptResultPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const router = useRouter();
  const { attemptId } = use(params);
  
  const [attempt, setAttempt] = useState<any>(null);
  const [examData, setExamData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [attemptId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const attemptRes = await fetch(`/api/exam-sessions/attempts/${attemptId}`);
      if (!attemptRes.ok) throw new Error('Không thể tải thông tin lượt thi');
      const attemptData = await attemptRes.json();
      setAttempt(attemptData);

      const examDataRes = await fetch(`/api/exam-sessions/attempts/${attemptId}/exam-data`);
      if (examDataRes.ok) {
        const data = await examDataRes.json();
        setExamData(data);
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi hệ thống');
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = () => {
    if (!attempt || !attempt.submitTime) return '--';
    const start = new Date(attempt.startTime).getTime();
    const end = new Date(attempt.submitTime).getTime();
    const diff = Math.floor((end - start) / 1000);
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    return `${m} phút ${s} giây`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  const isGraded = attempt.status === 'graded';
  const isSubmitted = attempt.status === 'submitted';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 pt-8">
      <div className="max-w-4xl mx-auto px-4">
        
        <button 
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={20} /> Trở về trang chủ
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 md:p-10 mb-8">
          <div className="text-center">
            {isGraded ? (
              <div className="w-20 h-20 bg-green-100 dark:bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award size={40} />
              </div>
            ) : isSubmitted ? (
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-500/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText size={40} />
              </div>
            ) : (
              <div className="w-20 h-20 bg-amber-100 dark:bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock size={40} />
              </div>
            )}

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {isGraded ? 'Kết quả làm bài' : isSubmitted ? 'Đã nộp bài' : 'Đang làm bài'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
              {isGraded 
                ? 'Bài thi của bạn đã được chấm điểm tự động.' 
                : isSubmitted 
                  ? 'Bài thi có chứa câu hỏi tự luận hoặc đang chờ giáo viên chấm điểm.'
                  : 'Bài thi này chưa được nộp.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Điểm số</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {attempt.score !== null ? attempt.score : '--'}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Thời gian làm</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                  <Clock size={18} className="text-gray-400" /> {calculateDuration()}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Ngày nộp</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2 mt-1">
                  <Calendar size={16} className="text-gray-400" /> 
                  {attempt.submitTime ? new Date(attempt.submitTime).toLocaleDateString('vi-VN') : '--'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Details section */}
        {examData && examData.questions && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white ml-2">Chi tiết bài làm</h2>
            
            {examData.questions.map((q: any, index: number) => {
              const variant = q.variants?.[0];
              if (!variant) return null;

              const isTrueFalse = q.tags?.includes('type:true_false') || variant.correctAnswer?.hasOwnProperty('trueIndices');
              const isMultipleChoice = q.type === 'multiple_choice' && !isTrueFalse;
              const isSingleChoice = q.type === 'single_choice' && !isTrueFalse;
              const isEssay = q.type === 'essay';

              const studentAnswer = attempt.answers?.[q.questionId];
              const correctAnswer = variant.correctAnswer;
              
              let isCorrect = false;
              let partialPoints = 0;

              if (isSingleChoice) {
                isCorrect = studentAnswer === correctAnswer?.index;
                if (isCorrect) partialPoints = q.points;
              } else if (isMultipleChoice) {
                const studentChoices = Array.isArray(studentAnswer) ? studentAnswer : (studentAnswer?.indices ?? studentAnswer?.optionIndices ?? []);
                const correctChoices = correctAnswer?.indices ?? correctAnswer?.optionIndices ?? [];
                isCorrect = studentChoices.length === correctChoices.length && studentChoices.every((val: any) => correctChoices.includes(val));
                if (isCorrect) partialPoints = q.points;
              } else if (isTrueFalse) {
                const trueIndices = correctAnswer?.trueIndices || [];
                const totalOptions = variant.options?.length || 4;
                let correctCount = 0;
                if (typeof studentAnswer === 'object' && !Array.isArray(studentAnswer)) {
                  for (let i = 0; i < totalOptions; i++) {
                     const studentVal = studentAnswer[i];
                     if (studentVal === 'true' || studentVal === 'false' || studentVal === true || studentVal === false) {
                       const isStudentTrue = studentVal === 'true' || studentVal === true;
                       const isActualTrue = trueIndices.includes(i);
                       if (isStudentTrue === isActualTrue) correctCount++;
                     }
                  }
                }
                isCorrect = correctCount === totalOptions;
                if (totalOptions === 4) {
                  if (correctCount === 1) partialPoints = q.points * 0.1;
                  else if (correctCount === 2) partialPoints = q.points * 0.25;
                  else if (correctCount === 3) partialPoints = q.points * 0.5;
                  else if (correctCount === 4) partialPoints = q.points;
                } else {
                  partialPoints = q.points * (correctCount / totalOptions);
                }
              }

              return (
                <div key={q.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
                  <div className="flex gap-4 mb-6">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold flex items-center justify-center">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Câu hỏi {index + 1}</span>
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-300">
                          {isGraded ? `${partialPoints} / ${q.points} điểm` : `${q.points} điểm`}
                        </span>
                        {!isEssay && isGraded && (
                          isCorrect ? (
                            <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                              <CheckCircle size={14} /> Đúng
                            </span>
                          ) : partialPoints > 0 ? (
                            <span className="flex items-center gap-1 text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                              <CheckCircle size={14} /> Đúng một phần
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                              <XCircle size={14} /> Sai
                            </span>
                          )
                        )}
                      </div>
                      <div 
                        className="prose dark:prose-invert max-w-none text-gray-900 dark:text-gray-100"
                        dangerouslySetInnerHTML={{ __html: variant.content }}
                      />
                    </div>
                  </div>

                  <div className="ml-0 sm:ml-12 space-y-4">
                    {/* Student & Correct Answer Display */}
                    
                    {isSingleChoice && variant.options && (
                      <div>
                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Đáp án:</p>
                        <div className="space-y-2">
                          {variant.options.map((opt: any, oIndex: number) => {
                            const isStudentSelected = studentAnswer === oIndex;
                            const isActualCorrect = correctAnswer?.index === oIndex;
                            let style = 'bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700';
                            let icon = null;
                            if (isGraded) {
                              if (isStudentSelected && isActualCorrect) {
                                style = 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200';
                                icon = <CheckCircle size={16} className="text-green-600" />;
                              } else if (isStudentSelected && !isActualCorrect) {
                                style = 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200';
                                icon = <XCircle size={16} className="text-red-600" />;
                              } else if (!isStudentSelected && isActualCorrect) {
                                style = 'bg-green-50/50 border-green-200 border-dashed text-green-800 dark:bg-green-900/10 dark:border-green-800 dark:text-green-200';
                                icon = <CheckCircle size={16} className="text-green-500 opacity-70" />;
                              }
                            } else if (isStudentSelected) {
                              style = 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200';
                            }
                            return (
                              <div key={oIndex} className={`p-4 rounded-xl border flex items-start gap-3 ${style}`}>
                                <div className="mt-0.5">{icon || <div className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"></div>}</div>
                                <div className="flex gap-2">
                                  <span className="font-bold">{opt.label}.</span>
                                  <span dangerouslySetInnerHTML={{ __html: opt.text }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {isMultipleChoice && variant.options && (
                      <div>
                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Đáp án:</p>
                        <div className="space-y-2">
                          {variant.options.map((opt: any, oIndex: number) => {
                            const studentChoices = Array.isArray(studentAnswer) ? studentAnswer : [];
                            const correctChoices = correctAnswer?.indices ?? [];
                            const isStudentSelected = studentChoices.includes(oIndex);
                            const isActualCorrect = correctChoices.includes(oIndex);
                            
                            let style = 'bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700';
                            let icon = null;
                            if (isGraded) {
                              if (isStudentSelected && isActualCorrect) {
                                style = 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200';
                                icon = <CheckCircle size={16} className="text-green-600" />;
                              } else if (isStudentSelected && !isActualCorrect) {
                                style = 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200';
                                icon = <XCircle size={16} className="text-red-600" />;
                              } else if (!isStudentSelected && isActualCorrect) {
                                style = 'bg-green-50/50 border-green-200 border-dashed text-green-800 dark:bg-green-900/10 dark:border-green-800 dark:text-green-200';
                                icon = <CheckCircle size={16} className="text-green-500 opacity-70" />;
                              }
                            } else if (isStudentSelected) {
                              style = 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200';
                            }
                            return (
                              <div key={oIndex} className={`p-4 rounded-xl border flex items-start gap-3 ${style}`}>
                                <div className="mt-0.5">{icon || <div className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600"></div>}</div>
                                <div className="flex gap-2">
                                  <span className="font-bold">{opt.label}.</span>
                                  <span dangerouslySetInnerHTML={{ __html: opt.text }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {isTrueFalse && variant.options && (
                      <div>
                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Đáp án:</p>
                        <div className="space-y-3">
                          {variant.options.map((opt: any, oIndex: number) => {
                            const studentAnsObj = typeof studentAnswer === 'object' ? studentAnswer : {};
                            const studentVal = studentAnsObj[oIndex];
                            const isStudentTrue = studentVal === 'true' || studentVal === true;
                            const isStudentFalse = studentVal === 'false' || studentVal === false;
                            const isActualTrue = correctAnswer?.trueIndices?.includes(oIndex) || false;
                            
                            return (
                              <div key={oIndex} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                <div className="text-gray-800 dark:text-gray-200 flex gap-2 flex-1">
                                  <span className="font-bold">{opt.label}.</span>
                                  <span dangerouslySetInnerHTML={{ __html: opt.text }} />
                                </div>
                                <div className="flex items-center gap-4 shrink-0 text-sm">
                                  {isGraded ? (
                                    <>
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-500">Bạn chọn:</span>
                                        {isStudentTrue ? <span className="font-medium text-blue-600">Đúng</span> : isStudentFalse ? <span className="font-medium text-blue-600">Sai</span> : <span className="italic text-gray-400">Trống</span>}
                                      </div>
                                      <div className="flex items-center gap-2 border-l border-gray-200 dark:border-gray-700 pl-4">
                                        <span className="text-gray-500">Đáp án:</span>
                                        <span className={`font-medium ${isStudentTrue === isActualTrue && (isStudentTrue || isStudentFalse) ? 'text-green-600' : 'text-red-600'}`}>
                                          {isActualTrue ? 'Đúng' : 'Sai'}
                                        </span>
                                        {(isStudentTrue || isStudentFalse) && isStudentTrue === isActualTrue && <CheckCircle size={16} className="text-green-600 ml-1" />}
                                        {(isStudentTrue || isStudentFalse) && isStudentTrue !== isActualTrue && <XCircle size={16} className="text-red-600 ml-1" />}
                                      </div>
                                    </>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <span className="text-gray-500">Đã chọn:</span>
                                      {isStudentTrue ? <span className="font-medium bg-green-50 text-green-700 px-2 py-1 rounded">Đúng</span> : isStudentFalse ? <span className="font-medium bg-red-50 text-red-700 px-2 py-1 rounded">Sai</span> : <span className="italic text-gray-400">Trống</span>}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {isEssay && (
                      <div>
                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Câu trả lời của bạn:</p>
                        <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
                          {studentAnswer ? (
                            <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">{studentAnswer}</p>
                          ) : (
                            <span className="text-gray-400 italic">Không trả lời</span>
                          )}
                        </div>
                        {isGraded && correctAnswer && correctAnswer.essayAnswer && (
                          <div className="mt-4">
                            <p className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2">Gợi ý đáp án / Bareme:</p>
                            <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl">
                              <p className="whitespace-pre-wrap text-green-800 dark:text-green-200">{correctAnswer.essayAnswer}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Explanation */}
                    {variant.explanation && (
                      <div className="mt-4 p-4 rounded-xl bg-blue-50/50 border border-blue-100 dark:bg-blue-900/10 dark:border-blue-800">
                        <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1 flex items-center gap-2">
                          <FileText size={16} /> Giải thích:
                        </p>
                        <div 
                          className="prose prose-sm dark:prose-invert text-blue-900 dark:text-blue-200"
                          dangerouslySetInnerHTML={{ __html: variant.explanation }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
