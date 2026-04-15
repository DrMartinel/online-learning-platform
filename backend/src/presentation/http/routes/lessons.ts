import type { FastifyInstance, FastifyReply } from 'fastify';
import { LessonController } from '../../handlers/LessonController';
import type { CreateLessonRequestDTO, UpdateLessonRequestDTO } from '../../../application/dtos/LessonDTOs';
import { toHttpError } from '../errors';
import { createSupabaseClientForRequest } from '../supabase';
import {
  lessonJsonSchema,
  createLessonBodySchema,
  updateLessonBodySchema,
  errorBodySchema,
  healthOkSchema
} from '../openapi/schemas';

const lessonErrorResponses = {
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

export async function registerLessonRoutes(app: FastifyInstance) {
  app.post<{ Body: CreateLessonRequestDTO }>(
    '/lessons',
    {
      schema: {
        tags: ['Lessons'],
        summary: 'Create a lesson',
        description: 'Creates a new lesson for a course.',
        body: createLessonBodySchema,
        response: {
          201: lessonJsonSchema,
          ...lessonErrorResponses,
        },
      },
    },
    async (request, reply) => {
      try {
        const supabase = createSupabaseClientForRequest(request.headers.authorization);
        const controller = new LessonController(supabase);
        const result = await controller.handleCreate(request.body);
        return reply.status(201).send(result);
      } catch (e) {
        const { statusCode, body } = toHttpError(e);
        return sendError(reply, statusCode, body);
      }
    }
  );

  app.get<{ Params: { courseId: string } }>(
    '/courses/:courseId/lessons',
    {
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
            items: lessonJsonSchema,
          },
          ...lessonErrorResponses,
        },
      },
    },
    async (request, reply) => {
      try {
        const supabase = createSupabaseClientForRequest(request.headers.authorization);
        const controller = new LessonController(supabase);
        const result = await controller.handleGetByCourse(request.params.courseId);
        return reply.status(200).send(result);
      } catch (e) {
        const { statusCode, body } = toHttpError(e);
        return sendError(reply, statusCode, body);
      }
    }
  );

  app.get<{ Params: { id: string } }>(
    '/lessons/:id',
    {
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
          200: lessonJsonSchema,
          ...lessonErrorResponses,
        },
      },
    },
    async (request, reply) => {
      try {
        const supabase = createSupabaseClientForRequest(request.headers.authorization);
        const controller = new LessonController(supabase);
        const result = await controller.handleGetById(request.params.id);
        return reply.status(200).send(result);
      } catch (e) {
        const { statusCode, body } = toHttpError(e);
        return sendError(reply, statusCode, body);
      }
    }
  );

  app.put<{ Params: { id: string }, Body: UpdateLessonRequestDTO }>(
    '/lessons/:id',
    {
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
        body: updateLessonBodySchema,
        response: {
          200: lessonJsonSchema,
          ...lessonErrorResponses,
        },
      },
    },
    async (request, reply) => {
      try {
        const supabase = createSupabaseClientForRequest(request.headers.authorization);
        const controller = new LessonController(supabase);
        const result = await controller.handleUpdate(request.params.id, request.body);
        return reply.status(200).send(result);
      } catch (e) {
        const { statusCode, body } = toHttpError(e);
        return sendError(reply, statusCode, body);
      }
    }
  );

  app.delete<{ Params: { id: string } }>(
    '/lessons/:id',
    {
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
          200: healthOkSchema,
          ...lessonErrorResponses,
        },
      },
    },
    async (request, reply) => {
      try {
        const supabase = createSupabaseClientForRequest(request.headers.authorization);
        const controller = new LessonController(supabase);
        await controller.handleDelete(request.params.id);
        return reply.status(200).send({ ok: true });
      } catch (e) {
        const { statusCode, body } = toHttpError(e);
        return sendError(reply, statusCode, body);
      }
    }
  );
}
