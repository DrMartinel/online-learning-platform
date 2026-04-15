import { z } from 'zod';

export const lessonSchema = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid(),
  title: z.string().min(1),
  videoUrl: z.string().url().nullable().optional(),
  content: z.string().nullable().optional(),
  orderIndex: z.number().int(),
  createdAt: z.string()
}).strict();

export const createLessonRequestSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().min(1),
  videoUrl: z.string().url().nullable().optional(),
  content: z.string().nullable().optional(),
  orderIndex: z.number().int()
}).strict();

export const updateLessonRequestSchema = z.object({
  title: z.string().min(1).optional(),
  videoUrl: z.string().url().nullable().optional(),
  content: z.string().nullable().optional(),
  orderIndex: z.number().int().optional()
}).strict();

export type LessonDTO = z.infer<typeof lessonSchema>;
export type CreateLessonRequestDTO = z.infer<typeof createLessonRequestSchema>;
export type UpdateLessonRequestDTO = z.infer<typeof updateLessonRequestSchema>;
