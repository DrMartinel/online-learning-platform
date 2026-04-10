import type { FastifyInstance } from 'fastify';
import { AuthController } from '../../handlers/AuthController';
import type { SignInDTO, SignUpDTO } from '../../../application/dtos/AuthDTOs';
import { toHttpError } from '../errors';
import { createSupabaseClientForRequest } from '../supabase';

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post<{ Body: SignUpDTO }>('/auth/signup', async (request, reply) => {
    try {
      const supabase = createSupabaseClientForRequest(request.headers.authorization);
      const controller = new AuthController(supabase);
      const result = await controller.signUp(request.body);
      return reply.status(200).send(result);
    } catch (e) {
      const { statusCode, body } = toHttpError(e);
      return reply.status(statusCode).send(body);
    }
  });

  app.post<{ Body: SignInDTO }>('/auth/login', async (request, reply) => {
    try {
      const supabase = createSupabaseClientForRequest(request.headers.authorization);
      const controller = new AuthController(supabase);
      const result = await controller.signIn(request.body);
      return reply.status(200).send(result);
    } catch (e) {
      const { statusCode, body } = toHttpError(e);
      return reply.status(statusCode).send(body);
    }
  });

  app.post('/auth/logout', async (request, reply) => {
    try {
      const supabase = createSupabaseClientForRequest(request.headers.authorization);
      const controller = new AuthController(supabase);
      await controller.signOut();
      return reply.status(200).send({ success: true });
    } catch (e) {
      const { statusCode, body } = toHttpError(e);
      return reply.status(statusCode).send(body);
    }
  });
}

