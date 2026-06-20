import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const createCommentSchema = z.object({
  lessonId: z.string().uuid(),
  content: z.string().min(1),
  parentId: z.string().uuid().optional().nullable(),
});
export class CreateCommentDTO extends createZodDto(createCommentSchema) {}

export const updateCommentSchema = z.object({
  content: z.string().min(1),
});
export class UpdateCommentDTO extends createZodDto(updateCommentSchema) {}

export const commentResponseSchema = z.object({
  id: z.string().uuid(),
  lessonId: z.string().uuid(),
  userId: z.string().uuid(),
  content: z.string(),
  parentId: z.string().uuid().optional().nullable(),
  createdAt: z.date(),
  userFullName: z.string().optional(),
  userAvatarUrl: z.string().optional(),
});
export class CommentResponseDTO extends createZodDto(commentResponseSchema) {}
