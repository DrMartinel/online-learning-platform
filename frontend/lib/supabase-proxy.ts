/**
 * Supabase Proxy Client
 * 
 * Proxies all Supabase API requests through the backend API.
 * This ensures:
 * - Client never directly accesses Supabase (which is not publicly exposed)
 * - Backend can control access, logging, and rate limiting
 * - Better security: sensitive operations controlled server-side
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';
const SUPABASE_PROXY_PREFIX = '/api/supabase';

interface ProxyRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  authToken?: string;
  queryParams?: Record<string, any>;
}

class SupabaseProxyClient {
  /**
   * Make a generic proxy request
   */
  private async request(endpoint: string, options: ProxyRequestOptions = {}) {
    const {
      method = 'GET',
      body,
      headers = {},
      authToken,
      queryParams = {},
    } = options;

    // Build URL with query params
    let url = `${API_BASE_URL}${SUPABASE_PROXY_PREFIX}${endpoint}`;
    const searchParams = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    if (searchParams.toString()) {
      url += `?${searchParams.toString()}`;
    }

    // Build headers
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (authToken) {
      requestHeaders['Authorization'] = `Bearer ${authToken}`;
    }

    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Supabase proxy error: ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * REST API - Generic table query
   */
  async query(table: string, options: ProxyRequestOptions = {}) {
    const endpoint = `/rest/v1/${table}`;
    return this.request(endpoint, { method: 'GET', ...options });
  }

  /**
   * REST API - Insert rows
   */
  async insert(table: string, data: any, options: ProxyRequestOptions = {}) {
    const endpoint = `/rest/v1/${table}`;
    return this.request(endpoint, {
      method: 'POST',
      body: data,
      ...options,
    });
  }

  /**
   * REST API - Update rows
   */
  async update(table: string, data: any, options: ProxyRequestOptions = {}) {
    const endpoint = `/rest/v1/${table}`;
    return this.request(endpoint, {
      method: 'PATCH',
      body: data,
      ...options,
    });
  }

  /**
   * REST API - Delete rows
   */
  async delete(table: string, options: ProxyRequestOptions = {}) {
    const endpoint = `/rest/v1/${table}`;
    return this.request(endpoint, {
      method: 'DELETE',
      ...options,
    });
  }

  /**
   * Auth - Sign Up
   */
  async signUp(email: string, password: string) {
    return this.request('/auth/sign-up', {
      method: 'POST',
      body: { email, password },
    });
  }

  /**
   * Auth - Sign In
   */
  async signIn(email: string, password: string) {
    return this.request('/auth/sign-in', {
      method: 'POST',
      body: { email, password },
    });
  }

  /**
   * Auth - Refresh Token
   */
  async refreshToken(refreshToken: string) {
    return this.request('/auth/refresh-token', {
      method: 'POST',
      body: { refresh_token: refreshToken },
    });
  }

  /**
   * Auth - Get Current User
   */
  async getUser(authToken: string) {
    return this.request('/auth/user', {
      method: 'GET',
      authToken,
    });
  }

  /**
   * Auth - Sign Out
   */
  async signOut(authToken: string) {
    return this.request('/auth/sign-out', {
      method: 'POST',
      authToken,
    });
  }

  /**
   * Storage - Get object signed URL
   */
  async getSignedUrl(bucket: string, path: string, authToken: string, expiresIn = 86400) {
    return this.request(`/storage/object/${bucket}/${path}`, {
      method: 'GET',
      authToken,
    });
  }

  /**
   * Storage - Upload object
   */
  async uploadObject(bucket: string, path: string, file: File, authToken: string) {
    // For file uploads, we might need special handling
    // For now, return error as this needs FormData handling
    throw new Error('Use uploadObjectWithFormData for file uploads');
  }

  /**
   * Storage - Upload with FormData (needed for file uploads)
   */
  async uploadObjectWithFormData(bucket: string, path: string, file: File, authToken: string) {
    const url = `${API_BASE_URL}${SUPABASE_PROXY_PREFIX}/storage/object/${bucket}/${path}`;
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Upload failed: ${path}`, error);
      throw error;
    }
  }

  /**
   * Storage - Delete object
   */
  async deleteObject(bucket: string, path: string, authToken: string) {
    return this.request(`/storage/object/${bucket}/${path}`, {
      method: 'DELETE',
      authToken,
    });
  }
}

export const supabaseProxyClient = new SupabaseProxyClient();

/**
 * Helper: Get media proxy URL
 */
export const getProxyMediaUrl = (path: string | null | undefined, token?: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  
  if (path.startsWith('/api/media/')) {
    if (token && !path.includes('token=')) {
      const separator = path.includes('?') ? '&' : '?';
      return `${path}${separator}token=${token}`;
    }
    return path;
  }
  
  return `/api/media/course-media/${path}${token ? `?token=${token}` : ''}`;
};

/**
 * Helper: Get avatar proxy URL
 */
export const getProxyAvatarUrl = (path: string | null | undefined, token?: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  
  if (path.startsWith('/api/media/')) {
    if (token && !path.includes('token=')) {
      const separator = path.includes('?') ? '&' : '?';
      return `${path}${separator}token=${token}`;
    }
    return path;
  }
  
  return `/api/media/avatars/${path}${token ? `?token=${token}` : ''}`;
};
