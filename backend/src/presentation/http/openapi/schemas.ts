import { z, type ZodTypeAny } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  authResultSchema,
  signInRequestSchema,
  signUpRequestSchema,
} from '../../../application/dtos/AuthDTOs';
import {
  lessonSchema,
  createLessonRequestSchema,
  updateLessonRequestSchema,
} from '../../../application/dtos/LessonDTOs';
import {
  createUserProgressSchema,
  updateUserProgressSchema,
  userProgressSchema,
  courseProgressSchema,
} from '../../../application/dtos/UserProgressDTOs';

const jsonSchemaOpts = {
  target: 'openApi3' as const,
  $refStrategy: 'none' as const,
};

/** Cast `schema` to break deep generic recursion between Zod 3 and zod-to-json-schema during typecheck. */
function toOpenApiSchema(schema: ZodTypeAny): Record<string, unknown> {
  return zodToJsonSchema(schema as never, jsonSchemaOpts) as Record<string, unknown>;
}

/** Fastify / OpenAPI body & response JSON Schemas derived from Zod (single source of truth). */
export const signUpBodySchema = toOpenApiSchema(signUpRequestSchema as ZodTypeAny);
export const signInBodySchema = toOpenApiSchema(signInRequestSchema as ZodTypeAny);
export const authResultJsonSchema = toOpenApiSchema(authResultSchema as ZodTypeAny);

/** User Progress Schemas */
export const createUserProgressBodySchema = toOpenApiSchema(createUserProgressSchema as ZodTypeAny);
export const updateUserProgressBodySchema = toOpenApiSchema(updateUserProgressSchema as ZodTypeAny);
export const userProgressResponseSchema = toOpenApiSchema(userProgressSchema as ZodTypeAny);
export const courseProgressResponseSchema = toOpenApiSchema(courseProgressSchema as ZodTypeAny);

const errorBodyZ = z.object({ error: z.string() }).strict();
export const errorBodySchema = toOpenApiSchema(errorBodyZ as ZodTypeAny);

const logoutSuccessZ = z.object({ success: z.boolean() }).strict();
export const logoutSuccessSchema = toOpenApiSchema(logoutSuccessZ as ZodTypeAny);

const healthOkZ = z.object({ ok: z.boolean() }).strict();
export const healthOkSchema = toOpenApiSchema(healthOkZ as ZodTypeAny);

// Course schemas
const createCourseBodyZ = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  thumbnailUrl: z.string().url().optional(),
}).strict();

const updateCourseBodyZ = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').optional(),
  description: z.string().optional(),
  thumbnailUrl: z.string().url().optional(),
  isPublished: z.boolean().optional(),
}).strict();

const courseResponseZ = z.object({
  id: z.string().uuid(),
  instructorId: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  isPublished: z.boolean(),
  createdAt: z.string().datetime(),
}).strict();

export const createCourseBodySchema = toOpenApiSchema(createCourseBodyZ as ZodTypeAny);
export const updateCourseBodySchema = toOpenApiSchema(updateCourseBodyZ as ZodTypeAny);
export const courseResponseSchema = toOpenApiSchema(courseResponseZ as ZodTypeAny);
export const courseListSchema = toOpenApiSchema(z.array(courseResponseZ) as ZodTypeAny);
export const lessonJsonSchema = toOpenApiSchema(lessonSchema as ZodTypeAny);
export const createLessonBodySchema = toOpenApiSchema(createLessonRequestSchema as ZodTypeAny);
export const updateLessonBodySchema = toOpenApiSchema(updateLessonRequestSchema as ZodTypeAny);
