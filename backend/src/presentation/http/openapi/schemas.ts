import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  authResultSchema,
  signInRequestSchema,
  signUpRequestSchema,
} from '../../../application/dtos/AuthDTOs';

const jsonSchemaOpts = {
  target: 'openApi3' as const,
  $refStrategy: 'none' as const,
};

/** Fastify / OpenAPI body & response JSON Schemas derived from Zod (single source of truth). */
export const signUpBodySchema = zodToJsonSchema(signUpRequestSchema, jsonSchemaOpts);
export const signInBodySchema = zodToJsonSchema(signInRequestSchema, jsonSchemaOpts);
export const authResultJsonSchema = zodToJsonSchema(authResultSchema, jsonSchemaOpts);

const errorBodyZ = z.object({ error: z.string() }).strict();
export const errorBodySchema = zodToJsonSchema(errorBodyZ, jsonSchemaOpts);

const logoutSuccessZ = z.object({ success: z.boolean() }).strict();
export const logoutSuccessSchema = zodToJsonSchema(logoutSuccessZ, jsonSchemaOpts);

const healthOkZ = z.object({ ok: z.boolean() }).strict();
export const healthOkSchema = zodToJsonSchema(healthOkZ, jsonSchemaOpts);
