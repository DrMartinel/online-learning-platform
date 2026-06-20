"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Save, Lock, Link as LinkIcon, Globe, ChevronRight, Hash, Award, Search } from 'lucide-react';

export default function EditExamSettings() {
  const router = useRouter();
  const { id } = useParams() as { id: string };

  const [title, setTitle] = useState('');
  const [questionLabel, setQuestionLabel] = useState('Câu');
  const [examTags, setExamTags] = useState<string[]>([]);
  const [accessRights, setAccessRights] = useState('private');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Display config
  const [showIds, setShowIds] = useState(true);
  const [showPoints, setShowPoints] = useState(true);
  const [headerContent, setHeaderContent] = useState<string | null>(null);

  // Custom Tag Prompt Modal State
  const [showTagModal, setShowTagModal] = useState(false);
  const [customTagName, setCustomTagName] = useState('');

  // Tags search
  const [tagSearchQuery, setTagSearchQuery] = useState('');

  // Custom Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: '', type: null });
    }, 4000);
  };

  // Default tags list for selection - cleared preset tags as requested
  const defaultTags: string[] = [];

  const [availableTags, setAvailableTags] = useState<string[]>(defaultTags);

  const fetchAllDbTags = async () => {
    try {
      const res = await fetch('/api/admin/exams');
      if (res.ok) {
        const data = await res.json();
        const allTagsSet = new Set<string>();
        data.forEach((ex: any) => {
          if (ex.tags) {
            ex.tags.forEach((t: string) => allTagsSet.add(t));
          }
        });
        setAvailableTags(prev => {
          const merged = new Set([...prev, ...allTagsSet]);
          return Array.from(merged);
        });
      }
    } catch (e) {
      console.error('Failed to fetch all DB tags:', e);
    }
  };

  useEffect(() => {
    fetchExamDetails();
    fetchAllDbTags();
  }, [id]);

  const fetchExamDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/exams/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTitle(data.title);
        setQuestionLabel(data.questionLabel || 'Câu');
        setExamTags(data.tags || []);
        setAccessRights(data.accessRights || 'private');
        setHeaderContent(data.headerContent || null);

        // Parse display config from headerContent
        if (data.headerContent) {
          const configMatch = data.headerContent.match(/<!-- EXAM_CONFIG:([\s\S]*?):EXAM_CONFIG -->/);
          if (configMatch) {
            try {
              const parsed = JSON.parse(configMatch[1]);
              setShowIds(parsed.showIds ?? true);
              setShowPoints(parsed.showPoints ?? true);
            } catch {}
          }
        }

        // Add any loaded tags not in defaultTags to availableTags
        const newAvailableTags = [...availableTags];
        (data.tags || []).forEach((t: string) => {
          if (!newAvailableTags.includes(t)) {
            newAvailableTags.push(t);
          }
        });
        setAvailableTags(newAvailableTags);
      }
    } catch (error) {
      console.error('Failed to load exam details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTag = (tag: string) => {
    if (examTags.includes(tag)) {
      setExamTags(examTags.filter(t => t !== tag));
    } else {
      setExamTags([...examTags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    setShowTagModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);

      // Build updated headerContent with display config
      let rawHeader = headerContent || '';
      // Remove old config block if present
      rawHeader = rawHeader.replace(/<!-- EXAM_CONFIG:[\s\S]*?:EXAM_CONFIG -->\n?/, '');
      // Build new config
      const configObj: any = { showIds, showPoints };
      // Preserve existing parts if any
      if (headerContent) {
        const oldMatch = headerContent.match(/<!-- EXAM_CONFIG:([\s\S]*?):EXAM_CONFIG -->/);
        if (oldMatch) {
          try {
            const oldParsed = JSON.parse(oldMatch[1]);
            if (oldParsed.parts) configObj.parts = oldParsed.parts;
          } catch {}
        }
      }
      const configBlock = `<!-- EXAM_CONFIG:${JSON.stringify(configObj)}:EXAM_CONFIG -->\n`;
      const finalHeaderContent = configBlock + rawHeader;

      const res = await fetch(`/api/admin/exams/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          questionLabel,
          tags: examTags,
          accessRights,
          headerContent: finalHeaderContent,
        }),
      });

      if (res.ok) {
        router.push(`/admin/exams/${id}/questions`);
      } else {
        showToast('Có lỗi xảy ra khi lưu thiết lập đề thi.', 'error');
      }
    } catch (error) {
      console.error('Failed to save exam settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium animate-pulse">Đang tải thiết lập đề thi...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-4xl mx-auto px-4 md:px-0">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/exams"
            className="p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-900 transition-all shadow-sm"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Chỉnh sửa đề thi
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Quản lý kho học liệu cá nhân của bạn.</p>
          </div>
        </div>
        <Link
          href={`/admin/exams/${id}/questions`}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
        >
          Câu hỏi <ChevronRight size={16} />
        </Link>
      </div>

      {/* General Information Card */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 md:p-8 space-y-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-gray-800">
          Thông tin chung
        </h3>

        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
            Tiêu đề đề thi <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="[THDC] Trắc nghiệm lưu đồ thuật toán..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder-gray-400"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
            Label câu hỏi
          </label>
          <input
            type="text"
            placeholder="Câu"
            value={questionLabel}
            onChange={(e) => setQuestionLabel(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder-gray-400"
          />
        </div>
      </div>

      {/* Display Config Card */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 md:p-8 space-y-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-gray-800">
          Cấu hình hiển thị (Bản in)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Hash size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900 dark:text-white">Hiển thị ID câu hỏi</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Hiện ID [ID:x] trong bản in</div>
              </div>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={showIds}
                onChange={(e) => setShowIds(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </div>
          </label>

          <label className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Award size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900 dark:text-white">Hiển thị điểm câu hỏi</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Hiện (x điểm) trong bản in</div>
              </div>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={showPoints}
                onChange={(e) => setShowPoints(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </div>
          </label>
        </div>
      </div>

      {/* Tags Classification Card */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 md:p-8 space-y-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-gray-800">
          Phân loại
        </h3>

        <div className="space-y-4">
          <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
            Topic <span className="text-red-500">*</span>
          </label>
          
          {/* Search box for topics */}
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Tìm kiếm chủ đề/topic..."
              value={tagSearchQuery}
              onChange={(e) => setTagSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
            />
          </div>

          {/* Selected topics */}
          {examTags.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Đã chọn:</span>
              <div className="flex flex-wrap gap-2">
                {examTags.map((tag) => (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => handleToggleTag(tag)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    {tag} <span className="text-[10px] font-bold">✕</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search results & available topics */}
          <div className="space-y-1.5">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Danh sách chủ đề khả dụng:</span>
            <div className="flex flex-wrap gap-2.5 items-center max-h-48 overflow-y-auto p-3 border border-gray-100 dark:border-gray-800 rounded-2xl">
              {availableTags
                .filter(tag => !examTags.includes(tag) && tag.toLowerCase().includes(tagSearchQuery.toLowerCase()))
                .map((tag) => (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => handleToggleTag(tag)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer"
                  >
                    + {tag}
                  </button>
                ))}
              {availableTags.filter(tag => !examTags.includes(tag) && tag.toLowerCase().includes(tagSearchQuery.toLowerCase())).length === 0 && (
                <span className="text-xs text-gray-400 italic px-2">Không tìm thấy chủ đề nào khác.</span>
              )}
              <button
                type="button"
                onClick={handleAddCustomTag}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-dashed border-gray-300 dark:border-gray-700 text-gray-400 hover:text-primary hover:border-primary transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> Thêm mới
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Access Control Card */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 md:p-8 space-y-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-gray-800">
          Quyền truy cập
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Private */}
          <div 
            onClick={() => setAccessRights('private')}
            className={`p-5 rounded-2xl border-2 flex flex-col justify-between gap-4 cursor-pointer transition-all duration-300 ${
              accessRights === 'private'
                ? 'bg-amber-500/5 border-amber-500 shadow-md shadow-amber-500/5'
                : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                accessRights === 'private' ? 'bg-amber-500/10 text-amber-500' : 'bg-gray-50 dark:bg-gray-800 text-gray-400'
              }`}>
                <Lock size={20} />
              </div>
              <span className="font-bold text-gray-900 dark:text-white text-base">Riêng tư</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Chỉ bạn mới có thể xem đề thi và lời giải.</p>
            <div className="flex justify-end">
              <input 
                type="radio" 
                name="accessRights" 
                checked={accessRights === 'private'} 
                onChange={() => setAccessRights('private')} 
                className="accent-amber-500 w-4 h-4 cursor-pointer"
              />
            </div>
          </div>

          {/* Link */}
          <div 
            onClick={() => setAccessRights('link')}
            className={`p-5 rounded-2xl border-2 flex flex-col justify-between gap-4 cursor-pointer transition-all duration-300 ${
              accessRights === 'link'
                ? 'bg-blue-500/5 border-blue-500 shadow-md shadow-blue-500/5'
                : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                accessRights === 'link' ? 'bg-blue-500/10 text-blue-500' : 'bg-gray-50 dark:bg-gray-800 text-gray-400'
              }`}>
                <LinkIcon size={20} />
              </div>
              <span className="font-bold text-gray-900 dark:text-white text-base">Có liên kết</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Ai có link đều xem được. Không hiện ở trang chủ.</p>
            <div className="flex justify-end">
              <input 
                type="radio" 
                name="accessRights" 
                checked={accessRights === 'link'} 
                onChange={() => setAccessRights('link')} 
                className="accent-blue-500 w-4 h-4 cursor-pointer"
              />
            </div>
          </div>

          {/* Public */}
          <div 
            onClick={() => setAccessRights('public')}
            className={`p-5 rounded-2xl border-2 flex flex-col justify-between gap-4 cursor-pointer transition-all duration-300 ${
              accessRights === 'public'
                ? 'bg-emerald-500/5 border-emerald-500 shadow-md shadow-emerald-500/5'
                : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                accessRights === 'public' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-50 dark:bg-gray-800 text-gray-400'
              }`}>
                <Globe size={20} />
              </div>
              <span className="font-bold text-gray-900 dark:text-white text-base">Công khai</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Mọi người đều có thể tìm thấy và xem đề thi.</p>
            <div className="flex justify-end">
              <input 
                type="radio" 
                name="accessRights" 
                checked={accessRights === 'public'} 
                onChange={() => setAccessRights('public')} 
                className="accent-emerald-500 w-4 h-4 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3">
        <Link
          href="/admin/exams"
          className="px-5 py-3 rounded-2xl border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
        >
          Huỷ
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-primary to-blue-600 text-white font-bold shadow-lg shadow-primary/20 hover:shadow-xl transition-all duration-300 disabled:opacity-50"
        >
          <Save size={18} /> {saving ? 'Đang lưu...' : 'Lưu và tiếp tục'}
        </button>
      </div>

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
                    if (!availableTags.includes(trimmed)) {
                      setAvailableTags([...availableTags, trimmed]);
                    }
                    if (!examTags.includes(trimmed)) {
                      setExamTags([...examTags, trimmed]);
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
                    if (!availableTags.includes(trimmed)) {
                      setAvailableTags([...availableTags, trimmed]);
                    }
                    if (!examTags.includes(trimmed)) {
                      setExamTags([...examTags, trimmed]);
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
    </form>
  );
}
