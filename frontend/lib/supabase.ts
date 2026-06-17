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

export const getSignedMediaUrl = async (pathOrUrl: string | null | undefined, sessionToken?: string) => {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('http')) return pathOrUrl;
  
  // Dùng client đã xác thực nếu có token, ngược lại dùng client ẩn danh
  const supabase = sessionToken 
    ? getSupabaseClient(sessionToken)
    : createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase.storage.from('course-media').createSignedUrl(pathOrUrl, 86400); // 24 hours
  
  if (error || !data?.signedUrl) {
    console.error("Failed to generate signed URL:", error);
    return '';
  }
  
  if (isServer && process.env.SUPABASE_INTERNAL_URL) {
    return data.signedUrl.replace(
      process.env.SUPABASE_INTERNAL_URL,
      process.env.NEXT_PUBLIC_SUPABASE_URL!
    );
  }
  
  return data.signedUrl;
};
