import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const createLessonContentSchema = z.object({
  lessonId: z.string().uuid(),
  type: z.enum(['video', 'document', 'exam']),
  title: z.string().min(1),
  url: z.string().min(1),
  durationMinutes: z.number().min(0).optional().nullable(),
  orderIndex: z.number().int().min(0).optional().default(0),
});
export class CreateLessonContentDTO extends createZodDto(createLessonContentSchema) {}

export const updateLessonContentSchema = z.object({
  title: z.string().min(1).optional(),
  url: z.string().min(1).optional(),
  durationMinutes: z.number().min(0).optional().nullable(),
  orderIndex: z.number().int().min(0).optional(),
});
export class UpdateLessonContentDTO extends createZodDto(updateLessonContentSchema) {}

export const lessonContentResponseSchema = z.object({
  id: z.string().uuid(),
  lessonId: z.string().uuid(),
  type: z.string(),
  title: z.string(),
  url: z.string(),
  durationMinutes: z.number().optional().nullable(),
  orderIndex: z.number().int(),
  createdAt: z.date(),
});
export class LessonContentResponseDTO extends createZodDto(lessonContentResponseSchema) {}
