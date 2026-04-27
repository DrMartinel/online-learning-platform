// ─── Auth ────────────────────────────────────────────────────────────────────

export interface SignUpPayload {
  email: string;
  fullName: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  } | null;
  session: AuthSession | null;
}

// ─── Courses ─────────────────────────────────────────────────────────────────

export interface Course {
  id: string;
  instructorId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  isPublished: boolean;
  createdAt: string;
}

export interface CreateCoursePayload {
  title: string;
  description?: string;
  thumbnailUrl?: string;
}

export interface UpdateCoursePayload {
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  isPublished?: boolean;
}

export interface ListCoursesFilter {
  published?: boolean;
  instructorId?: string;
}

// ─── Lessons ─────────────────────────────────────────────────────────────────

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  videoUrl?: string | null;
  content?: string | null;
  orderIndex: number;
  createdAt: string;
}

export interface CreateLessonPayload {
  courseId: string;
  title: string;
  videoUrl?: string | null;
  content?: string | null;
  orderIndex: number;
}

export interface UpdateLessonPayload {
  title?: string;
  videoUrl?: string | null;
  content?: string | null;
  orderIndex?: number;
}

// ─── User Progress ───────────────────────────────────────────────────────────

export interface UserProgress {
  id: string;
  userId: string;
  lessonId: string;
  completed: boolean;
  completedAt: string | null;
}

export interface CreateUserProgressPayload {
  lessonId: string;
  completed?: boolean;
}

export interface UpdateUserProgressPayload {
  completed: boolean;
}

export interface CourseProgress {
  courseId: string;
  progress: UserProgress[];
  completedLessonsCount: number;
  totalLessonsCount: number;
  percentage: number;
}

// ─── User Profile ────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  fullName: string;
  role: string;
  createdAt: string;
  avatarUrl?: string | null;
  email?: string;
}

export interface UpdateProfilePayload {
  fullName: string;
}

// ─── Enrolled Courses (My Courses) ───────────────────────────────────────────

export interface EnrolledCourse {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  instructorId: string;
  completedLessons: number;
  totalLessons: number;
  percentage: number;
  lastActivityAt: string | null;
}

// ─── API Error ───────────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
}
