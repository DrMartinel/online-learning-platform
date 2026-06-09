import { createClient } from '@supabase/supabase-js';

const isServer = typeof window === 'undefined';
const supabaseUrl = (isServer && process.env.SUPABASE_INTERNAL_URL)
  ? process.env.SUPABASE_INTERNAL_URL
  : process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// We use the anon key on the client to securely interact with Storage using RLS policies.
// The user must pass the 'Authorization: Bearer <session-token>' when making requests.
export const getSupabaseClient = (sessionToken: string) => {
  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    },
  });
};

export const getMediaUrl = (pathOrUrl: string | null | undefined) => {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('http')) return pathOrUrl;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/course-media/${pathOrUrl}`;
};

export const getSignedMediaUrl = async (pathOrUrl: string | null | undefined): Promise<string> => {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('http')) return pathOrUrl;

  // course-media is a PUBLIC bucket — use the direct public URL instead of a
  // signed URL. Signed URLs require a session token that the anon key alone
  // cannot provide, causing a silent empty string and "Bài học là tài liệu đọc".
  // On the server we use SUPABASE_INTERNAL_URL to reach Kong, but the browser
  // needs the public-facing URL, so we always return NEXT_PUBLIC_SUPABASE_URL.
  const publicBase = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${publicBase}/storage/v1/object/public/course-media/${pathOrUrl}`;
};
