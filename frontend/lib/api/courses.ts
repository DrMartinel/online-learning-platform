import { apiFetch } from './client';
import type { Course, CreateCoursePayload, UpdateCoursePayload, ListCoursesFilter } from './types';

/**
 * GET /api/courses
 * List all courses with optional filters.
 */
export function listCourses(filter?: ListCoursesFilter): Promise<Course[]> {
  const params = new URLSearchParams();
  if (filter?.published !== undefined) params.set('published', String(filter.published));
  if (filter?.instructorId) params.set('instructorId', filter.instructorId);

  const qs = params.toString();
  return apiFetch<Course[]>(`/api/courses${qs ? `?${qs}` : ''}`);
}

/**
 * GET /api/courses/:id
 * Get a single course by ID.
 */
export function getCourse(id: string): Promise<Course> {
  return apiFetch<Course>(`/api/courses/${id}`);
}

/**
 * POST /api/courses
 * Create a new course (instructor only).
 */
export function createCourse(payload: CreateCoursePayload): Promise<Course> {
  return apiFetch<Course>('/api/courses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * PUT /api/courses/:id
 * Update an existing course.
 */
export function updateCourse(id: string, payload: UpdateCoursePayload): Promise<Course> {
  return apiFetch<Course>(`/api/courses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * DELETE /api/courses/:id
 * Delete a course.
 */
export function deleteCourse(id: string): Promise<void> {
  return apiFetch<void>(`/api/courses/${id}`, {
    method: 'DELETE',
  });
}

/**
 * POST /api/courses/:id/enroll
 * Enroll the authenticated user in a course.
 */
export function enrollInCourse(courseId: string): Promise<unknown> {
  return apiFetch(`/api/courses/${courseId}/enroll`, {
    method: 'POST',
  });
}
