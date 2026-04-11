"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAuthRoutes = registerAuthRoutes;
const AuthController_1 = require("../../handlers/AuthController");
const errors_1 = require("../errors");
const supabase_1 = require("../supabase");
const schemas_1 = require("../openapi/schemas");
const authErrorResponses = {
    400: schemas_1.errorBodySchema,
    401: schemas_1.errorBodySchema,
    403: schemas_1.errorBodySchema,
    404: schemas_1.errorBodySchema,
    409: schemas_1.errorBodySchema,
};
function sendError(reply, statusCode, body) {
    reply.statusCode = statusCode;
    return reply.send(body);
}
async function registerAuthRoutes(app) {
    app.post('/auth/signup', {
        schema: {
            tags: ['Auth'],
            summary: 'Sign up',
            description: 'Create a new account. Returns session tokens on success.',
            body: schemas_1.signUpBodySchema,
            response: {
                200: schemas_1.authResultJsonSchema,
                ...authErrorResponses,
            },
        },
    }, async (request, reply) => {
        try {
            const supabase = (0, supabase_1.createSupabaseClientForRequest)(request.headers.authorization);
            const controller = new AuthController_1.AuthController(supabase);
            const result = await controller.signUp(request.body);
            return reply.status(200).send(result);
        }
        catch (e) {
            const { statusCode, body } = (0, errors_1.toHttpError)(e);
            return sendError(reply, statusCode, body);
        }
    });
    app.post('/auth/login', {
        schema: {
            tags: ['Auth'],
            summary: 'Sign in',
            description: 'Authenticate with email and password.',
            body: schemas_1.signInBodySchema,
            response: {
                200: schemas_1.authResultJsonSchema,
                ...authErrorResponses,
            },
        },
    }, async (request, reply) => {
        try {
            const supabase = (0, supabase_1.createSupabaseClientForRequest)(request.headers.authorization);
            const controller = new AuthController_1.AuthController(supabase);
            const result = await controller.signIn(request.body);
            return reply.status(200).send(result);
        }
        catch (e) {
            const { statusCode, body } = (0, errors_1.toHttpError)(e);
            return sendError(reply, statusCode, body);
        }
    });
    app.post('/auth/logout', {
        schema: {
            tags: ['Auth'],
            summary: 'Sign out',
            description: 'End the current Supabase session. Send `Authorization: Bearer <access_token>` to sign out that session (recommended).',
            response: {
                200: schemas_1.logoutSuccessSchema,
                ...authErrorResponses,
            },
        },
    }, async (request, reply) => {
        try {
            const supabase = (0, supabase_1.createSupabaseClientForRequest)(request.headers.authorization);
            const controller = new AuthController_1.AuthController(supabase);
            await controller.signOut();
            return reply.status(200).send({ success: true });
        }
        catch (e) {
            const { statusCode, body } = (0, errors_1.toHttpError)(e);
            return sendError(reply, statusCode, body);
        }
    });
}
