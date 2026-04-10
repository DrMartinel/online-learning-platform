import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function createSupabaseClientForRequest(authorizationHeader?: string): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  }

  const token = extractBearerToken(authorizationHeader);

  return createClient(url, anonKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  });
}

function extractBearerToken(header?: string): string | undefined {
  if (!header) return undefined;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || undefined;
}

