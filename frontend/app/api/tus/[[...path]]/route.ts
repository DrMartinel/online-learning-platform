import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'edge';
const supabaseInternalUrl = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;

// Helper to proxy TUS requests to internal Supabase
async function proxyTusRequest(request: NextRequest, props: { params: Promise<{ path?: string[] }> }) {
  const params = await props.params;
  const path = params?.path || [];
  
  // For POST (creation), path is empty.
  // For PATCH/HEAD (upload/status), path contains the upload ID.
  const reqPath = path.length > 0 ? '/' + path.join('/') : '';
  
  let token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    const cookieStore = await cookies();
    token = cookieStore.get('olp_session')?.value || undefined;
  }

  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }

  const targetUrl = `${supabaseInternalUrl}/storage/v1/upload/resumable${reqPath}`;

  const headers = new Headers();
  
  // Forward all necessary TUS headers
  request.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.startsWith('tus-') ||
      lowerKey === 'upload-offset' ||
      lowerKey === 'upload-length' ||
      lowerKey === 'upload-metadata' ||
      lowerKey === 'upload-concat' ||
      lowerKey === 'x-upsert' ||
      lowerKey === 'content-type' ||
      lowerKey === 'content-length' ||
      lowerKey === 'origin'
    ) {
      headers.set(key, value);
    }
  });

  headers.set('Authorization', `Bearer ${token}`);

  try {
    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
    };

    if (request.method === 'POST' || request.method === 'PATCH') {
      fetchOptions.body = request.body;
      // @ts-ignore - Required for streaming bodies in Node.js fetch
      fetchOptions.duplex = 'half';
    }

    const response = await fetch(targetUrl, fetchOptions);

    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      // Rewrite the Location header for TUS uploads so the client hits our Next.js proxy, not the internal URL
      if (lowerKey === 'location') {
        const urlParts = value.split('/storage/v1/upload/resumable');
        if (urlParts.length > 1) {
          responseHeaders.set(key, `/api/tus${urlParts[1]}`);
        } else {
          responseHeaders.set(key, value);
        }
      } 
      // Forward all TUS response headers back to the client
      else if (
        lowerKey.startsWith('tus-') || 
        lowerKey === 'upload-offset' || 
        lowerKey === 'upload-length' ||
        lowerKey === 'upload-expires' ||
        lowerKey === 'access-control-expose-headers' ||
        lowerKey === 'access-control-allow-origin' ||
        lowerKey === 'access-control-allow-methods' ||
        lowerKey === 'access-control-allow-headers'
      ) {
        responseHeaders.set(key, value);
      }
    });

    // Supabase sets Access-Control-Expose-Headers for TUS, make sure we forward them
    if (!responseHeaders.has('Access-Control-Expose-Headers')) {
      responseHeaders.set('Access-Control-Expose-Headers', 'Location, Tus-Resumable, Tus-Version, Tus-Max-Size, Tus-Extension, Upload-Offset, Upload-Length, Upload-Expires');
    }

    if (response.status === 204 || response.status === 304 || request.method === 'HEAD') {
      return new Response(null, {
        status: response.status,
        headers: responseHeaders,
      });
    }

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(`TUS proxy error for ${reqPath}:`, error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function GET(req: NextRequest, props: any) { return proxyTusRequest(req, props); }
export async function POST(req: NextRequest, props: any) { return proxyTusRequest(req, props); }
export async function PATCH(req: NextRequest, props: any) { return proxyTusRequest(req, props); }
export async function HEAD(req: NextRequest, props: any) { return proxyTusRequest(req, props); }
export async function OPTIONS(req: NextRequest, props: any) { return proxyTusRequest(req, props); }
