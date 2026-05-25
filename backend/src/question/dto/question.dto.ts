import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// --- Shared sub-schemas ---

const mcqOptionSchema = z.object({
  label: z.string().min(1),
  text: z.string().min(1),
});

const questionTypeSchema = z.enum(['essay', 'single_choice', 'multiple_choice']);

// --- Variant DTOs ---

export const createVariantSchema = z.object({
  content: z.string().min(1),
  options: z.array(mcqOptionSchema).optional(),
  correctAnswer: z.any().optional(),
  explanation: z.string().optional(),
});
export class CreateVariantDTO extends createZodDto(createVariantSchema) {}

export const updateVariantSchema = z.object({
  content: z.string().min(1).optional(),
  options: z.array(mcqOptionSchema).optional(),
  correctAnswer: z.any().optional(),
  explanation: z.string().optional(),
});
export class UpdateVariantDTO extends createZodDto(updateVariantSchema) {}

// --- Question DTOs ---

export const createQuestionSchema = z.object({
  type: questionTypeSchema,
  tags: z.array(z.string()).optional(),
  variants: z.array(createVariantSchema).min(1),
});
export class CreateQuestionDTO extends createZodDto(createQuestionSchema) {}

export const updateQuestionSchema = z.object({
  type: questionTypeSchema.optional(),
  tags: z.array(z.string()).optional(),
});
export class UpdateQuestionDTO extends createZodDto(updateQuestionSchema) {}

// --- Response DTOs ---

export const variantResponseSchema = z.object({
  id: z.string().uuid(),
  questionId: z.string().uuid(),
  variantIndex: z.number(),
  content: z.string(),
  options: z.array(mcqOptionSchema).nullable(),
  correctAnswer: z.any().nullable(),
  explanation: z.string().nullable(),
  createdAt: z.date(),
});
export class VariantResponseDTO extends createZodDto(variantResponseSchema) {}

export const questionResponseSchema = z.object({
  id: z.string().uuid(),
  type: questionTypeSchema,
  tags: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  variants: z.array(variantResponseSchema),
});
export class QuestionResponseDTO extends createZodDto(questionResponseSchema) {}

// --- Filter DTO ---

export const listQuestionsFilterSchema = z.object({
  type: questionTypeSchema.optional(),
  tag: z.string().optional(),
});
export class ListQuestionsFilterDTO extends createZodDto(listQuestionsFilterSchema) {}
