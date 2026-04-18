import type { FastifyInstance, FastifyReply } from 'fastify';
import { CourseController } from '../../handlers/CourseController';
import type { CreateCourseDTO, UpdateCourseDTO, ListCoursesFilterDTO } from '../../../application/dtos/CourseDTOs';
import { toHttpError } from '../errors';
import { createSupabaseClientForRequest } from '../supabase';
import {
  courseResponseSchema,
  courseListSchema,
  errorBodySchema,
  createCourseBodySchema,
  updateCourseBodySchema,
} from '../openapi/schemas';

const courseErrorResponses = {
  400: errorBodySchema,
  403: errorBodySchema,
  404: errorBodySchema,
} as const;

function sendError(reply: FastifyReply, statusCode: number, body: { error: string }) {
  reply.statusCode = statusCode;
  return reply.send(body);
}

export async function registerCourseRoutes(app: FastifyInstance) {
  /**
   * Create a new course
   * POST /api/courses
   */
  app.post<{ Body: CreateCourseDTO }>(
    '/courses',
    {
      schema: {
        tags: ['Courses'],
        summary: 'Create a new course',
        description: 'Create a new course. User must be an instructor.',
        body: createCourseBodySchema,
        response: {
          201: courseResponseSchema,
          ...courseErrorResponses,
        },
      },
    },
    async (request, reply) => {
      try {
        const authHeader = request.headers.authorization;
        const supabase = createSupabaseClientForRequest(authHeader);

        // Get current user ID from auth token
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          return sendError(reply, 401, { error: 'Unauthorized' });
        }

        const controller = new CourseController(supabase);
        const result = await controller.create(user.id, request.body);
        return reply.status(201).send(result);
      } catch (e) {
        const { statusCode, body } = toHttpError(e);
        return sendError(reply, statusCode, body);
      }
    }
  );

  /**
   * Get a course by ID
   * GET /api/courses/:id
   */
  app.get<{ Params: { id: string } }>(
    '/courses/:id',
    {
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
          200: courseResponseSchema,
          ...courseErrorResponses,
        },
      },
    },
    async (request, reply) => {
      try {
        const supabase = createSupabaseClientForRequest(request.headers.authorization);
        const controller = new CourseController(supabase);
        const result = await controller.getById(request.params.id);
        return reply.status(200).send(result);
      } catch (e) {
        const { statusCode, body } = toHttpError(e);
        return sendError(reply, statusCode, body);
      }
    }
  );

  /**
   * List courses
   * GET /api/courses
   */
  app.get<{ Querystring: ListCoursesFilterDTO }>(
    '/courses',
    {
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
          200: courseListSchema,
          ...courseErrorResponses,
        },
      },
    },
    async (request, reply) => {
      try {
        const supabase = createSupabaseClientForRequest(request.headers.authorization);
        const controller = new CourseController(supabase);
        const result = await controller.list(request.query);
        return reply.status(200).send(result);
      } catch (e) {
        const { statusCode, body } = toHttpError(e);
        return sendError(reply, statusCode, body);
      }
    }
  );

  /**
   * Update a course
   * PUT /api/courses/:id
   */
  app.put<{ Params: { id: string }; Body: Partial<CreateCourseDTO> }>(
    '/courses/:id',
    {
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
        body: updateCourseBodySchema,
        response: {
          200: courseResponseSchema,
          ...courseErrorResponses,
        },
      },
    },
    async (request, reply) => {
      try {
        const supabase = createSupabaseClientForRequest(request.headers.authorization);
        const controller = new CourseController(supabase);
        const updateDto: UpdateCourseDTO = {
          id: request.params.id,
          ...request.body,
        };
        const result = await controller.update(updateDto);
        return reply.status(200).send(result);
      } catch (e) {
        const { statusCode, body } = toHttpError(e);
        return sendError(reply, statusCode, body);
      }
    }
  );

  /**
   * Delete a course
   * DELETE /api/courses/:id
   */
  app.delete<{ Params: { id: string } }>(
    '/courses/:id',
    {
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
    },
    async (request, reply) => {
      try {
        const supabase = createSupabaseClientForRequest(request.headers.authorization);
        const controller = new CourseController(supabase);
        await controller.delete(request.params.id);
        return reply.status(204).send();
      } catch (e) {
        const { statusCode, body } = toHttpError(e);
        return sendError(reply, statusCode, body);
      }
    }
  );
}
