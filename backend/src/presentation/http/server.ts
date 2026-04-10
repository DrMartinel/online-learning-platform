import fastify from 'fastify';
import cors from '@fastify/cors';
import { registerAuthRoutes } from './routes/auth';
import { registerHealthRoutes } from './routes/health';

export async function buildServer() {
  const app = fastify({ logger: true });

  await app.register(cors, { origin: true });
  await app.register(registerHealthRoutes);
  await app.register(registerAuthRoutes);

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

