import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// We use the anon key on the client to securely interact with Storage using RLS policies.
// The user must pass the 'Authorization: Bearer <session-token>' when making requests.
export const getSupabaseClient = (sessionToken: string) => {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
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
  return `${supabaseUrl}/storage/v1/object/public/course-media/${pathOrUrl}`;
};
