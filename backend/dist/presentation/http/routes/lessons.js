"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerLessonRoutes = registerLessonRoutes;
const LessonController_1 = require("../../handlers/LessonController");
const errors_1 = require("../errors");
const supabase_1 = require("../supabase");
const schemas_1 = require("../openapi/schemas");
const lessonErrorResponses = {
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
async function registerLessonRoutes(app) {
    app.post('/lessons', {
        schema: {
            tags: ['Lessons'],
            summary: 'Create a lesson',
            description: 'Creates a new lesson for a course.',
            body: schemas_1.createLessonBodySchema,
            response: {
                201: schemas_1.lessonJsonSchema,
                ...lessonErrorResponses,
            },
        },
    }, async (request, reply) => {
        try {
            const supabase = (0, supabase_1.createSupabaseClientForRequest)(request.headers.authorization);
            const controller = new LessonController_1.LessonController(supabase);
            const result = await controller.handleCreate(request.body);
            return reply.status(201).send(result);
        }
        catch (e) {
            const { statusCode, body } = (0, errors_1.toHttpError)(e);
            return sendError(reply, statusCode, body);
        }
    });
    app.get('/courses/:courseId/lessons', {
        schema: {
            tags: ['Lessons'],
            summary: 'Get lessons by course ID',
            description: 'Returns all lessons belonging to a specific course.',
            params: {
                type: 'object',
                properties: {
                    courseId: { type: 'string', format: 'uuid' },
                },
                required: ['courseId'],
            },
            response: {
                200: {
                    type: 'array',
                    items: schemas_1.lessonJsonSchema,
                },
                ...lessonErrorResponses,
            },
        },
    }, async (request, reply) => {
        try {
            const supabase = (0, supabase_1.createSupabaseClientForRequest)(request.headers.authorization);
            const controller = new LessonController_1.LessonController(supabase);
            const result = await controller.handleGetByCourse(request.params.courseId);
            return reply.status(200).send(result);
        }
        catch (e) {
            const { statusCode, body } = (0, errors_1.toHttpError)(e);
            return sendError(reply, statusCode, body);
        }
    });
    app.get('/lessons/:id', {
        schema: {
            tags: ['Lessons'],
            summary: 'Get lesson by ID',
            description: 'Returns a complete lesson object by its ID.',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                },
                required: ['id'],
            },
            response: {
                200: schemas_1.lessonJsonSchema,
                ...lessonErrorResponses,
            },
        },
    }, async (request, reply) => {
        try {
            const supabase = (0, supabase_1.createSupabaseClientForRequest)(request.headers.authorization);
            const controller = new LessonController_1.LessonController(supabase);
            const result = await controller.handleGetById(request.params.id);
            return reply.status(200).send(result);
        }
        catch (e) {
            const { statusCode, body } = (0, errors_1.toHttpError)(e);
            return sendError(reply, statusCode, body);
        }
    });
    app.put('/lessons/:id', {
        schema: {
            tags: ['Lessons'],
            summary: 'Update a lesson',
            description: 'Updates a lesson completely by its ID.',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                },
                required: ['id'],
            },
            body: schemas_1.updateLessonBodySchema,
            response: {
                200: schemas_1.lessonJsonSchema,
                ...lessonErrorResponses,
            },
        },
    }, async (request, reply) => {
        try {
            const supabase = (0, supabase_1.createSupabaseClientForRequest)(request.headers.authorization);
            const controller = new LessonController_1.LessonController(supabase);
            const result = await controller.handleUpdate(request.params.id, request.body);
            return reply.status(200).send(result);
        }
        catch (e) {
            const { statusCode, body } = (0, errors_1.toHttpError)(e);
            return sendError(reply, statusCode, body);
        }
    });
    app.delete('/lessons/:id', {
        schema: {
            tags: ['Lessons'],
            summary: 'Delete a lesson',
            description: 'Deletes a lesson by its ID.',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                },
                required: ['id'],
            },
            response: {
                200: schemas_1.healthOkSchema,
                ...lessonErrorResponses,
            },
        },
    }, async (request, reply) => {
        try {
            const supabase = (0, supabase_1.createSupabaseClientForRequest)(request.headers.authorization);
            const controller = new LessonController_1.LessonController(supabase);
            await controller.handleDelete(request.params.id);
            return reply.status(200).send({ ok: true });
        }
        catch (e) {
            const { statusCode, body } = (0, errors_1.toHttpError)(e);
            return sendError(reply, statusCode, body);
        }
    });
}
