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
  courseId: z.string().uuid(),
  lessonId: z.string().uuid(),
  isCompleted: z.boolean(),
  lastPosition: z.number().int().min(0),
  completedAt: z.date().optional(),
  updatedAt: z.date(),
});
export class UserProgressResponseDTO extends createZodDto(userProgressResponseSchema) {}

export const courseProgressResponseSchema = z.object({
  courseId: z.string().uuid(),
  totalLessons: z.number().int().min(0),
  completedLessons: z.number().int().min(0),
  progressPercentage: z.number().min(0).max(100),
});
export class CourseProgressResponseDTO extends createZodDto(courseProgressResponseSchema) {}
