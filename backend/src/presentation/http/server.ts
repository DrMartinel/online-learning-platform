import fastify from 'fastify';
import cors from '@fastify/cors';
import { registerOpenApi } from './openapi/register';
import { registerAuthRoutes } from './routes/auth';
import { registerCourseRoutes } from './routes/course';
import { registerHealthRoutes } from './routes/health';
import { registerLessonRoutes } from './routes/lessons';
import { registerUserProgressRoutes } from './routes/userProgress';

export async function buildServer() {
  const app = fastify({ logger: true });

  await registerOpenApi(app);
  await app.register(cors, { origin: true });
  await app.register(registerHealthRoutes);
  await app.register(registerAuthRoutes);
  await app.register(registerCourseRoutes);
  await app.register(registerLessonRoutes);

  return app;
}

async function main() {
  const app = await buildServer();
  const port = Number(process.env.PORT || 3001);
  const host = process.env.HOST || '0.0.0.0';

  await app.listen({ port, host });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

