import type { FastifyInstance, FastifyReply } from 'fastify';
import { AuthController } from '../../handlers/AuthController';
import type { SignInDTO, SignUpDTO } from '../../../application/dtos/AuthDTOs';
import { toHttpError } from '../errors';
import { createSupabaseClientForRequest } from '../supabase';
import {
  authResultJsonSchema,
  errorBodySchema,
  logoutSuccessSchema,
  signInBodySchema,
  signUpBodySchema,
} from '../openapi/schemas';

const authErrorResponses = {
  400: errorBodySchema,
  401: errorBodySchema,
  403: errorBodySchema,
  404: errorBodySchema,
  409: errorBodySchema,
} as const;

function sendError(reply: FastifyReply, statusCode: number, body: { error: string }) {
  reply.statusCode = statusCode;
  return reply.send(body);
}

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post<{ Body: SignUpDTO }>(
    '/auth/signup',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Sign up',
        description: 'Create a new account. Returns session tokens on success.',
        body: signUpBodySchema,
        response: {
          200: authResultJsonSchema,
          ...authErrorResponses,
        },
      },
    },
    async (request, reply) => {
      try {
        const supabase = createSupabaseClientForRequest(request.headers.authorization);
        const controller = new AuthController(supabase);
        const result = await controller.signUp(request.body);
        return reply.status(200).send(result);
      } catch (e) {
        const { statusCode, body } = toHttpError(e);
        return sendError(reply, statusCode, body);
      }
    }
  );

  app.post<{ Body: SignInDTO }>(
    '/auth/login',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Sign in',
        description: 'Authenticate with email and password.',
        body: signInBodySchema,
        response: {
          200: authResultJsonSchema,
          ...authErrorResponses,
        },
      },
    },
    async (request, reply) => {
      try {
        const supabase = createSupabaseClientForRequest(request.headers.authorization);
        const controller = new AuthController(supabase);
        const result = await controller.signIn(request.body);
        return reply.status(200).send(result);
      } catch (e) {
        const { statusCode, body } = toHttpError(e);
        return sendError(reply, statusCode, body);
      }
    }
  );

  app.post(
    '/auth/logout',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Sign out',
        description:
          'End the current Supabase session. Send `Authorization: Bearer <access_token>` to sign out that session (recommended).',
        response: {
          200: logoutSuccessSchema,
          ...authErrorResponses,
        },
      },
    },
    async (request, reply) => {
      try {
        const supabase = createSupabaseClientForRequest(request.headers.authorization);
        const controller = new AuthController(supabase);
        await controller.signOut();
        return reply.status(200).send({ success: true });
      } catch (e) {
        const { statusCode, body } = toHttpError(e);
        return sendError(reply, statusCode, body);
      }
    }
  );
}
