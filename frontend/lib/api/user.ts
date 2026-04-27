import { apiFetch } from './client';
import type { UserProfile, UpdateProfilePayload, EnrolledCourse } from './types';

/**
 * GET /api/user/profile
 * Get the authenticated user's profile.
 */
export function getProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>('/api/user/profile');
}

/**
 * PUT /api/user/profile
 * Update the authenticated user's profile.
 */
export function updateProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
  return apiFetch<UserProfile>('/api/user/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * GET /api/user/my-courses
 * Get all courses the authenticated user is enrolled in, with progress stats.
 */
export function getMyCourses(): Promise<EnrolledCourse[]> {
  return apiFetch<EnrolledCourse[]>('/api/user/my-courses');
}
