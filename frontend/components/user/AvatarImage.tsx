"use client";

import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { getSignedAvatarUrl } from '@/lib/supabase';

interface AvatarImageProps {
  avatarUrl: string | null | undefined;
  fullName?: string;
  className?: string;
}

export default function AvatarImage({ avatarUrl, fullName, className = "w-10 h-10 rounded-full object-cover" }: AvatarImageProps) {
  const [signedUrl, setSignedUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    async function loadUrl() {
      if (!avatarUrl) return;
      if (avatarUrl.startsWith('http')) {
        setSignedUrl(avatarUrl);
        return;
      }
      
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.token) {
            const url = await getSignedAvatarUrl(avatarUrl, data.token);
            if (isMounted) setSignedUrl(url);
          }
        }
      } catch (err) {
        console.error("Failed to load signed avatar URL:", err);
      }
    }
    loadUrl();
    return () => { isMounted = false; };
  }, [avatarUrl]);

  if (!avatarUrl && !signedUrl) {
    return (
      <div className={`${className.replace('object-cover', 'flex items-center justify-center')} bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700`}>
        <User size={Math.max(16, parseInt(className.match(/w-(\d+)/)?.[1] || '10') * 2)} className="text-gray-400" />
      </div>
    );
  }

  if (!signedUrl) {
    // Loading state
    return <div className={`${className} bg-gray-200 dark:bg-gray-800 animate-pulse`} />;
  }

  return <img src={signedUrl} alt={fullName || 'Avatar'} className={className} />;
}
