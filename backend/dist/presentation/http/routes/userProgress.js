"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUserProgressRoutes = registerUserProgressRoutes;
const UserProgressController_1 = require("../../handlers/UserProgressController");
const errors_1 = require("../errors");
const supabase_1 = require("../supabase");
const schemas_1 = require("../openapi/schemas");
const errorResponses = {
    400: schemas_1.errorBodySchema,
    401: schemas_1.errorBodySchema,
    403: schemas_1.errorBodySchema,
    404: schemas_1.errorBodySchema,
    500: schemas_1.errorBodySchema,
};
function sendError(reply, statusCode, body) {
    reply.statusCode = statusCode;
    return reply.send(body);
}
async function registerUserProgressRoutes(app) {
    app.get('/user-progress/course/:courseId', {
        schema: {
            tags: ['User Progress'],
            summary: 'Get course progress',
            description: 'Returns all progress records and overall completion stats for a specific course.',
            params: {
                type: 'object',
                properties: {
                    courseId: { type: 'string', format: 'uuid' }
                }
            },
            response: {
                200: schemas_1.courseProgressResponseSchema,
                ...errorResponses,
            },
        },
    }, async (request, reply) => {
        try {
            const supabase = (0, supabase_1.createSupabaseClientForRequest)(request.headers.authorization);
            const controller = new UserProgressController_1.UserProgressController(supabase);
            return await controller.getCourseProgress(request, reply);
        }
        catch (e) {
            const { statusCode, body } = (0, errors_1.toHttpError)(e);
            return sendError(reply, statusCode, body);
        }
    });
    app.get('/user-progress/lesson/:lessonId', {
        schema: {
            tags: ['User Progress'],
            summary: 'Get lesson progress',
            description: 'Returns the progress record for a specific lesson.',
            params: {
                type: 'object',
                properties: {
                    lessonId: { type: 'string', format: 'uuid' }
                }
            },
            response: {
                200: schemas_1.userProgressResponseSchema,
                ...errorResponses,
            },
        },
    }, async (request, reply) => {
        try {
            const supabase = (0, supabase_1.createSupabaseClientForRequest)(request.headers.authorization);
            const controller = new UserProgressController_1.UserProgressController(supabase);
            return await controller.getLessonProgress(request, reply);
        }
        catch (e) {
            const { statusCode, body } = (0, errors_1.toHttpError)(e);
            return sendError(reply, statusCode, body);
        }
    });
    app.post('/user-progress', {
        schema: {
            tags: ['User Progress'],
            summary: 'Create/Upsert progress',
            description: 'Creates a new progress record or updates an existing one for a lesson.',
            body: schemas_1.createUserProgressBodySchema,
            response: {
                201: schemas_1.userProgressResponseSchema,
                ...errorResponses,
            },
        },
    }, async (request, reply) => {
        try {
            const supabase = (0, supabase_1.createSupabaseClientForRequest)(request.headers.authorization);
            const controller = new UserProgressController_1.UserProgressController(supabase);
            return await controller.createProgress(request, reply);
        }
        catch (e) {
            const { statusCode, body } = (0, errors_1.toHttpError)(e);
            return sendError(reply, statusCode, body);
        }
    });
    app.patch('/user-progress/:id', {
        schema: {
            tags: ['User Progress'],
            summary: 'Update progress',
            description: 'Updates an existing progress record.',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' }
                }
            },
            body: schemas_1.updateUserProgressBodySchema,
            response: {
                200: schemas_1.userProgressResponseSchema,
                ...errorResponses,
            },
        },
    }, async (request, reply) => {
        try {
            const supabase = (0, supabase_1.createSupabaseClientForRequest)(request.headers.authorization);
            const controller = new UserProgressController_1.UserProgressController(supabase);
            return await controller.updateProgress(request, reply);
        }
        catch (e) {
            const { statusCode, body } = (0, errors_1.toHttpError)(e);
            return sendError(reply, statusCode, body);
        }
    });
    app.delete('/user-progress/:id', {
        schema: {
            tags: ['User Progress'],
            summary: 'Delete progress',
            description: 'Removes a progress record (resets progress for that lesson).',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' }
                }
            },
            response: {
                204: { type: 'null' },
                ...errorResponses,
            },
        },
    }, async (request, reply) => {
        try {
            const supabase = (0, supabase_1.createSupabaseClientForRequest)(request.headers.authorization);
            const controller = new UserProgressController_1.UserProgressController(supabase);
            return await controller.deleteProgress(request, reply);
        }
        catch (e) {
            const { statusCode, body } = (0, errors_1.toHttpError)(e);
            return sendError(reply, statusCode, body);
        }
    });
}
