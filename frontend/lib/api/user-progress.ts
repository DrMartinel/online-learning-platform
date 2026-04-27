import { apiFetch } from './client';
import type {
  UserProgress,
  CreateUserProgressPayload,
  UpdateUserProgressPayload,
  CourseProgress,
} from './types';

/**
 * GET /api/user-progress/course/:courseId
 * Get overall progress for a specific course.
 */
export function getCourseProgress(courseId: string): Promise<CourseProgress> {
  return apiFetch<CourseProgress>(`/api/user-progress/course/${courseId}`);
}

/**
 * GET /api/user-progress/lesson/:lessonId
 * Get progress for a specific lesson.
 */
export function getLessonProgress(lessonId: string): Promise<UserProgress> {
  return apiFetch<UserProgress>(`/api/user-progress/lesson/${lessonId}`);
}

/**
 * POST /api/user-progress
 * Create or upsert a progress record.
 */
export function createUserProgress(payload: CreateUserProgressPayload): Promise<UserProgress> {
  return apiFetch<UserProgress>('/api/user-progress', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * PATCH /api/user-progress/:id
 * Update an existing progress record.
 */
export function updateUserProgress(id: string, payload: UpdateUserProgressPayload): Promise<UserProgress> {
  return apiFetch<UserProgress>(`/api/user-progress/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/**
 * DELETE /api/user-progress/:id
 * Delete (reset) a progress record.
 */
export function deleteUserProgress(id: string): Promise<void> {
  return apiFetch<void>(`/api/user-progress/${id}`, {
    method: 'DELETE',
  });
}
