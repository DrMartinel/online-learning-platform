import type { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

export async function registerOpenApi(app: FastifyInstance) {
  await app.register(swagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'Online Learning Platform API',
        description:
          'HTTP API for authentication and platform operations. Uses Supabase under the hood; send `Authorization: Bearer <access_token>` when acting as an authenticated user.',
        version: '1.0.0',
      },
      servers: [{ url: '/', description: 'This server' }],
      tags: [
        { name: 'Health', description: 'Liveness' },
        { name: 'Auth', description: 'Sign up, sign in, sign out' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Supabase access token (JWT)',
          },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
    staticCSP: true,
  });
}
