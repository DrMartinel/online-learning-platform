import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// --- Exam Question (join) DTOs ---

export const addExamQuestionSchema = z.object({
  questionId: z.string().uuid(),
  orderIndex: z.number().int().min(0),
  points: z.number().min(0).default(1),
});
export class AddExamQuestionDTO extends createZodDto(addExamQuestionSchema) {}

export const updateExamQuestionSchema = z.object({
  orderIndex: z.number().int().min(0).optional(),
  points: z.number().min(0).optional(),
});
export class UpdateExamQuestionDTO extends createZodDto(updateExamQuestionSchema) {}

// --- Exam DTOs ---

export const createExamSchema = z.object({
  courseId: z.string().uuid().optional(),
  title: z.string().min(1),
  headerContent: z.string().optional(),
  questions: z.array(addExamQuestionSchema).optional(),
  questionLabel: z.string().optional().default('Câu'),
  tags: z.array(z.string()).optional().default([]),
  accessRights: z.string().optional().default('private'),
});
export class CreateExamDTO extends createZodDto(createExamSchema) {}

export const updateExamSchema = z.object({
  title: z.string().min(1).optional(),
  headerContent: z.string().optional(),
  questionLabel: z.string().optional(),
  tags: z.array(z.string()).optional(),
  accessRights: z.string().optional(),
  courseId: z.string().uuid().nullable().optional(),
});
export class UpdateExamDTO extends createZodDto(updateExamSchema) {}

// --- Response DTOs ---

export const examQuestionResponseSchema = z.object({
  id: z.string().uuid(),
  examId: z.string().uuid(),
  questionId: z.string().uuid(),
  orderIndex: z.number(),
  points: z.number(),
});
export class ExamQuestionResponseDTO extends createZodDto(examQuestionResponseSchema) {}

export const examResponseSchema = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid().nullable(),
  createdBy: z.string().uuid().nullable(),
  title: z.string(),
  headerContent: z.string().nullable(),
  questionLabel: z.string(),
  tags: z.array(z.string()),
  accessRights: z.string(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  questions: z.array(examQuestionResponseSchema),
});
export class ExamResponseDTO extends createZodDto(examResponseSchema) {}

// --- Filter DTO ---

export const listExamsFilterSchema = z.object({
  courseId: z.string().uuid().optional(),
});
export class ListExamsFilterDTO extends createZodDto(listExamsFilterSchema) {}
