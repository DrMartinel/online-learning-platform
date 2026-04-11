"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthOkSchema = exports.logoutSuccessSchema = exports.errorBodySchema = exports.authResultJsonSchema = exports.signInBodySchema = exports.signUpBodySchema = void 0;
const zod_1 = require("zod");
const zod_to_json_schema_1 = require("zod-to-json-schema");
const AuthDTOs_1 = require("../../../application/dtos/AuthDTOs");
const jsonSchemaOpts = {
    target: 'openApi3',
    $refStrategy: 'none',
};
/** Fastify / OpenAPI body & response JSON Schemas derived from Zod (single source of truth). */
exports.signUpBodySchema = (0, zod_to_json_schema_1.zodToJsonSchema)(AuthDTOs_1.signUpRequestSchema, jsonSchemaOpts);
exports.signInBodySchema = (0, zod_to_json_schema_1.zodToJsonSchema)(AuthDTOs_1.signInRequestSchema, jsonSchemaOpts);
exports.authResultJsonSchema = (0, zod_to_json_schema_1.zodToJsonSchema)(AuthDTOs_1.authResultSchema, jsonSchemaOpts);
const errorBodyZ = zod_1.z.object({ error: zod_1.z.string() }).strict();
exports.errorBodySchema = (0, zod_to_json_schema_1.zodToJsonSchema)(errorBodyZ, jsonSchemaOpts);
const logoutSuccessZ = zod_1.z.object({ success: zod_1.z.boolean() }).strict();
exports.logoutSuccessSchema = (0, zod_to_json_schema_1.zodToJsonSchema)(logoutSuccessZ, jsonSchemaOpts);
const healthOkZ = zod_1.z.object({ ok: zod_1.z.boolean() }).strict();
exports.healthOkSchema = (0, zod_to_json_schema_1.zodToJsonSchema)(healthOkZ, jsonSchemaOpts);
