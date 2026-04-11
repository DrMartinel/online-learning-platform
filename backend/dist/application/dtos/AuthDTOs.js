"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authResultSchema = exports.signInRequestSchema = exports.signUpRequestSchema = void 0;
const zod_1 = require("zod");
/** Sign-up payload (HTTP / use-case input) */
exports.signUpRequestSchema = zod_1.z
    .object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1).optional(),
    fullName: zod_1.z.string().min(1),
})
    .strict();
/** Sign-in payload */
exports.signInRequestSchema = zod_1.z
    .object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1).optional(),
})
    .strict();
/** Successful auth session returned to clients */
exports.authResultSchema = zod_1.z.object({
    accessToken: zod_1.z.string(),
    refreshToken: zod_1.z.string(),
    userId: zod_1.z.string(),
    role: zod_1.z.string(),
    expiresAt: zod_1.z.number().optional(),
});
