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

const errorBodyZ = z.object({ error: z.string() }).strict();
export const errorBodySchema = toOpenApiSchema(errorBodyZ as ZodTypeAny);

const logoutSuccessZ = z.object({ success: z.boolean() }).strict();
export const logoutSuccessSchema = toOpenApiSchema(logoutSuccessZ as ZodTypeAny);

const healthOkZ = z.object({ ok: z.boolean() }).strict();
export const healthOkSchema = toOpenApiSchema(healthOkZ as ZodTypeAny);

export const lessonJsonSchema = toOpenApiSchema(lessonSchema as ZodTypeAny);
export const createLessonBodySchema = toOpenApiSchema(createLessonRequestSchema as ZodTypeAny);
export const updateLessonBodySchema = toOpenApiSchema(updateLessonRequestSchema as ZodTypeAny);
