/**
 * Centralized API client for the Online Learning Platform.
 *
 * Usage:
 *   import { authApi, coursesApi, lessonsApi, userApi, userProgressApi } from '@/lib/api';
 *
 * Or import individual functions:
 *   import { login, signUp } from '@/lib/api/auth';
 *   import { listCourses, getCourse } from '@/lib/api/courses';
 */

// Re-export all modules as namespaces for convenient grouped imports
export * as authApi from './auth';
export * as coursesApi from './courses';
export * as lessonsApi from './lessons';
export * as userApi from './user';
export * as userProgressApi from './user-progress';

// Re-export types for convenience
export type {
  // Auth
  SignUpPayload,
  LoginPayload,
  AuthSession,
  AuthResponse,
  // Courses
  Course,
  CreateCoursePayload,
  UpdateCoursePayload,
  ListCoursesFilter,
  // Lessons
  Lesson,
  CreateLessonPayload,
  UpdateLessonPayload,
  // User Progress
  UserProgress,
  CreateUserProgressPayload,
  UpdateUserProgressPayload,
  CourseProgress,
  // User
  UserProfile,
  UpdateProfilePayload,
  EnrolledCourse,
  // Common
  ApiError,
} from './types';

// Re-export the ApiClientError class
export { ApiClientError } from './client';
