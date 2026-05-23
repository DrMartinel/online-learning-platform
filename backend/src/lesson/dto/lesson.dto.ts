import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const createLessonSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().min(1),
  content: z.string().optional(),
  videoUrl: z.string().url().optional(),
  orderIndex: z.number().int().min(0),
});
export class CreateLessonDTO extends createZodDto(createLessonSchema) {}

export const updateLessonSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  videoUrl: z.string().url().optional(),
  orderIndex: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
});
export class UpdateLessonDTO extends createZodDto(updateLessonSchema) {}

export const lessonResponseSchema = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid(),
  title: z.string(),
  content: z.string().optional(),
  videoUrl: z.string().optional(),
  orderIndex: z.number().int(),
  isPublished: z.boolean(),
  createdAt: z.date(),
});
export class LessonResponseDTO extends createZodDto(lessonResponseSchema) {}
