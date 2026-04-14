"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.courseListSchema = exports.courseResponseSchema = exports.updateCourseBodySchema = exports.createCourseBodySchema = exports.healthOkSchema = exports.logoutSuccessSchema = exports.errorBodySchema = exports.authResultJsonSchema = exports.signInBodySchema = exports.signUpBodySchema = void 0;
const zod_1 = require("zod");
const zod_to_json_schema_1 = require("zod-to-json-schema");
const AuthDTOs_1 = require("../../../application/dtos/AuthDTOs");
const jsonSchemaOpts = {
    target: 'openApi3',
    $refStrategy: 'none',
};
/** Cast `schema` to break deep generic recursion between Zod 3 and zod-to-json-schema during typecheck. */
function toOpenApiSchema(schema) {
    return (0, zod_to_json_schema_1.zodToJsonSchema)(schema, jsonSchemaOpts);
}
/** Fastify / OpenAPI body & response JSON Schemas derived from Zod (single source of truth). */
exports.signUpBodySchema = toOpenApiSchema(AuthDTOs_1.signUpRequestSchema);
exports.signInBodySchema = toOpenApiSchema(AuthDTOs_1.signInRequestSchema);
exports.authResultJsonSchema = toOpenApiSchema(AuthDTOs_1.authResultSchema);
const errorBodyZ = zod_1.z.object({ error: zod_1.z.string() }).strict();
exports.errorBodySchema = toOpenApiSchema(errorBodyZ);
const logoutSuccessZ = zod_1.z.object({ success: zod_1.z.boolean() }).strict();
exports.logoutSuccessSchema = toOpenApiSchema(logoutSuccessZ);
const healthOkZ = zod_1.z.object({ ok: zod_1.z.boolean() }).strict();
exports.healthOkSchema = toOpenApiSchema(healthOkZ);
// Course schemas
const createCourseBodyZ = zod_1.z.object({
    title: zod_1.z.string().min(3, 'Title must be at least 3 characters'),
    description: zod_1.z.string().optional(),
    thumbnailUrl: zod_1.z.string().url().optional(),
}).strict();
const updateCourseBodyZ = zod_1.z.object({
    title: zod_1.z.string().min(3, 'Title must be at least 3 characters').optional(),
    description: zod_1.z.string().optional(),
    thumbnailUrl: zod_1.z.string().url().optional(),
    isPublished: zod_1.z.boolean().optional(),
}).strict();
const courseResponseZ = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    instructorId: zod_1.z.string().uuid(),
    title: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    thumbnailUrl: zod_1.z.string().optional(),
    isPublished: zod_1.z.boolean(),
    createdAt: zod_1.z.string().datetime(),
}).strict();
exports.createCourseBodySchema = toOpenApiSchema(createCourseBodyZ);
exports.updateCourseBodySchema = toOpenApiSchema(updateCourseBodyZ);
exports.courseResponseSchema = toOpenApiSchema(courseResponseZ);
exports.courseListSchema = toOpenApiSchema(zod_1.z.array(courseResponseZ));
