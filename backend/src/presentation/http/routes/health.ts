import type { FastifyInstance } from 'fastify';
import { healthOkSchema } from '../openapi/schemas';

export async function registerHealthRoutes(app: FastifyInstance) {
  app.get(
    '/health',
    {
      schema: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Returns 200 when the API process is running.',
        response: {
          200: healthOkSchema,
        },
      },
    },
    async (_request, reply) => {
      return reply.status(200).send({ ok: true });
    }
  );
}
