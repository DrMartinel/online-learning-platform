'use client';

import { useState, useRef, useEffect } from 'react';
import { User, Save, Loader2, CheckCircle2, Camera } from 'lucide-react';
import { supabaseProxyClient, getProxyAvatarUrl } from '@/lib/supabase-proxy';

interface UserProfile {
  id: string;
  fullName: string | null;
  role: string;
  createdAt: string;
  avatarUrl: string | null;
  email: string | undefined;
}

interface ProfileFormProps {
  initialProfile: UserProfile;
  token: string;
}

export default function ProfileForm({ initialProfile, token }: ProfileFormProps) {
  const [fullName, setFullName] = useState(initialProfile.fullName ?? '');
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatarUrl ?? '');
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadSignedUrl() {
      if (!avatarUrl) {
        setAvatarPreviewUrl('');
        return;
      }
      if (avatarUrl.startsWith('http')) {
        setAvatarPreviewUrl(avatarUrl);
        return;
      }
      try {
        const signedUrl = await supabaseProxyClient.getSignedUrl('avatars', avatarUrl, token);
        if (isMounted) setAvatarPreviewUrl(signedUrl);
      } catch (err) {
        console.error("Failed to load signed avatar URL:", err);
      }
    }
    loadSignedUrl();
    return () => { isMounted = false; };
  }, [avatarUrl, token]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setErrorMsg('');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar_${initialProfile.id}_${Date.now()}.${fileExt}`;

      await supabaseProxyClient.uploadObjectWithFormData('avatars', fileName, file, token);
      setAvatarUrl(fileName);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi tải ảnh lên.');
      setStatus('error');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: fullName.trim(), avatarUrl: avatarUrl }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to update profile');
      }

      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
      setStatus('error');
    }
  };

  const roleLabel: Record<string, string> = {
    student: 'Học viên',
    instructor: 'Giảng viên',
    admin: 'Quản trị viên',
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar placeholder */}
      <div className="flex items-center gap-5">
        <div className="relative group">
          <div className="w-20 h-20 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center border-2 border-[var(--color-primary)]/20 shrink-0 overflow-hidden relative">
            {avatarPreviewUrl ? (
              <img
                src={avatarPreviewUrl}
                alt={fullName || 'Avatar'}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-9 h-9 text-[var(--color-primary)]" />
            )}
            
            {/* Upload Overlay */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full"
            >
              {uploadingAvatar ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
            </div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleAvatarUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-white text-lg">
            {fullName || 'Chưa đặt tên'}
          </p>
          <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
            {roleLabel[initialProfile.role] ?? initialProfile.role}
          </span>
        </div>
      </div>

      {/* Email (read-only) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Email
        </label>
        <input
          type="email"
          value={initialProfile.email ?? ''}
          readOnly
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed text-sm"
        />
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Email không thể thay đổi.</p>
      </div>

      {/* Full name */}
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Họ và tên
        </label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Họ và tên của bạn"
          maxLength={100}
          required
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)] transition"
        />
      </div>

      {/* Role (read-only) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Vai trò
        </label>
        <input
          type="text"
          value={roleLabel[initialProfile.role] ?? initialProfile.role}
          readOnly
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed text-sm"
        />
      </div>

      {/* Member since */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Thành viên từ
        </label>
        <input
          type="text"
          value={new Date(initialProfile.createdAt).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
          readOnly
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed text-sm"
        />
      </div>

      {/* Error message */}
      {status === 'error' && (
        <p className="text-sm text-red-500 dark:text-red-400">{errorMsg}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={status === 'loading' || status === 'success' || uploadingAvatar || !fullName.trim()}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-dark)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {status === 'loading' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : status === 'success' ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        {status === 'loading' ? 'Đang lưu…' : status === 'success' ? 'Đã lưu!' : 'Lưu thay đổi'}
      </button>
    </form>
  );
}
