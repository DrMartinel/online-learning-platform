import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// --- Exam Session DTOs ---

export const createExamSessionSchema = z.object({
  title: z.string().min(1),
  examId: z.string().uuid(),
  courseId: z.string().uuid().nullable().optional(),
  startTime: z.string().datetime(), // ISO datetime string
  endTime: z.string().datetime(),   // ISO datetime string
  durationMinutes: z.number().int().min(1),
  accessCode: z.string().optional().nullable(),
  status: z.enum(['draft', 'active', 'finished']).optional().default('draft'),
});
export class CreateExamSessionDTO extends createZodDto(createExamSessionSchema) {}

export const updateExamSessionSchema = z.object({
  title: z.string().min(1).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  durationMinutes: z.number().int().min(1).optional(),
  accessCode: z.string().optional().nullable(),
  status: z.enum(['draft', 'active', 'finished']).optional(),
  courseId: z.string().uuid().nullable().optional(),
});
export class UpdateExamSessionDTO extends createZodDto(updateExamSessionSchema) {}

// --- Exam Attempt DTOs ---

export const createExamAttemptSchema = z.object({
  sessionId: z.string().uuid(),
  accessCode: z.string().optional().nullable(),
});
export class CreateExamAttemptDTO extends createZodDto(createExamAttemptSchema) {}

export const saveProgressSchema = z.object({
  answers: z.record(z.any()), // e.g. { "questionId": { "optionIndex": 0 } } or { "questionId": "essay answer" }
});
export class SaveProgressDTO extends createZodDto(saveProgressSchema) {}

export const submitExamAttemptSchema = z.object({
  answers: z.record(z.any()),
});
export class SubmitExamAttemptDTO extends createZodDto(submitExamAttemptSchema) {}

// --- Response DTOs ---

export const examSessionResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  examId: z.string().uuid(),
  courseId: z.string().uuid().nullable(),
  startTime: z.date(),
  endTime: z.date(),
  durationMinutes: z.number(),
  accessCode: z.string().nullable(),
  status: z.string(),
  createdBy: z.string().uuid().nullable(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
});
export class ExamSessionResponseDTO extends createZodDto(examSessionResponseSchema) {}

export const examAttemptResponseSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  userId: z.string().uuid(),
  startTime: z.date(),
  submitTime: z.date().nullable(),
  answers: z.record(z.any()),
  score: z.number().nullable(),
  status: z.string(),
  createdAt: z.date(),
  gradedAt: z.date().nullable().optional(),
});
export class ExamAttemptResponseDTO extends createZodDto(examAttemptResponseSchema) {}
