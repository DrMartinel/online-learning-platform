import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const createChapterSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().min(1),
  orderIndex: z.number().min(0).optional().default(0),
});
export class CreateChapterDTO extends createZodDto(createChapterSchema) {}

export const updateChapterSchema = z.object({
  title: z.string().min(1).optional(),
  orderIndex: z.number().min(0).optional(),
});
export class UpdateChapterDTO extends createZodDto(updateChapterSchema) {}

export const chapterResponseSchema = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid(),
  title: z.string(),
  orderIndex: z.number(),
  createdAt: z.date(),
});
export class ChapterResponseDTO extends createZodDto(chapterResponseSchema) {}
