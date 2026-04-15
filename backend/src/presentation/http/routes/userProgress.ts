import type { FastifyInstance, FastifyReply } from 'fastify';
import { UserProgressController } from '../../handlers/UserProgressController';
import type { CreateUserProgressDTO, UpdateUserProgressDTO } from '../../../application/dtos/UserProgressDTOs';
import { toHttpError } from '../errors';
import { createSupabaseClientForRequest } from '../supabase';
import {
  createUserProgressBodySchema,
  updateUserProgressBodySchema,
  userProgressResponseSchema,
  courseProgressResponseSchema,
  errorBodySchema,
} from '../openapi/schemas';

const errorResponses = {
  400: errorBodySchema,
  401: errorBodySchema,
  403: errorBodySchema,
  404: errorBodySchema,
  500: errorBodySchema,
} as const;

function sendError(reply: FastifyReply, statusCode: number, body: { error: string }) {
  reply.statusCode = statusCode;
  return reply.send(body);
}

export async function registerUserProgressRoutes(app: FastifyInstance) {
  app.get<{ Params: { courseId: string } }>(
    '/user-progress/course/:courseId',
    {
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
          200: courseProgressResponseSchema,
          ...errorResponses,
        },
      },
    },
    async (request, reply) => {
      try {
        const supabase = createSupabaseClientForRequest(request.headers.authorization);
        const controller = new UserProgressController(supabase);
        return await controller.getCourseProgress(request, reply);
      } catch (e) {
        const { statusCode, body } = toHttpError(e);
        return sendError(reply, statusCode, body);
      }
    }
  );

  app.get<{ Params: { lessonId: string } }>(
    '/user-progress/lesson/:lessonId',
    {
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
          200: userProgressResponseSchema,
          ...errorResponses,
        },
      },
    },
    async (request, reply) => {
      try {
        const supabase = createSupabaseClientForRequest(request.headers.authorization);
        const controller = new UserProgressController(supabase);
        return await controller.getLessonProgress(request, reply);
      } catch (e) {
        const { statusCode, body } = toHttpError(e);
        return sendError(reply, statusCode, body);
      }
    }
  );

  app.post<{ Body: CreateUserProgressDTO }>(
    '/user-progress',
    {
      schema: {
        tags: ['User Progress'],
        summary: 'Create/Upsert progress',
        description: 'Creates a new progress record or updates an existing one for a lesson.',
        body: createUserProgressBodySchema,
        response: {
          201: userProgressResponseSchema,
          ...errorResponses,
        },
      },
    },
    async (request, reply) => {
      try {
        const supabase = createSupabaseClientForRequest(request.headers.authorization);
        const controller = new UserProgressController(supabase);
        return await controller.createProgress(request, reply);
      } catch (e) {
        const { statusCode, body } = toHttpError(e);
        return sendError(reply, statusCode, body);
      }
    }
  );

  app.patch<{ Params: { id: string }; Body: UpdateUserProgressDTO }>(
    '/user-progress/:id',
    {
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
        body: updateUserProgressBodySchema,
        response: {
          200: userProgressResponseSchema,
          ...errorResponses,
        },
      },
    },
    async (request, reply) => {
      try {
        const supabase = createSupabaseClientForRequest(request.headers.authorization);
        const controller = new UserProgressController(supabase);
        return await controller.updateProgress(request, reply);
      } catch (e) {
        const { statusCode, body } = toHttpError(e);
        return sendError(reply, statusCode, body);
      }
    }
  );

  app.delete<{ Params: { id: string } }>(
    '/user-progress/:id',
    {
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
    },
    async (request, reply) => {
      try {
        const supabase = createSupabaseClientForRequest(request.headers.authorization);
        const controller = new UserProgressController(supabase);
        return await controller.deleteProgress(request, reply);
      } catch (e) {
        const { statusCode, body } = toHttpError(e);
        return sendError(reply, statusCode, body);
      }
    }
  );
}
