"use client";

import { User } from 'lucide-react';
import { getProxyAvatarUrl } from '@/lib/supabase-proxy';

interface AvatarImageProps {
  avatarUrl: string | null | undefined;
  fullName?: string;
  className?: string;
}

export default function AvatarImage({ avatarUrl, fullName, className = "w-10 h-10 rounded-full object-cover" }: AvatarImageProps) {
  if (!avatarUrl) {
    return (
      <div className={`${className.replace('object-cover', 'flex items-center justify-center')} bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700`}>
        <User size={Math.max(16, parseInt(className.match(/w-(\d+)/)?.[1] || '10') * 2)} className="text-gray-400" />
      </div>
    );
  }

  const proxyUrl = getProxyAvatarUrl(avatarUrl);

  return <img src={proxyUrl} alt={fullName || 'Avatar'} className={className} />;
}

