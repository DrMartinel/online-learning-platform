"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Plus, Save, Edit, Trash2, Printer, Search, Copy, Scissors, Eye, EyeOff,
  CheckCircle, FileText, ChevronDown, ChevronUp, FileCode, Check, Grid, RefreshCw, X, Image as ImageIcon, Loader2,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, HelpCircle, Settings, Hash, Award, GripVertical, Layers
} from 'lucide-react';
import { getSupabaseClient, getMediaUrl } from '@/lib/supabase';

// ===== INTERFACES =====

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
  questions: ExamQuestionLink[];
}

// ===== HELPERS =====

function generatePartId(): string {
  return 'part_' + Math.random().toString(36).substring(2, 10);
}

function parseExamConfig(headerContent: string | null): { config: ExamConfig; rawHeader: string } {
  const defaultConfig: ExamConfig = {
    showIds: true,
    showPoints: true,
    parts: [{ id: generatePartId(), title: 'Câu hỏi', questionLinkIds: [] }],
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

function serializeExamConfig(config: ExamConfig, rawHeader: string): string {
  const configStr = JSON.stringify({
    showIds: config.showIds,
    showPoints: config.showPoints,
    parts: config.parts,
  });
  const configBlock = `<!-- EXAM_CONFIG:${configStr}:EXAM_CONFIG -->\n`;
  return configBlock + rawHeader;
}

// ===== MAIN COMPONENT =====

export default function ExamQuestionsEditor() {
  const router = useRouter();
  const { id: examId } = useParams() as { id: string };
  const hasTriggeredAutoPrint = useRef(false);

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Custom Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: '', type: null });
    }, 4000);
  };
  
  // Script loaded state for KaTeX CDN
  const [katexLoaded, setKatexLoaded] = useState(false);

  // Header editor states
  const [activeHeaderEdit, setActiveHeaderEdit] = useState(true);
  const [headerDraft, setHeaderDraft] = useState('');
  const headerEditorRef = useRef<HTMLDivElement>(null);
  const isHeaderInitialized = useRef(false);
  
  // Exam config
  const [examConfig, setExamConfig] = useState<ExamConfig>({
    showIds: true,
    showPoints: true,
    parts: [{ id: generatePartId(), title: 'Câu hỏi', questionLinkIds: [] }],
  });
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [activePartTab, setActivePartTab] = useState<string>('');
  
  // Question states
  const [questionLinks, setQuestionLinks] = useState<ExamQuestionLink[]>([]);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const [questionMainTopics, setQuestionMainTopics] = useState<Record<string, string>>({});
  const [questionSubTopics, setQuestionSubTopics] = useState<Record<string, string>>({});
  const [availableSubTopics, setAvailableSubTopics] = useState<string[]>([]);
  
  // Custom draft content for editing each question variant
  const [variantsDraft, setVariantsDraft] = useState<Record<string, string>>({});

  // Question bank modal state
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [bankQuestions, setBankQuestions] = useState<Question[]>([]);
  const [searchingBank, setSearchingBank] = useState(false);
  const [insertPosition, setInsertPosition] = useState<{ partId: string; index: number } | null>(null);

  // Print Preview Modal State
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Image Uploading States
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string>('');

  // Dynamic KaTeX stylesheet and script injection
  useEffect(() => {
    // Check if katex is already on page
    if ((window as any).katex) {
      setKatexLoaded(true);
      return;
    }

    // Insert stylesheet
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css';
    document.head.appendChild(link);

    // Insert script
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js';
    script.onload = () => setKatexLoaded(true);
    document.head.appendChild(script);
  }, []);

  const fetchSessionToken = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setSessionToken(data.token || '');
      }
    } catch (e) {
      console.error('Failed to fetch session token:', e);
    }
  };

  useEffect(() => {
    fetchSessionToken();
    fetchExamAndQuestions();
  }, [examId]);

  // Trigger auto-print if ?print=true or ?preview=true is present once everything is loaded
  useEffect(() => {
    if (!loading && exam && questionLinks.length > 0 && !hasTriggeredAutoPrint.current) {
      const { searchParams } = new URL(window.location.href);
      if (searchParams.get('print') === 'true' || searchParams.get('preview') === 'true') {
        hasTriggeredAutoPrint.current = true;
        setShowPrintPreview(true);
      }
    }
  }, [loading, exam, questionLinks]);

  // Auto-load questions from the question bank when showBankModal is opened
  useEffect(() => {
    if (showBankModal) {
      const loadInitialQuestions = async () => {
        try {
          setSearchingBank(true);
          const res = await fetch('/api/admin/questions');
          if (res.ok) {
            const data = await res.json();
            setBankQuestions(data);
          }
        } catch (error) {
          console.error('Failed to load initial questions from bank:', error);
        } finally {
          setSearchingBank(false);
        }
      };
      loadInitialQuestions();
    }
  }, [showBankModal]);

  const fetchExamAndQuestions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/exams/${examId}`);
      if (res.ok) {
        const data: Exam = await res.json();
        setExam(data);
        
        // Parse config from headerContent
        const { config, rawHeader } = parseExamConfig(data.headerContent);
        setExamConfig(config);
        isHeaderInitialized.current = false;
        setHeaderDraft(rawHeader);
        
        // Initialize activePartTab
        if (config.parts && config.parts.length > 0) {
          setActivePartTab(prev => {
            if (prev && config.parts.some(p => p.id === prev)) {
              return prev;
            }
            return config.parts[0].id;
          });
        }
        
        // Fetch detailed questions for each question link
        const linksWithQuestions: ExamQuestionLink[] = [];
        for (const qLink of data.questions) {
          try {
            const qRes = await fetch(`/api/admin/questions/${qLink.questionId}`);
            if (qRes.ok) {
              const fullQuestion: Question = await qRes.json();
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
        const sortedLinks = linksWithQuestions.sort((a, b) => a.orderIndex - b.orderIndex);
        setQuestionLinks(sortedLinks);

        // Populate draft content from first variant and topics
        const initialDrafts: Record<string, string> = {};
        const initialExpanded: Record<string, boolean> = {};
        const initialMainTopics: Record<string, string> = {};
        const initialSubTopics: Record<string, string> = {};
        
        sortedLinks.forEach(link => {
          initialExpanded[link.id] = true;
          if (link.question) {
            const tags = link.question.tags || [];
            const main = tags.find(t => t.startsWith('main:'))?.replace('main:', '') || '';
            const sub = tags.find(t => t.startsWith('sub:'))?.replace('sub:', '') || '';
            initialMainTopics[link.question.id] = main;
            initialSubTopics[link.question.id] = sub;

            if (link.question.variants.length > 0) {
              const variant = link.question.variants[0];
              initialDrafts[link.id] = serializeVariantToText(variant, link.question.type);
            }
          }
        });
        setVariantsDraft(initialDrafts);
        setExpandedQuestions(initialExpanded);
        setQuestionMainTopics(initialMainTopics);
        setQuestionSubTopics(initialSubTopics);

        // Collect sub-topics
        const subTags = new Set<string>();
        sortedLinks.forEach(link => {
          if (link.question) {
            link.question.tags.forEach(t => {
              if (t.startsWith('sub:')) {
                subTags.add(t.replace('sub:', ''));
              }
            });
          }
        });

        // Fetch from existing DB questions to get historical sub-topics
        try {
          const bankRes = await fetch('/api/admin/questions');
          if (bankRes.ok) {
            const bankData = await bankRes.json();
            bankData.forEach((q: any) => {
              if (q.tags) {
                q.tags.forEach((t: string) => {
                  if (t.startsWith('sub:')) {
                    subTags.add(t.replace('sub:', ''));
                  }
                });
              }
            });
          }
        } catch (err) {
          console.error('Failed to pre-fetch subtopics:', err);
        }
        setAvailableSubTopics(Array.from(subTags));

        // Assign unassigned links to the first part
        const allAssigned = new Set(config.parts.flatMap(p => p.questionLinkIds));
        const unassigned = sortedLinks.filter(l => !allAssigned.has(l.id)).map(l => l.id);
        if (unassigned.length > 0 && config.parts.length > 0) {
          const updatedParts = [...config.parts];
          updatedParts[0] = {
            ...updatedParts[0],
            questionLinkIds: [...updatedParts[0].questionLinkIds, ...unassigned],
          };
          setExamConfig(prev => ({ ...prev, parts: updatedParts }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch exam questions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper: serialize entity variant to editable raw text representation
  const serializeVariantToText = (variant: QuestionVariant, type: string, tags?: string[]): string => {
    let text = variant.content;
    const isTrueFalse = tags?.includes('type:true_false') || variant.correctAnswer?.hasOwnProperty('trueIndices');

    if (isTrueFalse && variant.options) {
      const trueIndices = variant.correctAnswer?.trueIndices || [];
      variant.options.forEach((opt, idx) => {
        const isCorrect = trueIndices.includes(idx);
        text += `\n${isCorrect ? '*' : ''}${opt.label}) ${opt.text}`;
      });
    } else if ((type === 'single_choice' || type === 'multiple_choice') && variant.options) {
      const correctIndices = type === 'single_choice'
        ? [variant.correctAnswer?.index]
        : (variant.correctAnswer?.indices || []);

      variant.options.forEach((opt, idx) => {
        const isCorrect = correctIndices.includes(idx);
        text += `\n${isCorrect ? '*' : ''}${opt.label}. ${opt.text}`;
      });
    } else if (type === 'essay' && variant.correctAnswer?.essayAnswer) {
      text += `\nĐS: ${variant.correctAnswer.essayAnswer}`;
    }
    return text;
  };

  // Helper: parse raw draft text to dynamic structure (content, options, type, correctAnswer)
  const parseTextToQuestion = (text: string): {
    content: string;
    type: 'essay' | 'single_choice' | 'multiple_choice';
    isTrueFalse?: boolean;
    options: { label: string; text: string }[] | null;
    correctAnswer: any | null;
  } => {
    const lines = text.split('\n');
    let contentLines: string[] = [];
    let options: { label: string; text: string }[] = [];
    let correctIndices: number[] = [];
    let isTrueFalse = false;

    // Match lines like A. or *B. or *C) or D) or a) or *b)
    const optionRegex = /^(\*?)([A-Za-z])([\.\\)])\s*(.*)$/;

    lines.forEach((line) => {
      const match = line.trim().match(optionRegex);
      if (match) {
        const isCorrect = !!match[1];
        const label = match[2];
        const optionText = match[4];
        options.push({ label, text: optionText });
        if (isCorrect) {
          correctIndices.push(options.length - 1);
        }
        // If the label is lowercase, it's True/False
        if (/[a-z]/.test(label)) {
          isTrueFalse = true;
        }
      } else {
        if (options.length === 0) {
          contentLines.push(line);
        } else {
          if (line.trim() !== '') {
            options[options.length - 1].text += ' ' + line.trim();
          }
        }
      }
    });

    let content = contentLines.join('\n').trim();
    let essayAnswer: string | null = null;

    if (options.length === 0) {
      // Check for ĐS: in essay questions
      const newContentLines: string[] = [];
      contentLines.forEach(line => {
        const dsMatch = line.trim().match(/^[đĐ][sS]\s*:\s*(.*)$/);
        if (dsMatch) {
          essayAnswer = dsMatch[1].trim();
        } else {
          newContentLines.push(line);
        }
      });
      content = newContentLines.join('\n').trim();

      return {
        content,
        type: 'essay',
        options: [],
        correctAnswer: essayAnswer ? { essayAnswer } : null,
      };
    } else {
      if (isTrueFalse) {
        return {
          content,
          type: 'multiple_choice',
          isTrueFalse: true,
          options,
          correctAnswer: { trueIndices: correctIndices }
        };
      } else {
        const isMultiple = correctIndices.length > 1;
        return {
          content,
          type: isMultiple ? 'multiple_choice' : 'single_choice',
          options,
          correctAnswer: isMultiple 
            ? { indices: correctIndices }
            : correctIndices.length === 1 
              ? { index: correctIndices[0] }
              : null
        };
      }
    }
  };

  // Safe CDN LaTeX parsing function using KaTeX with Markdown and LaTeX formatting extensions
  const renderLaTeX = (text: string): string => {
    if (!text) return '';
    if (!katexLoaded || !(window as any).katex) {
      return text.replace(/\n/g, '<br />');
    }

    const katex = (window as any).katex;

    try {
      // 1. Process block math $$...$$
      let processed = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, math) => {
        try {
          return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
        } catch {
          return match;
        }
      });

      // 2. Process inline math $...$
      processed = processed.replace(/\$(.*?)\$/g, (match, math) => {
        try {
          return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
        } catch {
          return match;
        }
      });

      // 3. Process LaTeX bold \textbf{...}
      processed = processed.replace(/\\textbf\{([\s\S]*?)\}/g, '<strong>$1</strong>');

      // 4. Process LaTeX italic \textit{...}
      processed = processed.replace(/\\textit\{([\s\S]*?)\}/g, '<em>$1</em>');

      // 5. Process LaTeX underline \underline{...}
      processed = processed.replace(/\\underline\{([\s\S]*?)\}/g, '<u>$1</u>');

      // 6. Process LaTeX centering \begin{center}...\end{center}
      processed = processed.replace(/\\begin\{center\}([\s\S]*?)\\end\{center\}/g, '<div class="text-center">$1</div>');

      // 7. Process Markdown bold **...**
      processed = processed.replace(/\*\*([\s\S]*?)\*\*/g, '<strong>$1</strong>');

      // 8. Process Markdown italic *...*
      processed = processed.replace(/\*([\s\S]*?)\*/g, '<em>$1</em>');

      // 9. Process LaTeX size small \small{...}
      processed = processed.replace(/\\small\{([\s\S]*?)\}/g, '<span class="text-xs">$1</span>');

      // 10. Process LaTeX size large \large{...}
      processed = processed.replace(/\\large\{([\s\S]*?)\}/g, '<span class="text-lg">$1</span>');

      // 11. Process LaTeX size Huge \Large{...}
      processed = processed.replace(/\\Large\{([\s\S]*?)\}/g, '<span class="text-xl font-semibold">$1</span>');

      // Process markdown images ![alt](url)
      processed = processed.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;margin:8px 0;" />');

      // Convert line breaks to HTML
      return processed.replace(/\n/g, '<br />');
    } catch (e) {
      console.error('KaTeX rendering error:', e);
      return text.replace(/\n/g, '<br />');
    }
  };

  // WYSIWYG header editor - execCommand for formatting
  const execHeaderCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    // Sync contentEditable to state
    if (headerEditorRef.current) {
      setHeaderDraft(headerEditorRef.current.innerHTML);
    }
  };

  const handleHeaderEditorInput = () => {
    if (headerEditorRef.current) {
      setHeaderDraft(headerEditorRef.current.innerHTML);
    }
  };

  // Stable ref for the header draft to prevent callback ref re-creation on keypress
  const headerDraftRef = useRef(headerDraft);
  useEffect(() => {
    headerDraftRef.current = headerDraft;
  }, [headerDraft]);

  // Set initial header content when loaded using callback ref for perfect lifecycle syncing
  const headerEditorRefCallback = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      (headerEditorRef as any).current = node;
      if (headerDraftRef.current && !isHeaderInitialized.current) {
        node.innerHTML = headerDraftRef.current;
        isHeaderInitialized.current = true;
      }
    } else {
      (headerEditorRef as any).current = null;
      isHeaderInitialized.current = false;
    }
  }, []);

  // Update DOM content only once when draft changes asynchronously after initial render
  useEffect(() => {
    if (headerEditorRef.current && headerDraft && !isHeaderInitialized.current) {
      headerEditorRef.current.innerHTML = headerDraft;
      isHeaderInitialized.current = true;
    }
  }, [headerDraft]);

  const insertFormatting = (targetId: string, type: string) => {
    const textarea = document.getElementById(`textarea-${targetId}`) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let replacement = '';
    let cursorOffset = 0;

    switch (type) {
      case 'bold':
        replacement = `**${selectedText || 'chữ in đậm'}**`;
        cursorOffset = 2;
        break;
      case 'italic':
        replacement = `*${selectedText || 'chữ in nghiêng'}*`;
        cursorOffset = 1;
        break;
      case 'underline':
        replacement = `<u>${selectedText || 'chữ gạch chân'}</u>`;
        cursorOffset = 3;
        break;
      case 'center':
        replacement = `<div class="text-center">\n${selectedText || 'nội dung căn giữa'}\n</div>`;
        cursorOffset = 25;
        break;
      case 'left':
        replacement = `<div class="text-left">\n${selectedText || 'nội dung căn trái'}\n</div>`;
        cursorOffset = 23;
        break;
      case 'right':
        replacement = `<div class="text-right">\n${selectedText || 'nội dung căn phải'}\n</div>`;
        cursorOffset = 24;
        break;
      case 'math':
        replacement = `$${selectedText || 'a + b = c'}$`;
        cursorOffset = 1;
        break;
      case 'block-math':
        replacement = `\n$$\n${selectedText || 'E = mc^2'}\n$$\n`;
        cursorOffset = 4;
        break;
      case 'list':
        replacement = `\n- ${selectedText || 'mục danh sách'}`;
        cursorOffset = 3;
        break;
      case 'size-small':
        replacement = `\\small{${selectedText || 'chữ nhỏ'}}`;
        cursorOffset = 7;
        break;
      case 'size-normal':
        replacement = selectedText || 'chữ thường';
        cursorOffset = 0;
        break;
      case 'size-large':
        replacement = `\\large{${selectedText || 'chữ lớn'}}`;
        cursorOffset = 7;
        break;
      case 'size-huge':
        replacement = `\\Large{${selectedText || 'chữ rất lớn'}}`;
        cursorOffset = 7;
        break;
      default:
        return;
    }

    const newValue = text.substring(0, start) + replacement + text.substring(end);
    
    setVariantsDraft(prev => ({
      ...prev,
      [targetId]: newValue
    }));

    // Refocus and restore selection
    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.setSelectionRange(start, start + replacement.length);
      } else {
        textarea.setSelectionRange(start + cursorOffset, start + replacement.length - cursorOffset);
      }
    }, 50);
  };

  const handleUploadImageForTarget = async (target: string, file: File) => {
    if (!file || !sessionToken) return;
    try {
      setUploadingTarget(target);
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

      if (target === 'header') {
        if (headerEditorRef.current) {
          headerEditorRef.current.innerHTML += `<br/><img src="${imageUrl}" alt="Ảnh" style="max-width:100%;margin:8px 0;" />`;
          setHeaderDraft(headerEditorRef.current.innerHTML);
        }
      } else {
        const currentDraft = variantsDraft[target] || '';
        setVariantsDraft(prev => ({
          ...prev,
          [target]: currentDraft ? currentDraft + '\n' + markdownImage : markdownImage
        }));
      }
      showToast('Tải ảnh lên thành công!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Lỗi tải ảnh lên.', 'error');
    } finally {
      setUploadingTarget(null);
    }
  };

  const handleUpdateQuestionDraft = (linkId: string, text: string) => {
    setVariantsDraft({
      ...variantsDraft,
      [linkId]: text
    });
  };

  // ===== PARTS MANAGEMENT =====

  const handleAddPart = () => {
    const newPart: ExamPart = {
      id: generatePartId(),
      title: `Phần ${examConfig.parts.length + 1}`,
      questionLinkIds: [],
    };
    setExamConfig(prev => ({
      ...prev,
      parts: [...prev.parts, newPart],
    }));
  };

  const handleUpdatePartTitle = (partId: string, title: string) => {
    setExamConfig(prev => ({
      ...prev,
      parts: prev.parts.map(p => p.id === partId ? { ...p, title } : p),
    }));
  };

  const handleRemovePart = (partId: string) => {
    if (examConfig.parts.length <= 1) return;
    const part = examConfig.parts.find(p => p.id === partId);
    if (!part) return;

    // Move questions to first remaining part
    setExamConfig(prev => {
      const remaining = prev.parts.filter(p => p.id !== partId);
      if (remaining.length > 0) {
        remaining[0] = {
          ...remaining[0],
          questionLinkIds: [...remaining[0].questionLinkIds, ...part.questionLinkIds],
        };
      }
      return { ...prev, parts: remaining };
    });
  };

  // Add a new blank question template (to a specific part)
  const handleAddNewQuestion = async (partId: string, insertIdx?: number) => {
    try {
      // 1. Create blank global question on backend
      const qRes = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'essay',
          tags: exam?.tags || [],
          variants: [{
            content: 'Nhập nội dung câu hỏi mới tại đây...',
            options: [],
            correctAnswer: null,
            explanation: '',
          }]
        }),
      });

      if (!qRes.ok) return showToast('Không thể tạo câu hỏi mới.', 'error');
      const newQuestion: Question = await qRes.json();

      // 2. Add question to this exam
      const nextOrder = questionLinks.length;
      const linkRes = await fetch(`/api/admin/exams/${examId}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId: newQuestion.id,
          orderIndex: nextOrder,
          points: 1.0
        }),
      });

      if (linkRes.ok) {
        const newLink: ExamQuestionLink = await linkRes.json();
        const fullLink = {
          ...newLink,
          question: newQuestion
        };

        const updatedLinks = [...questionLinks, fullLink];
        setQuestionLinks(updatedLinks);
        
        setVariantsDraft({
          ...variantsDraft,
          [newLink.id]: 'Nhập nội dung câu hỏi mới tại đây...'
        });
        setExpandedQuestions({
          ...expandedQuestions,
          [newLink.id]: true
        });

        // Add to the specified part
        setExamConfig(prev => ({
          ...prev,
          parts: prev.parts.map(p => {
            if (p.id === partId) {
              const updatedIds = [...p.questionLinkIds];
              if (insertIdx !== undefined) {
                updatedIds.splice(insertIdx, 0, newLink.id);
              } else {
                updatedIds.push(newLink.id);
              }
              return { ...p, questionLinkIds: updatedIds };
            }
            return p;
          }),
        }));
        showToast('Đã thêm câu hỏi mới thành công!', 'success');
      }
    } catch (error) {
      console.error('Failed to add new question:', error);
    }
  };

  // Remove question link
  const handleRemoveQuestionLink = async (linkId: string) => {
    try {
      const res = await fetch(`/api/admin/exams/${examId}/questions/${linkId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setQuestionLinks(questionLinks.filter(l => l.id !== linkId));
        // Remove from parts
        setExamConfig(prev => ({
          ...prev,
          parts: prev.parts.map(p => ({
            ...p,
            questionLinkIds: p.questionLinkIds.filter(id => id !== linkId),
          })),
        }));
      }
    } catch (error) {
      console.error('Failed to remove question link:', error);
    }
  };

  // Update points for a question link
  const handleUpdatePoints = async (linkId: string, pts: number) => {
    try {
      const res = await fetch(`/api/admin/exams/${examId}/questions/${linkId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          points: pts
        }),
      });

      if (res.ok) {
        setQuestionLinks(questionLinks.map(l => l.id === linkId ? { ...l, points: pts } : l));
      }
    } catch (error) {
      console.error('Failed to update points:', error);
    }
  };



  // Helper to add a new Exam-wide Topic (Topic lớn) directly inside questions editor
  const handleAddExamTagDirectly = async (questionId: string) => {
    const newTag = prompt("Nhập chủ đề chính (Topic lớn) mới cho đề thi:");
    if (!newTag || !newTag.trim()) return;
    const trimmed = newTag.trim();
    if (exam?.tags.includes(trimmed)) {
      setQuestionMainTopics(prev => ({ ...prev, [questionId]: trimmed }));
      return;
    }
    
    const updatedTags = [...(exam?.tags || []), trimmed];
    try {
      const res = await fetch(`/api/admin/exams/${examId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: exam?.title,
          questionLabel: exam?.questionLabel,
          tags: updatedTags,
          accessRights: exam?.accessRights,
          headerContent: exam?.headerContent,
        }),
      });
      if (res.ok) {
        setExam(prev => prev ? { ...prev, tags: updatedTags } : null);
        setQuestionMainTopics(prev => ({ ...prev, [questionId]: trimmed }));
        showToast("Đã thêm topic lớn mới vào đề thi!", "success");
      }
    } catch (e) {
      console.error(e);
      showToast("Lỗi khi thêm topic mới", "error");
    }
  };

  // Helper to edit/rename an Exam-wide Topic (Topic lớn)
  const handleEditExamTag = async (oldTag: string) => {
    if (!oldTag) return;
    const newTag = prompt(`Nhập tên mới cho chủ đề "${oldTag}":`, oldTag);
    if (!newTag || !newTag.trim()) return;
    const trimmed = newTag.trim();
    if (trimmed === oldTag) return;

    if (exam?.tags.includes(trimmed)) {
      showToast("Tên chủ đề này đã tồn tại!", "error");
      return;
    }

    const updatedTags = exam?.tags.map(t => t === oldTag ? trimmed : t) || [];
    try {
      const res = await fetch(`/api/admin/exams/${examId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: exam?.title,
          questionLabel: exam?.questionLabel,
          tags: updatedTags,
          accessRights: exam?.accessRights,
          headerContent: exam?.headerContent,
        }),
      });
      if (res.ok) {
        setExam(prev => prev ? { ...prev, tags: updatedTags } : null);
        
        // Update all questions' main topic state
        const updatedMainTopics = { ...questionMainTopics };
        Object.keys(updatedMainTopics).forEach(qId => {
          if (updatedMainTopics[qId] === oldTag) {
            updatedMainTopics[qId] = trimmed;
          }
        });
        setQuestionMainTopics(updatedMainTopics);
        
        showToast("Đã đổi tên chủ đề thành công!", "success");
      }
    } catch (e) {
      console.error(e);
      showToast("Lỗi khi sửa tên chủ đề", "error");
    }
  };

  // Helper to delete/remove an Exam-wide Topic (Topic lớn)
  const handleDeleteExamTag = async (tagToDelete: string) => {
    if (!tagToDelete) return;
    if (!confirm(`Bạn có chắc chắn muốn xoá chủ đề "${tagToDelete}" khỏi đề thi? Các câu hỏi đang chọn chủ đề này sẽ bị gỡ bỏ chủ đề.`)) return;

    const updatedTags = exam?.tags.filter(t => t !== tagToDelete) || [];
    try {
      const res = await fetch(`/api/admin/exams/${examId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: exam?.title,
          questionLabel: exam?.questionLabel,
          tags: updatedTags,
          accessRights: exam?.accessRights,
          headerContent: exam?.headerContent,
        }),
      });
      if (res.ok) {
        setExam(prev => prev ? { ...prev, tags: updatedTags } : null);
        
        // Update all questions' main topic state
        const updatedMainTopics = { ...questionMainTopics };
        Object.keys(updatedMainTopics).forEach(qId => {
          if (updatedMainTopics[qId] === tagToDelete) {
            updatedMainTopics[qId] = '';
          }
        });
        setQuestionMainTopics(updatedMainTopics);
        
        showToast("Đã xoá chủ đề thành công!", "success");
      }
    } catch (e) {
      console.error(e);
      showToast("Lỗi khi xoá chủ đề", "error");
    }
  };

  // Helper to edit/rename a Sub-Topic (Topic riêng / dạng câu hỏi)
  const handleEditSubTopic = (oldSub: string) => {
    if (!oldSub) return;
    const newSub = prompt(`Nhập tên mới cho dạng câu hỏi "${oldSub}":`, oldSub);
    if (!newSub || !newSub.trim()) return;
    const trimmed = newSub.trim();
    if (trimmed === oldSub) return;

    // Update globally in availableSubTopics list
    setAvailableSubTopics(prev => prev.map(t => t === oldSub ? trimmed : t));
    
    // Update all questions' sub topic state
    const updatedSubTopics = { ...questionSubTopics };
    Object.keys(updatedSubTopics).forEach(qId => {
      if (updatedSubTopics[qId] === oldSub) {
        updatedSubTopics[qId] = trimmed;
      }
    });
    setQuestionSubTopics(updatedSubTopics);
    showToast("Đã sửa tên dạng câu hỏi thành công!", "success");
  };

  // Helper to delete/remove a Sub-Topic (Topic riêng / dạng câu hỏi)
  const handleDeleteSubTopic = (subToDelete: string) => {
    if (!subToDelete) return;
    if (!confirm(`Bạn có chắc chắn muốn xoá dạng câu hỏi "${subToDelete}" khỏi câu hỏi này?`)) return;

    // Update globally in availableSubTopics list
    setAvailableSubTopics(prev => prev.filter(t => t !== subToDelete));

    // Update all questions' sub topic state
    const updatedSubTopics = { ...questionSubTopics };
    Object.keys(updatedSubTopics).forEach(qId => {
      if (updatedSubTopics[qId] === subToDelete) {
        updatedSubTopics[qId] = '';
      }
    });
    setQuestionSubTopics(updatedSubTopics);
    showToast("Đã xoá dạng câu hỏi thành công!", "success");
  };

  // Get sequential question number (across all parts)
  const getGlobalQuestionIndex = (linkId: string): number => {
    let idx = 0;
    for (const part of examConfig.parts) {
      for (const lid of part.questionLinkIds) {
        if (!questionLinkMap[lid]) continue;
        idx++;
        if (lid === linkId) return idx;
      }
    }
    return idx;
  };

  // Helper to render Notion-like insertion divider
  const renderInsertDivider = (partId: string, idx: number) => {
    return (
      <div className="group/divider relative py-2 print-hide flex items-center justify-center">
        <div className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent group-hover/divider:via-primary/30 transition-all" />
        
        <div className="relative z-10 opacity-0 group-hover/divider:opacity-100 transition-all duration-200 scale-95 group-hover/divider:scale-100 flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 px-3 py-1 rounded-full shadow-md">
          <button
            onClick={() => handleAddNewQuestion(partId, idx)}
            className="flex items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-primary transition-colors px-2 py-0.5 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
          >
            <Plus size={12} /> Soạn câu mới
          </button>
          <div className="w-[1px] h-3 bg-gray-200 dark:bg-gray-800" />
          <button
            onClick={() => {
              setInsertPosition({ partId, index: idx });
              setShowBankModal(true);
            }}
            className="flex items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-primary transition-colors px-2 py-0.5 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
          >
            <Grid size={12} /> Từ ngân hàng
          </button>
        </div>
        
        {/* Faint indicator when not hovered */}
        <div className="w-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-gray-800 group-hover/divider:bg-primary transition-colors" />
      </div>
    );
  };

  // Save all content: Header + Questions content drafts
  const handleSaveAll = async () => {
    try {
      setSaving(true);

      // 1. Save Header content on Exam (with config embedded)
      const currentHeaderHtml = headerEditorRef.current ? headerEditorRef.current.innerHTML : headerDraft;
      const fullHeaderContent = serializeExamConfig(examConfig, currentHeaderHtml);
      await fetch(`/api/admin/exams/${examId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: exam?.title,
          questionLabel: exam?.questionLabel,
          tags: exam?.tags,
          accessRights: exam?.accessRights,
          headerContent: fullHeaderContent,
        }),
      });

      // 2. Calculate sequential orderIndex for all question links based on examConfig.parts
      let sequentialIndex = 0;
      const linkOrderMap: Record<string, number> = {};
      for (const part of examConfig.parts) {
        for (const lid of part.questionLinkIds) {
          linkOrderMap[lid] = sequentialIndex++;
        }
      }

      // 3. Save new orderIndex for each question link
      for (const link of questionLinks) {
        const newOrder = linkOrderMap[link.id];
        if (newOrder !== undefined && newOrder !== link.orderIndex) {
          const orderRes = await fetch(`/api/admin/exams/${examId}/questions/${link.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderIndex: newOrder,
              points: link.points,
            }),
          });
          if (!orderRes.ok) {
            const errData = await orderRes.json().catch(() => ({}));
            throw new Error(errData.error || 'Lỗi sắp xếp câu hỏi');
          }
        }
      }

      // 4. Save each Question content & options based on raw draft text
      for (const link of questionLinks) {
        const draft = variantsDraft[link.id];
        if (draft === undefined || !link.question) continue;

        const parsed = parseTextToQuestion(draft);
        const variantId = link.question.variants[0]?.id;

        if (variantId) {
          // Construct tags
          const mainTopic = questionMainTopics[link.question.id] || '';
          const subTopic = questionSubTopics[link.question.id] || '';
          const tagsArray: string[] = [];
          if (mainTopic) tagsArray.push(`main:${mainTopic}`);
          if (subTopic) tagsArray.push(`sub:${subTopic}`);
          if (parsed.isTrueFalse) {
            tagsArray.push('type:true_false');
          }

          // Update global question metadata
          const metaRes = await fetch(`/api/admin/questions/${link.question.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: parsed.type,
              tags: tagsArray,
            }),
          });
          if (!metaRes.ok) {
            const errData = await metaRes.json().catch(() => ({}));
            throw new Error(errData.error || 'Lỗi cập nhật loại câu hỏi');
          }

          // Update question variant content & options
          const varRes = await fetch(`/api/admin/questions/${link.question.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content: parsed.content,
              options: parsed.options,
              correctAnswer: parsed.correctAnswer,
            }),
          });
          if (!varRes.ok) {
            const errData = await varRes.json().catch(() => ({}));
            throw new Error(errData.error || 'Lỗi cập nhật nội dung câu hỏi');
          }
        }
      }

      showToast('Đã lưu toàn bộ nội dung đề thi thành công!', 'success');
      fetchExamAndQuestions();
    } catch (error) {
      console.error('Failed to save exam content:', error);
      showToast(error instanceof Error ? error.message : 'Có lỗi xảy ra khi lưu nội dung.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Question bank search & selection
  const handleSearchBank = async () => {
    try {
      setSearchingBank(true);
      let url = '/api/admin/questions';
      if (bankSearchQuery.trim()) {
        const isNumber = /^\d+$/.test(bankSearchQuery.trim());
        url = isNumber
          ? `/api/admin/questions?serialNumber=${encodeURIComponent(bankSearchQuery.trim())}`
          : `/api/admin/questions?tag=${encodeURIComponent(bankSearchQuery.trim())}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setBankQuestions(data);
      }
    } catch (error) {
      console.error('Failed to search question bank:', error);
    } finally {
      setSearchingBank(false);
    }
  };

  const handleAddQuestionFromBank = async (q: Question, partId: string) => {
    // Check if already in exam
    if (questionLinks.some(l => l.questionId === q.id)) {
      return showToast('Câu hỏi này đã có trong đề thi!', 'error');
    }

    try {
      const nextOrder = questionLinks.length;
      const res = await fetch(`/api/admin/exams/${examId}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId: q.id,
          orderIndex: nextOrder,
          points: 1.0
        }),
      });

      if (res.ok) {
        const newLink: ExamQuestionLink = await res.json();
        const fullLink = {
          ...newLink,
          question: q
        };

        // Initialize question main/sub topics
        const tags = q.tags || [];
        const main = tags.find(t => t.startsWith('main:'))?.replace('main:', '') || '';
        const sub = tags.find(t => t.startsWith('sub:'))?.replace('sub:', '') || '';
        
        setQuestionMainTopics(prev => ({ ...prev, [q.id]: main }));
        setQuestionSubTopics(prev => ({ ...prev, [q.id]: sub }));

        // Safe variants serialize
        const firstVariant = q.variants && q.variants.length > 0
          ? q.variants[0]
          : { id: '', content: 'Nhập câu hỏi...', options: null, correctAnswer: null, explanation: null };

        setQuestionLinks([...questionLinks, fullLink]);
        setVariantsDraft({
          ...variantsDraft,
          [newLink.id]: serializeVariantToText(firstVariant, q.type, q.tags)
        });
        setExpandedQuestions({
          ...expandedQuestions,
          [newLink.id]: true
        });

        // Determine targetPartId safely with tab fallback
        const targetPartId = partId && examConfig.parts.some(p => p.id === partId)
          ? partId
          : (examConfig.parts && examConfig.parts.length > 0 ? examConfig.parts[0].id : 'default');

        // Add to part
        setExamConfig(prev => ({
          ...prev,
          parts: prev.parts.map(p => {
            if (p.id === targetPartId) {
              const updatedIds = [...p.questionLinkIds];
              if (insertPosition && insertPosition.partId === targetPartId) {
                updatedIds.splice(insertPosition.index, 0, newLink.id);
              } else {
                updatedIds.push(newLink.id);
              }
              return { ...p, questionLinkIds: updatedIds };
            }
            return p;
          }),
        }));
        
        showToast('Đã thêm câu hỏi vào đề thi thành công!', 'success');
        setShowBankModal(false);
        setBankQuestions([]);
        setBankSearchQuery('');
        setInsertPosition(null);
      }
    } catch (error) {
      console.error('Failed to add question from bank:', error);
    }
  };

  if (loading || !exam) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium animate-pulse">Đang chuẩn bị đề thi & trình biên dịch LaTeX...</p>
      </div>
    );
  }

  // Build a question map for quick lookup
  const questionLinkMap: Record<string, ExamQuestionLink> = {};
  questionLinks.forEach(l => { questionLinkMap[l.id] = l; });

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 md:px-0 relative pb-16 print:p-0 print:m-0 print:max-w-full">
      
      {/* Dynamic PRINT STYLE overriding style tags for perfect PDF */}
      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          header, aside, footer, button, .print-hide {
            display: none !important;
          }
          .print-full {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .page-break {
            page-break-before: always;
          }
          .render-math {
            font-size: 11pt !important;
            line-height: 1.6 !important;
          }
        }
      `}</style>

      {/* Top Banner Control Panel (Hidden on Print) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print-hide">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/exams"
            className="p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-900 transition-all shadow-sm"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Quản lý câu hỏi đề thi
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Thiết kế cấu trúc đề thi, chỉnh sửa LaTeX trực quan.</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowConfigPanel(!showConfigPanel)}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border transition-colors font-bold ${
              showConfigPanel 
                ? 'bg-primary/10 border-primary/30 text-primary dark:text-primary' 
                : 'border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900'
            }`}
          >
            <Settings size={16} /> Cấu hình
          </button>
          <button
            onClick={() => setShowBankModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            <Grid size={16} /> Ngân hàng
          </button>
          <button
            onClick={() => setShowPrintPreview(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            <Printer size={16} /> In PDF
          </button>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white font-bold shadow-md shadow-primary/10 hover:shadow-lg transition-all"
          >
            <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu toàn bộ'}
          </button>
        </div>
      </div>

      {/* ===== CONFIG PANEL ===== */}
      {showConfigPanel && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 space-y-5 shadow-sm print-hide animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Settings size={16} className="text-primary" /> Cấu hình chung
            </h3>
            <button onClick={() => setShowConfigPanel(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Show ID Toggle */}
            <label className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Hash size={18} />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">Hiển thị ID câu hỏi</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Hiển thị ID [ID:x] bên cạnh mỗi câu hỏi trong bản in</div>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={examConfig.showIds}
                  onChange={(e) => setExamConfig(prev => ({ ...prev, showIds: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </div>
            </label>

            {/* Show Points Toggle */}
            <label className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Award size={18} />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">Hiển thị điểm câu hỏi</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Hiển thị (x điểm) bên cạnh mỗi câu hỏi trong bản in</div>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={examConfig.showPoints}
                  onChange={(e) => setExamConfig(prev => ({ ...prev, showPoints: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="space-y-6 print-full">
        
        {/* --- 1. WYSIWYG HEADER EDITOR SECTION --- */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 space-y-4 shadow-sm print-full print:border-none print:shadow-none print:p-0">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 print-hide">
            <span className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <FileCode size={18} className="text-primary" /> Tiêu đề & Cấu hình Đề thi (Dành cho bản in PDF)
            </span>
            <button
              type="button"
              onClick={() => setActiveHeaderEdit(!activeHeaderEdit)}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              {activeHeaderEdit ? <Eye size={14} /> : <Edit size={14} />} {activeHeaderEdit ? 'Ẩn Trình soạn thảo' : 'Mở Trình soạn thảo'}
            </button>
          </div>

          <div className="min-h-[140px] print:min-h-0">
            {/* WYSIWYG Source Code Editor */}
            {activeHeaderEdit && (
              <div className="flex flex-col gap-2 print-hide">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Trình soạn thảo WYSIWYG</span>
                
                <div className="flex flex-col border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-primary transition-all">
                  {/* Editor Toolbar */}
                  <div className="flex flex-wrap items-center gap-1 px-3 py-1.5 bg-gray-50 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800">
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); execHeaderCommand('bold'); }}
                      title="Bôi đậm (Bold)"
                      className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer"
                    >
                      <Bold size={15} />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); execHeaderCommand('italic'); }}
                      title="Nghiêng (Italic)"
                      className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer"
                    >
                      <Italic size={15} />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); execHeaderCommand('underline'); }}
                      title="Gạch chân (Underline)"
                      className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer"
                    >
                      <Underline size={15} />
                    </button>
                    
                    <div className="w-[1px] h-4 bg-gray-200 dark:bg-gray-700 mx-1" />

                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          execHeaderCommand('fontSize', e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="px-2 py-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-600 dark:text-gray-300 text-[11px] font-bold focus:outline-none cursor-pointer hover:border-primary dark:hover:border-primary transition-all mr-1"
                      title="Thay đổi Cỡ chữ"
                      defaultValue=""
                    >
                      <option value="" disabled hidden>Cỡ chữ</option>
                      <option value="1">Nhỏ</option>
                      <option value="3">Thường</option>
                      <option value="5">Lớn</option>
                      <option value="7">Rất lớn</option>
                    </select>
                    
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); execHeaderCommand('justifyLeft'); }}
                      title="Căn trái"
                      className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer"
                    >
                      <AlignLeft size={15} />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); execHeaderCommand('justifyCenter'); }}
                      title="Căn giữa (Center)"
                      className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer"
                    >
                      <AlignCenter size={15} />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); execHeaderCommand('justifyRight'); }}
                      title="Căn phải"
                      className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer"
                    >
                      <AlignRight size={15} />
                    </button>

                    <div className="w-[1px] h-4 bg-gray-200 dark:bg-gray-700 mx-1" />

                    {/* Image upload tool */}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadImageForTarget('header', file);
                      }}
                      id="image-upload-header"
                      className="hidden"
                    />
                    <label
                      htmlFor="image-upload-header"
                      title="Thêm ảnh từ máy"
                      className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer flex items-center justify-center"
                    >
                      {uploadingTarget === 'header' ? (
                        <Loader2 size={15} className="animate-spin text-primary" />
                      ) : (
                        <ImageIcon size={15} />
                      )}
                    </label>

                    <div className="ml-auto flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowGuideModal(true)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-primary transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-800 px-2 py-1"
                      >
                        <HelpCircle size={12} /> Hướng dẫn
                      </button>
                    </div>
                  </div>

                  {/* ContentEditable WYSIWYG Editor */}
                  <div
                    ref={headerEditorRefCallback}
                    contentEditable
                    onInput={handleHeaderEditorInput}
                    data-placeholder="Nhập thông tin Cấu hình góc trên cùng đề thi... (Ví dụ: tên trường, mã môn, học kỳ)"
                    className="w-full min-h-[120px] p-4 bg-transparent text-gray-900 dark:text-white text-sm focus:outline-none transition-all resize-y border-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none"
                    style={{ minHeight: '120px' }}
                    suppressContentEditableWarning
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- 2. PARTS & QUESTION EDITOR SECTION --- */}
        <div className="space-y-6 print-full print:mt-8">
          
          {/* Tabs header bar (hidden on print) */}
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2 print-hide">
            <div className="flex flex-wrap gap-2">
              {examConfig.parts.map((part, partIdx) => {
                const isActive = activePartTab === part.id;
                return (
                  <button
                    key={part.id}
                    type="button"
                    onClick={() => setActivePartTab(part.id)}
                    className={`px-5 py-3 rounded-t-2xl font-bold text-sm transition-all border-t-2 border-x-2 shrink-0 flex items-center gap-2 cursor-pointer ${
                      isActive
                        ? 'bg-white dark:bg-gray-900 border-primary text-primary shadow-sm -mb-[10px] z-10'
                        : 'bg-gray-50/50 dark:bg-gray-800/40 border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <span>{part.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                      {part.questionLinkIds.length}
                    </span>
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={handleAddPart}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition-all cursor-pointer"
            >
              <Plus size={14} /> Thêm phần mới
            </button>
          </div>

          {/* Active Part Content for Editing (print-hide) */}
          {examConfig.parts.map((part, partIdx) => {
            const isActive = activePartTab === part.id;
            if (!isActive) return null;

            return (
              <div key={part.id} className="space-y-4 print-hide">
                {/* Part Header Controls */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-extrabold">
                      {partIdx + 1}
                    </div>
                    <input
                      type="text"
                      value={part.title}
                      onChange={(e) => handleUpdatePartTitle(part.id, e.target.value)}
                      className="bg-transparent text-sm font-bold text-gray-900 dark:text-white focus:outline-none border-b border-transparent focus:border-primary transition-colors px-1"
                      placeholder="Tên phần..."
                    />
                    <span className="text-xs text-gray-400 font-medium">
                      ({part.questionLinkIds.length} câu)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAddNewQuestion(part.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold transition-all cursor-pointer"
                    >
                      <Plus size={12} /> Thêm câu
                    </button>
                    {examConfig.parts.length > 1 && (
                      <button
                        onClick={() => handleRemovePart(part.id)}
                        className="p-1.5 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all cursor-pointer"
                        title="Xóa phần này"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Questions in this Part */}
                <div className="space-y-4">
                  {part.questionLinkIds.map((linkId, index) => {
                    const link = questionLinkMap[linkId];
                    if (!link) return null;

                    const globalIdx = getGlobalQuestionIndex(linkId);
                    const isExpanded = !!expandedQuestions[link.id];
                    const draftText = variantsDraft[link.id] || '';
                    const parsed = parseTextToQuestion(draftText);
                    
                    return (
                      <React.Fragment key={link.id}>
                        {renderInsertDivider(part.id, index)}
                        <div 
                          className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 space-y-4 shadow-sm"
                        >
                          {/* Card Header Toolbar */}
                          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                            <div className="flex items-center gap-2.5">
                              {examConfig.showIds && link.question?.serialNumber && (
                                <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 uppercase tracking-wider font-bold">
                                  ID: {link.question.serialNumber}
                                </span>
                              )}
                              <span className="text-sm font-extrabold text-gray-900 dark:text-white uppercase">
                                {exam.questionLabel} {globalIdx}
                              </span>
                              <span className="text-xs font-bold text-gray-400 capitalize">
                                ({parsed.type === 'essay' ? 'Tự luận' : parsed.isTrueFalse ? 'Đúng / Sai' : parsed.type === 'single_choice' ? 'Trắc nghiệm 1 đáp án' : 'Trắc nghiệm nhiều đáp án'})
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Points config */}
                              {examConfig.showPoints && (
                                <div className="flex items-center gap-1.5 mr-2">
                                  <span className="text-xs text-gray-500 font-medium">Điểm:</span>
                                  <input
                                    type="number"
                                    step="0.25"
                                    min="0"
                                    value={link.points}
                                    onChange={(e) => handleUpdatePoints(link.id, parseFloat(e.target.value) || 0)}
                                    className="w-16 px-2 py-1 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary text-center text-gray-900 dark:text-white"
                                  />
                                </div>
                              )}

                              {/* Control buttons */}
                              <button
                                onClick={() => handleUpdateQuestionDraft(link.id, draftText + '\nA. \nB. \nC. \nD. ')}
                                title="Thêm mẫu trắc nghiệm (Template)"
                                className="p-2 rounded-xl text-gray-400 hover:text-primary hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer"
                              >
                                <FileCode size={14} />
                              </button>

                              <button
                                onClick={() => setExpandedQuestions({ ...expandedQuestions, [link.id]: !isExpanded })}
                                className="p-2 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer"
                              >
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>

                              <button
                                onClick={() => handleRemoveQuestionLink(link.id)}
                                className="p-2 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Two-part topics editor (visible when expanded) */}
                          {isExpanded && link.question && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-gray-50/40 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 text-xs">
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Chủ đề chính (Topic lớn)</label>
                                <div className="flex gap-2">
                                  <select
                                    value={questionMainTopics[link.question!.id] || ''}
                                    onChange={(e) => setQuestionMainTopics({
                                      ...questionMainTopics,
                                      [link.question!.id]: e.target.value
                                    })}
                                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer"
                                  >
                                    <option value="">-- Chọn chủ đề chính --</option>
                                    {exam?.tags.map(tag => (
                                      <option key={tag} value={tag}>{tag}</option>
                                    ))}
                                  </select>
                                  
                                  {questionMainTopics[link.question!.id] && (
                                    <div className="flex gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => handleEditExamTag(questionMainTopics[link.question!.id])}
                                        className="p-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
                                        title="Sửa tên chủ đề này"
                                      >
                                        <Edit size={12} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteExamTag(questionMainTopics[link.question!.id])}
                                        className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
                                        title="Xoá chủ đề này khỏi đề thi"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  )}
                                  
                                  <button
                                    type="button"
                                    onClick={() => handleAddExamTagDirectly(link.question!.id)}
                                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
                                  >
                                    <Plus size={12} /> Thêm
                                  </button>
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Dạng câu hỏi (Topic riêng của câu)</label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    placeholder="Ví dụ: Tích phân kép, Cực trị..."
                                    value={questionSubTopics[link.question!.id] || ''}
                                    onChange={(e) => setQuestionSubTopics({
                                      ...questionSubTopics,
                                      [link.question!.id]: e.target.value
                                    })}
                                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                  />
                                  
                                  {questionSubTopics[link.question!.id] && (
                                    <div className="flex gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => handleEditSubTopic(questionSubTopics[link.question!.id])}
                                        className="p-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
                                        title="Sửa tên dạng câu hỏi này"
                                      >
                                        <Edit size={12} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteSubTopic(questionSubTopics[link.question!.id])}
                                        className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
                                        title="Xoá dạng câu hỏi này khỏi câu"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  )}
                                  
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newSub = prompt("Nhập topic riêng (dạng câu hỏi) mới cho câu hỏi này:");
                                      if (newSub && newSub.trim()) {
                                        const trimmed = newSub.trim();
                                        if (!availableSubTopics.includes(trimmed)) {
                                          setAvailableSubTopics([...availableSubTopics, trimmed]);
                                        }
                                        setQuestionSubTopics({
                                          ...questionSubTopics,
                                          [link.question!.id]: trimmed
                                        });
                                      }
                                    }}
                                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
                                  >
                                    <Plus size={12} /> Thêm
                                  </button>
                                  {availableSubTopics.length > 0 && (
                                    <select
                                      onChange={(e) => {
                                        if (e.target.value) {
                                          setQuestionSubTopics({
                                            ...questionSubTopics,
                                            [link.question!.id]: e.target.value
                                          });
                                          e.target.value = '';
                                        }
                                      }}
                                      className="px-2 py-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-800 rounded-xl text-[10px] font-bold focus:outline-none cursor-pointer transition-all text-gray-600 dark:text-gray-300 w-24 shrink-0"
                                      defaultValue=""
                                    >
                                      <option value="" disabled hidden>Chọn sẵn...</option>
                                      {availableSubTopics
                                        .filter(t => t !== questionSubTopics[link.question!.id])
                                        .map(topic => (
                                          <option key={topic} value={topic}>{topic}</option>
                                        ))}
                                    </select>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Question Editor */}
                          {isExpanded && (
                            <div className="flex flex-col gap-2">
                              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Soạn thảo nguồn LaTeX & Định dạng</span>
                              
                              <div className="flex flex-col border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-primary transition-all">
                                {/* Question Editor Toolbar */}
                                <div className="flex flex-wrap items-center gap-1 px-3 py-1.5 bg-gray-50 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800">
                                  <button
                                    type="button"
                                    onClick={() => insertFormatting(link.id, 'bold')}
                                    title="Bôi đậm (Bold)"
                                    className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer"
                                  >
                                    <Bold size={15} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => insertFormatting(link.id, 'italic')}
                                    title="Nghiêng (Italic)"
                                    className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer"
                                  >
                                    <Italic size={15} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => insertFormatting(link.id, 'underline')}
                                    title="Gạch chân (Underline)"
                                    className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer"
                                  >
                                    <Underline size={15} />
                                  </button>
                                  
                                  <div className="w-[1px] h-4 bg-gray-200 dark:bg-gray-700 mx-1" />
                                  
                                  <select
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        insertFormatting(link.id, e.target.value);
                                        e.target.value = '';
                                      }
                                    }}
                                    className="px-2 py-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-600 dark:text-gray-300 text-[11px] font-bold focus:outline-none cursor-pointer hover:border-primary dark:hover:border-primary transition-all mr-1"
                                    title="Thay đổi Cỡ chữ"
                                    defaultValue=""
                                  >
                                    <option value="" disabled hidden>Cỡ chữ</option>
                                    <option value="size-small">Nhỏ</option>
                                    <option value="size-normal">Thường</option>
                                    <option value="size-large">Lớn</option>
                                    <option value="size-huge">Rất lớn</option>
                                  </select>

                                  <div className="w-[1px] h-4 bg-gray-200 dark:bg-gray-700 mx-1" />

                                  <button
                                    type="button"
                                    onClick={() => insertFormatting(link.id, 'math')}
                                    title="Công thức Toán dòng (Inline Math)"
                                    className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer text-[11px] font-bold"
                                  >
                                    $f(x)$
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => insertFormatting(link.id, 'block-math')}
                                    title="Khối công thức toán độc lập (Block Math)"
                                    className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer text-[11px] font-bold"
                                  >
                                    $$F$$
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => insertFormatting(link.id, 'list')}
                                    title="Danh sách dấu chấm (List)"
                                    className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer"
                                  >
                                    <List size={15} />
                                  </button>

                                  <div className="w-[1px] h-4 bg-gray-200 dark:bg-gray-700 mx-1" />

                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleUploadImageForTarget(link.id, file);
                                    }}
                                    id={`image-upload-${link.id}`}
                                    className="hidden"
                                  />
                                  <label
                                    htmlFor={`image-upload-${link.id}`}
                                    title="Thêm ảnh từ máy"
                                    className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer flex items-center justify-center animate-none"
                                  >
                                    {uploadingTarget === link.id ? (
                                      <Loader2 size={15} className="animate-spin text-primary" />
                                    ) : (
                                      <ImageIcon size={15} />
                                    )}
                                  </label>

                                  <div className="ml-auto flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setShowGuideModal(true)}
                                      className="p-1.5 rounded-lg text-gray-400 hover:text-primary transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-800 px-2 py-1"
                                    >
                                      <HelpCircle size={12} /> Hướng dẫn
                                    </button>
                                  </div>
                                </div>

                                <textarea
                                  id={`textarea-${link.id}`}
                                  rows={6}
                                  value={draftText}
                                  onChange={(e) => handleUpdateQuestionDraft(link.id, e.target.value)}
                                  placeholder="Nhập nội dung câu hỏi...
Ví dụ trắc nghiệm:
Đáp án đúng bắt đầu bằng dấu *
A. Đáp án A
*B. Đáp án B"
                                  className="w-full p-4 bg-transparent text-gray-900 dark:text-white font-mono text-sm focus:outline-none transition-all resize-y border-none"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </React.Fragment>
                    );
                  })}

                  {part.questionLinkIds.length > 0 && renderInsertDivider(part.id, part.questionLinkIds.length)}

                  {part.questionLinkIds.length === 0 && (
                    <div className="text-center py-8 text-gray-400 dark:text-gray-600 text-sm font-medium">
                      <FileText size={24} className="mx-auto mb-2 opacity-50" />
                      Chưa có câu hỏi trong phần này. Nhấn "Thêm câu" để bắt đầu.
                    </div>
                  )}
                </div>
              </div>
            );
          })}

        </div>

      </div>

      {/* --- 3. QUESTION BANK DRAWER MODAL (Hidden on Print) --- */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print-hide">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Ngân hàng câu hỏi global</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Tìm kiếm và chọn các câu hỏi có sẵn để thêm vào đề thi.</p>
              </div>
              <button 
                onClick={() => {
                  setShowBankModal(false);
                  setBankQuestions([]);
                  setBankSearchQuery('');
                }}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Search Input */}
            <div className="p-6 bg-gray-50/50 dark:bg-gray-800/10 border-b border-gray-100 dark:border-gray-800 flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Tìm câu hỏi theo tag (ví dụ: math, algebra)..."
                  value={bankSearchQuery}
                  onChange={(e) => setBankSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchBank()}
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-white"
                />
              </div>
              <button
                onClick={handleSearchBank}
                disabled={searchingBank}
                className="px-5 py-3 bg-primary hover:bg-primary/95 text-white rounded-2xl text-sm font-bold shadow-md shadow-primary/20 transition-all flex items-center gap-1.5"
              >
                <RefreshCw size={14} className={searchingBank ? 'animate-spin' : ''} /> Tìm kiếm
              </button>
            </div>

            {/* Modal Questions List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {searchingBank ? (
                <div className="h-full flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-400 text-xs font-semibold">Đang tìm trong kho dữ liệu...</p>
                </div>
              ) : bankQuestions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 gap-3 text-gray-400">
                  <FileText size={40} />
                  <p className="text-sm font-medium">Nhập từ khoá tag và bấm Tìm kiếm.</p>
                </div>
              ) : (
                bankQuestions.map((q, qIdx) => (
                  <div 
                    key={q.id}
                    className="p-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/20 dark:bg-gray-800/10 space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 font-bold">
                          STT: {qIdx + 1}
                        </span>
                        <span className="text-xs font-bold text-primary capitalize">
                          {q.type === 'essay' ? 'Tự luận' : 'Trắc nghiệm'}
                        </span>
                      </div>
                      <p 
                        className="text-sm text-gray-900 dark:text-white font-medium render-math"
                        dangerouslySetInnerHTML={{ __html: renderLaTeX(q.variants[0]?.content || '') }}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex flex-wrap gap-1">
                        {q.tags.map((t, idx) => (
                          <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 font-semibold">
                            {t}
                          </span>
                        ))}
                      </div>

                      {/* Add to active part tab from bank */}
                      {questionLinks.some(l => l.questionId === q.id) ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 text-xs font-bold rounded-xl">
                          <Check size={12} /> Đã thêm
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAddQuestionFromBank(q, activePartTab)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
                        >
                          <Plus size={12} /> Thêm vào đề
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
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
                onClick={() => {
                  const wrapper = document.querySelector('.print-sheet-wrapper');
                  if (wrapper) wrapper.scrollTop = 0;
                  window.print();
                }}
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
              {exam && (
                <div className="space-y-4">
                  {/* Render the WYSIWYG header content */}
                  {headerDraft && (
                    <div 
                      className="text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: renderLaTeX(headerDraft) }}
                    />
                  )}
                </div>
              )}

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
                        
                        // Always use current editor draft if available, otherwise fall back to database values
                        const draft = variantsDraft[link.id];
                        let parsedContent = '';
                        let parsedOptions: { label: string; text: string }[] | null = [];
                        let parsedType = '';
                        let isTF = false;

                        if (draft !== undefined) {
                          const parsed = parseTextToQuestion(draft);
                          parsedContent = parsed.content;
                          parsedOptions = parsed.options;
                          parsedType = parsed.type;
                          isTF = !!parsed.isTrueFalse;
                        } else {
                          const firstVar = q.variants?.[0];
                          parsedContent = firstVar?.content || '';
                          parsedOptions = firstVar?.options || [];
                          parsedType = q.type;
                          isTF = q.tags?.includes('type:true_false') || firstVar?.correctAnswer?.hasOwnProperty('trueIndices');
                        }

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
                                dangerouslySetInnerHTML={{ __html: renderLaTeX(parsedContent) }}
                              />
                            </div>

                            {/* Options */}
                            {parsedOptions && parsedOptions.length > 0 && (
                              <div className={isTF ? "space-y-1 pl-6 mt-1" : "grid grid-cols-2 gap-x-6 gap-y-1 pl-6 mt-1"}>
                                {parsedOptions.map((opt, oIdx) => {
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

                            {/* Essay/Short answer blank space */}
                            {parsedType === 'essay' && (
                              <div className="mt-2 flex items-center gap-2 pl-6 text-xs font-serif text-gray-700 italic select-none">
                                <span>Đáp số:</span>
                                <span className="flex-1 border-b border-dotted border-gray-400 h-4 mt-1"></span>
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

      {/* Visual Editor Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <HelpCircle className="text-primary" size={20} /> Hướng dẫn Soạn thảo & Định dạng
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Trình soạn thảo hỗ trợ cả LaTeX chuẩn và Markdown/HTML để căn lề, định dạng bản in đẹp nhất.</p>
              </div>
              <button 
                onClick={() => setShowGuideModal(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs md:text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Formatting Guide */}
                <div className="space-y-4">
                  <h4 className="font-extrabold text-gray-900 dark:text-white uppercase tracking-wider text-xs border-b border-gray-100 dark:border-gray-800 pb-1">
                    Định dạng & Căn lề
                  </h4>
                  <table className="w-full text-left border-collapse">
                    <tbody>
                      <tr className="border-b border-gray-50 dark:border-gray-800/40">
                        <td className="py-2.5 font-bold text-gray-600 dark:text-gray-400 w-1/3">In đậm</td>
                        <td className="py-2.5 font-mono text-primary text-[11px]">**in đậm** <span className="text-gray-400 text-[10px]">hoặc</span> {"\\textbf{in đậm}"}</td>
                      </tr>
                      <tr className="border-b border-gray-50 dark:border-gray-800/40">
                        <td className="py-2.5 font-bold text-gray-600 dark:text-gray-400">In nghiêng</td>
                        <td className="py-2.5 font-mono text-primary text-[11px]">*nghiêng* <span className="text-gray-400 text-[10px]">hoặc</span> {"\\textit{nghiêng}"}</td>
                      </tr>
                      <tr className="border-b border-gray-50 dark:border-gray-800/40">
                        <td className="py-2.5 font-bold text-gray-600 dark:text-gray-400">Gạch chân</td>
                        <td className="py-2.5 font-mono text-primary text-[11px]">&lt;u&gt;gạch chân&lt;/u&gt; <span className="text-gray-400 text-[10px]">hoặc</span> {"\\underline{gạch}"}</td>
                      </tr>
                      <tr className="border-b border-gray-50 dark:border-gray-800/40">
                        <td className="py-2.5 font-bold text-gray-600 dark:text-gray-400">Header</td>
                        <td className="py-2.5 text-primary text-[11px]">Dùng <span className="font-bold">WYSIWYG</span> — bôi đen text, bấm nút định dạng</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold text-gray-600 dark:text-gray-400">Danh sách</td>
                        <td className="py-2.5 font-mono text-primary text-[11px]">- Mục 1 <br/>- Mục 2</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* LaTeX Formulas Guide */}
                <div className="space-y-4">
                  <h4 className="font-extrabold text-gray-900 dark:text-white uppercase tracking-wider text-xs border-b border-gray-100 dark:border-gray-800 pb-1">
                    Công thức toán LaTeX
                  </h4>
                  <table className="w-full text-left border-collapse">
                    <tbody>
                      <tr className="border-b border-gray-50 dark:border-gray-800/40">
                        <td className="py-2.5 font-bold text-gray-600 dark:text-gray-400 w-1/3">Toán trong dòng</td>
                        <td className="py-2.5 font-mono text-blue-600 dark:text-blue-400 text-[11px]">$a^2 + b^2 = c^2$</td>
                      </tr>
                      <tr className="border-b border-gray-50 dark:border-gray-800/40">
                        <td className="py-2.5 font-bold text-gray-600 dark:text-gray-400">Toán khối rộng</td>
                        <td className="py-2.5 font-mono text-blue-600 dark:text-blue-400 text-[11px]">{"$$ \\lim_{x \\to 0} \\frac{\\sin x}{x} = 1 $$"}</td>
                      </tr>
                      <tr className="border-b border-gray-50 dark:border-gray-800/40">
                        <td className="py-2.5 font-bold text-gray-600 dark:text-gray-400">Phân số</td>
                        <td className="py-2.5 font-mono text-blue-600 dark:text-blue-400 text-[11px]">{"$\\frac{tử}{mẫu}$"} <span className="text-gray-400 text-[10px]">ví dụ:</span> {"\\frac{1}{x}"}</td>
                      </tr>
                      <tr className="border-b border-gray-50 dark:border-gray-800/40">
                        <td className="py-2.5 font-bold text-gray-600 dark:text-gray-400">Mũ & Chỉ số</td>
                        <td className="py-2.5 font-mono text-blue-600 dark:text-blue-400 text-[11px]">{"x^{mũ}"} <span className="text-gray-400 text-[10px]">và</span> {"x_{chỉ_số}"}</td>
                      </tr>
                      <tr className="border-b border-gray-50 dark:border-gray-800/40">
                        <td className="py-2.5 font-bold text-gray-600 dark:text-gray-400">Tích phân / Tổng</td>
                        <td className="py-2.5 font-mono text-blue-600 dark:text-blue-400 text-[11px]">{"\\int_a^b f(x)dx"} <span className="text-gray-400 text-[10px]">và</span> {"\\sum_{i=1}^n"}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold text-gray-600 dark:text-gray-400">Căn thức</td>
                        <td className="py-2.5 font-mono text-blue-600 dark:text-blue-400 text-[11px]">{"\\sqrt{x}"} <span className="text-gray-400 text-[10px]">hoặc</span> {"\\sqrt[n]{x}"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

              </div>

              {/* Question Types Formats Guide */}
              <div className="space-y-4 pt-5 border-t border-gray-100 dark:border-gray-800">
                <h4 className="font-extrabold text-gray-900 dark:text-white uppercase tracking-wider text-xs border-b border-gray-100 dark:border-gray-800 pb-1.5 flex items-center gap-1.5">
                  📝 Cú pháp soạn các dạng câu hỏi
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Trắc nghiệm */}
                  <div className="p-3.5 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 dark:border-blue-500/20 space-y-2">
                    <span className="font-extrabold text-[11px] text-blue-600 dark:text-blue-400 uppercase tracking-wider block">1. Trắc nghiệm (MCQ)</span>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">
                      Sử dụng các chữ cái hoa <strong className="text-gray-800 dark:text-gray-200">A. B. C. D.</strong>. Thêm dấu hoa thị <strong className="text-primary font-bold">*</strong> ở đầu dòng của đáp án đúng.
                    </p>
                    <pre className="text-[9px] font-mono bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-2.5 rounded-xl text-gray-600 dark:text-gray-400 overflow-x-auto">
{`Câu hỏi trắc nghiệm?
A. Phương án sai 1
*B. Đáp án ĐÚNG (Có dấu *)
C. Phương án sai 2`}
                    </pre>
                  </div>

                  {/* Đúng / Sai */}
                  <div className="p-3.5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 dark:border-emerald-500/20 space-y-2">
                    <span className="font-extrabold text-[11px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">2. Đúng / Sai (T/F)</span>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">
                      Sử dụng chữ cái thường <strong className="text-gray-800 dark:text-gray-200">a) b) c) d)</strong>. Đánh dấu <strong className="text-primary font-bold">*</strong> ở đầu dòng của mệnh đề Đúng.
                    </p>
                    <pre className="text-[9px] font-mono bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-2.5 rounded-xl text-gray-600 dark:text-gray-400 overflow-x-auto">
{`Mệnh đề câu hỏi đúng sai?
a) Lựa chọn mệnh đề Sai
*b) Mệnh đề ĐÚNG (Có dấu *)
*c) Mệnh đề ĐÚNG (Có dấu *)
d) Lựa chọn mệnh đề Sai`}
                    </pre>
                  </div>

                  {/* Tự luận / Trả lời ngắn */}
                  <div className="p-3.5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/10 dark:border-amber-500/20 space-y-2">
                    <span className="font-extrabold text-[11px] text-amber-600 dark:text-amber-400 uppercase tracking-wider block">3. Tự luận / Trả lời ngắn</span>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">
                      Nhập văn bản câu hỏi bình thường. Khai báo đáp số ở dòng cuối cùng của câu hỏi theo cú pháp <strong className="text-gray-800 dark:text-gray-200">ĐS: đáp số</strong>.
                    </p>
                    <pre className="text-[9px] font-mono bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-2.5 rounded-xl text-gray-600 dark:text-gray-400 overflow-x-auto">
{`Tính diện tích hình tròn r = 3?
ĐS: 9\\pi`}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Tips Banner */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 space-y-1">
                <span className="font-extrabold text-[11px] uppercase tracking-wider block">💡 Mẹo soạn thảo nhanh</span>
                <p className="text-[11px] leading-relaxed">
                  <strong>Header:</strong> Dùng trình soạn thảo WYSIWYG — bôi đen text và nhấn nút Bold/Italic/Center để định dạng trực tiếp.<br/>
                  <strong>Câu hỏi:</strong> Dùng cú pháp Markdown/LaTeX trong textarea. Preview bên phải sẽ cập nhật ngay.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end shrink-0 bg-gray-50/50 dark:bg-gray-800/20">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs shadow-md shadow-primary/10 transition-colors cursor-pointer"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

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
