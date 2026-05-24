import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// --- Request DTOs ---

export const QueryRAGSchema = z.object({
  question: z.string().min(1, 'Question is required').max(2000),
  courseId: z.string().uuid().optional(),
  maxResults: z.number().int().min(1).max(20).optional().default(5),
});

export class QueryRAGDto extends createZodDto(QueryRAGSchema) {}

export const IngestCourseSchema = z.object({
  courseId: z.string().uuid(),
});

export class IngestCourseDto extends createZodDto(IngestCourseSchema) {}

// --- Response DTOs ---

export const RAGSourceSchema = z.object({
  lessonId: z.string().uuid().nullable(),
  courseId: z.string().uuid(),
  content: z.string(),
  sourceType: z.enum(['text', 'video_transcript']),
  similarity: z.number(),
  timestamp: z.string().optional(), // e.g. "00:03:42" for video sources
});

export const RAGResponseSchema = z.object({
  answer: z.string(),
  sources: z.array(RAGSourceSchema),
});

export class RAGResponseDto extends createZodDto(RAGResponseSchema) {}

export const IngestStatusSchema = z.object({
  courseId: z.string().uuid(),
  totalChunks: z.number().int(),
  textChunks: z.number().int(),
  videoTranscriptChunks: z.number().int(),
  lastUpdated: z.string().datetime().nullable(),
});

export class IngestStatusDto extends createZodDto(IngestStatusSchema) {}

// Inferred types for service use
export type QueryRAGInput = z.infer<typeof QueryRAGSchema>;
export type RAGResponse = z.infer<typeof RAGResponseSchema>;
export type RAGSource = z.infer<typeof RAGSourceSchema>;
export type IngestStatus = z.infer<typeof IngestStatusSchema>;
