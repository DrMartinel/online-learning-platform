import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'edge';
const isServer = typeof window === 'undefined';
const supabaseInternalUrl = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ bucket: string; path: string[] }> }
) {
  const params = await props.params;
  const { bucket, path } = params;
  const filePath = path.join('/');

  const searchParams = request.nextUrl.searchParams;
  let token = searchParams.get('token');
  
  if (!token) {
    const cookieStore = await cookies();
    token = cookieStore.get('olp_session')?.value || null;
  }

  if (!filePath) {
    return new Response('File path is required', { status: 400 });
  }

  // Determine the URL to fetch from Supabase
  // We use the authenticated endpoint for private buckets to allow fetching with token
  const isPrivateBucket = bucket === 'avatars' || bucket === 'course-media';
  
  let targetUrl = `${supabaseInternalUrl}/storage/v1/object/${isPrivateBucket ? 'authenticated' : 'public'}/${bucket}/${filePath}`;

  // Build fetch headers, including Range for video streaming
  const headers = new Headers();
  
  const range = request.headers.get('range');
  if (range) {
    headers.set('range', range);
  }

  if (isPrivateBucket && token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  console.log(`[Media Proxy] Request for ${filePath}. Range header:`, range);

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers,
      cache: 'no-store', // Prevent Next.js from caching the full file and ignoring Range
      // Pass the signal to abort the fetch if the client disconnects
      signal: request.signal,
    });

    if (!response.ok) {
      return new Response(response.statusText, { status: response.status });
    }

    // Forward the response stream and relevant headers
    const responseHeaders = new Headers();
    const headersToForward = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'etag',
      'last-modified',
      'cache-control'
    ];

    headersToForward.forEach((header) => {
      const value = response.headers.get(header);
      if (value) {
        responseHeaders.set(header, value);
      }
    });

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error(`Media proxy error for ${bucket}/${filePath}:`, error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ bucket: string; path: string[] }> }
) {
  const params = await props.params;
  const { bucket, path } = params;
  const filePath = path.join('/');

  if (!filePath) {
    return new Response('File path is required', { status: 400 });
  }

  let token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    const cookieStore = await cookies();
    token = cookieStore.get('olp_session')?.value || undefined;
  }

  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const targetUrl = `${supabaseInternalUrl}/storage/v1/object/${bucket}/${filePath}`;
    
    const headers = new Headers();
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Content-Type', request.headers.get('Content-Type') || 'application/octet-stream');
    headers.set('x-upsert', 'true'); // Allow overwriting

    // Stream the binary request body directly to Supabase!
    // This avoids memory limits and failed FormData parsing for huge video files.
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: request.body,
      // @ts-ignore - duplex is required when passing ReadableStream body in Node.js fetch
      duplex: 'half',
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(errorText, { status: response.status });
    }

    const responseData = await response.json();
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(`Media upload proxy error for ${bucket}/${filePath}:`, error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

