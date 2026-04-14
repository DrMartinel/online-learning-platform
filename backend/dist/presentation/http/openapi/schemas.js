"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLessonBodySchema = exports.createLessonBodySchema = exports.lessonJsonSchema = exports.healthOkSchema = exports.logoutSuccessSchema = exports.errorBodySchema = exports.authResultJsonSchema = exports.signInBodySchema = exports.signUpBodySchema = void 0;
const zod_1 = require("zod");
const zod_to_json_schema_1 = require("zod-to-json-schema");
const AuthDTOs_1 = require("../../../application/dtos/AuthDTOs");
const LessonDTOs_1 = require("../../../application/dtos/LessonDTOs");
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
exports.lessonJsonSchema = toOpenApiSchema(LessonDTOs_1.lessonSchema);
exports.createLessonBodySchema = toOpenApiSchema(LessonDTOs_1.createLessonRequestSchema);
exports.updateLessonBodySchema = toOpenApiSchema(LessonDTOs_1.updateLessonRequestSchema);
