FROM node:20-bookworm-slim AS deps
WORKDIR /app

COPY package.json package-lock.json ./
# Do not run lifecycle scripts (e.g. `prepare` → `tsc`): no tsconfig/src in this layer yet
RUN npm ci --ignore-scripts

FROM node:20-bookworm-slim AS build
WORKDIR /app
ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=8192

COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Host `dist/` is excluded by .dockerignore; remove any stale output before tsc (clean incremental state)
RUN rm -rf dist
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 3001
CMD ["npm", "run", "start"]

