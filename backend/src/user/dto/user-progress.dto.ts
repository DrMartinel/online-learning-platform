import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const createUserProgressSchema = z.object({
  courseId: z.string().uuid(),
  lessonId: z.string().uuid(),
});
export class CreateUserProgressDTO extends createZodDto(createUserProgressSchema) {}

export const updateUserProgressSchema = z.object({
  isCompleted: z.boolean().optional(),
  lastPosition: z.number().int().min(0).optional(),
});
export class UpdateUserProgressDTO extends createZodDto(updateUserProgressSchema) {}

export const userProgressResponseSchema = z.object({
  userId: z.string().uuid(),
  courseId: z.string().uuid().optional(),
  lessonId: z.string().uuid(),
  isCompleted: z.boolean(),
  completedAt: z.date().optional().nullable(),
});
export class UserProgressResponseDTO extends createZodDto(userProgressResponseSchema) {}

// Matches the CourseProgressResponse interface expected by the frontend
export const courseProgressResponseSchema = z.object({
  completedLessonsCount: z.number().int().min(0),
  totalLessonsCount: z.number().int().min(0),
  percentage: z.number().min(0).max(100),
  progress: z.array(
    z.object({
      lessonId: z.string().uuid(),
      completed: z.boolean(),
    }),
  ),
});
export class CourseProgressResponseDTO extends createZodDto(courseProgressResponseSchema) {}
