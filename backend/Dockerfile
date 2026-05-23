FROM node:20-bookworm-slim AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:20-bookworm-slim AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=8192

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./package.json
COPY tsconfig.json ./tsconfig.json
COPY src ./src
COPY nest-cli.json ./nest-cli.json

RUN rm -rf dist
RUN pnpm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 3001
CMD ["pnpm", "run", "start:prod"]
