import { apiFetch } from './client';
import type { AuthResponse, LoginPayload, SignUpPayload } from './types';

/**
 * POST /api/auth/signup
 * Create a new user account.
 */
export function signUp(payload: SignUpPayload): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * POST /api/auth/login
 * Sign in with email and password.
 */
export function login(payload: LoginPayload): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * POST /api/auth/logout
 * End the current session.
 */
export function logout(): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>('/api/auth/logout', {
    method: 'POST',
  });
}
