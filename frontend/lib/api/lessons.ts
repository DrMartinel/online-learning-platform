import { apiFetch } from './client';
import type { Lesson, CreateLessonPayload, UpdateLessonPayload } from './types';

/**
 * GET /api/courses/:courseId/lessons
 * Alias: getLessonsByCourse
 * Get all lessons belonging to a course.
 */
export function getLessonsByCourse(courseId: string): Promise<Lesson[]> {
  return apiFetch<Lesson[]>(`/api/courses/${courseId}/lessons`);
}

/**
 * GET /api/lessons/:id
 * Get a single lesson by ID.
 */
export function getLesson(id: string): Promise<Lesson> {
  return apiFetch<Lesson>(`/api/lessons/${id}`);
}

/**
 * POST /api/lessons
 * Create a new lesson.
 */
export function createLesson(payload: CreateLessonPayload): Promise<Lesson> {
  return apiFetch<Lesson>('/api/lessons', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * PUT /api/lessons/:id
 * Update an existing lesson.
 */
export function updateLesson(id: string, payload: UpdateLessonPayload): Promise<Lesson> {
  return apiFetch<Lesson>(`/api/lessons/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * DELETE /api/lessons/:id
 * Delete a lesson.
 */
export function deleteLesson(id: string): Promise<void> {
  return apiFetch<void>(`/api/lessons/${id}`, {
    method: 'DELETE',
  });
}

/**
 * POST /api/lessons/:id/complete
 * Mark a lesson as completed for the authenticated user.
 */
export function completeLesson(lessonId: string): Promise<unknown> {
  return apiFetch(`/api/lessons/${lessonId}/complete`, {
    method: 'POST',
  });
}
