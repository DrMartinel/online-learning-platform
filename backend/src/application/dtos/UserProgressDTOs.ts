import { z } from 'zod';

/** Schema for individual user progress record */
export const userProgressSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  lessonId: z.string().uuid(),
  completed: z.boolean(),
  completedAt: z.string().datetime().nullable(),
}).strict();

export type UserProgressDTO = z.infer<typeof userProgressSchema>;

/** Payload for creating a progress record */
export const createUserProgressSchema = z.object({
  lessonId: z.string().uuid(),
  completed: z.boolean().default(false),
}).strict();

export type CreateUserProgressDTO = z.infer<typeof createUserProgressSchema>;

/** Payload for updating a progress record */
export const updateUserProgressSchema = z.object({
  completed: z.boolean(),
}).strict();

export type UpdateUserProgressDTO = z.infer<typeof updateUserProgressSchema>;

/** Response for a course's progress overview */
export const courseProgressSchema = z.object({
  courseId: z.string().uuid(),
  progress: z.array(userProgressSchema),
  completedLessonsCount: z.number(),
  totalLessonsCount: z.number(),
  percentage: z.number(),
}).strict();

export type CourseProgressDTO = z.infer<typeof courseProgressSchema>;
