"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCourseRoutes = registerCourseRoutes;
const CourseController_1 = require("../../handlers/CourseController");
const errors_1 = require("../errors");
const supabase_1 = require("../supabase");
const schemas_1 = require("../openapi/schemas");
const courseErrorResponses = {
    400: schemas_1.errorBodySchema,
    403: schemas_1.errorBodySchema,
    404: schemas_1.errorBodySchema,
};
function sendError(reply, statusCode, body) {
    reply.statusCode = statusCode;
    return reply.send(body);
}
async function registerCourseRoutes(app) {
    /**
     * Create a new course
     * POST /api/courses
     */
    app.post('/courses', {
        schema: {
            tags: ['Courses'],
            summary: 'Create a new course',
            description: 'Create a new course. User must be an instructor.',
            body: schemas_1.createCourseBodySchema,
            response: {
                201: schemas_1.courseResponseSchema,
                ...courseErrorResponses,
            },
        },
    }, async (request, reply) => {
        try {
            const authHeader = request.headers.authorization;
            const supabase = (0, supabase_1.createSupabaseClientForRequest)(authHeader);
            // Get current user ID from auth token
            const { data: { user }, } = await supabase.auth.getUser();
            if (!user) {
                return sendError(reply, 401, { error: 'Unauthorized' });
            }
            const controller = new CourseController_1.CourseController(supabase);
            const result = await controller.create(user.id, request.body);
            return reply.status(201).send(result);
        }
        catch (e) {
            const { statusCode, body } = (0, errors_1.toHttpError)(e);
            return sendError(reply, statusCode, body);
        }
    });
    /**
     * Get a course by ID
     * GET /api/courses/:id
     */
    app.get('/courses/:id', {
        schema: {
            tags: ['Courses'],
            summary: 'Get a course',
            description: 'Retrieve a course by ID. Only published courses or own unpublished courses are visible.',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Course ID' },
                },
                required: ['id'],
            },
            response: {
                200: schemas_1.courseResponseSchema,
                ...courseErrorResponses,
            },
        },
    }, async (request, reply) => {
        try {
            const supabase = (0, supabase_1.createSupabaseClientForRequest)(request.headers.authorization);
            const controller = new CourseController_1.CourseController(supabase);
            const result = await controller.getById(request.params.id);
            return reply.status(200).send(result);
        }
        catch (e) {
            const { statusCode, body } = (0, errors_1.toHttpError)(e);
            return sendError(reply, statusCode, body);
        }
    });
    /**
     * List courses
     * GET /api/courses
     */
    app.get('/courses', {
        schema: {
            tags: ['Courses'],
            summary: 'List courses',
            description: 'List all courses with optional filters.',
            querystring: {
                type: 'object',
                properties: {
                    published: { type: 'boolean', description: 'Filter by published status' },
                    instructorId: { type: 'string', description: 'Filter by instructor ID' },
                },
            },
            response: {
                200: schemas_1.courseListSchema,
                ...courseErrorResponses,
            },
        },
    }, async (request, reply) => {
        try {
            const supabase = (0, supabase_1.createSupabaseClientForRequest)(request.headers.authorization);
            const controller = new CourseController_1.CourseController(supabase);
            const result = await controller.list(request.query);
            return reply.status(200).send(result);
        }
        catch (e) {
            const { statusCode, body } = (0, errors_1.toHttpError)(e);
            return sendError(reply, statusCode, body);
        }
    });
    /**
     * Update a course
     * PUT /api/courses/:id
     */
    app.put('/courses/:id', {
        schema: {
            tags: ['Courses'],
            summary: 'Update a course',
            description: 'Update a course. Only the course instructor can update.',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Course ID' },
                },
                required: ['id'],
            },
            body: schemas_1.updateCourseBodySchema,
            response: {
                200: schemas_1.courseResponseSchema,
                ...courseErrorResponses,
            },
        },
    }, async (request, reply) => {
        try {
            const supabase = (0, supabase_1.createSupabaseClientForRequest)(request.headers.authorization);
            const controller = new CourseController_1.CourseController(supabase);
            const updateDto = {
                id: request.params.id,
                ...request.body,
            };
            const result = await controller.update(updateDto);
            return reply.status(200).send(result);
        }
        catch (e) {
            const { statusCode, body } = (0, errors_1.toHttpError)(e);
            return sendError(reply, statusCode, body);
        }
    });
    /**
     * Delete a course
     * DELETE /api/courses/:id
     */
    app.delete('/courses/:id', {
        schema: {
            tags: ['Courses'],
            summary: 'Delete a course',
            description: 'Delete a course. Only the course instructor can delete.',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Course ID' },
                },
                required: ['id'],
            },
            response: {
                204: { type: 'null' },
                ...courseErrorResponses,
            },
        },
    }, async (request, reply) => {
        try {
            const supabase = (0, supabase_1.createSupabaseClientForRequest)(request.headers.authorization);
            const controller = new CourseController_1.CourseController(supabase);
            await controller.delete(request.params.id);
            return reply.status(204).send();
        }
        catch (e) {
            const { statusCode, body } = (0, errors_1.toHttpError)(e);
            return sendError(reply, statusCode, body);
        }
    });
}
