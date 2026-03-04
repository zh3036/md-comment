# syntax = docker/dockerfile:1

ARG NODE_VERSION=22.14.0

# --- Build stage ---
FROM node:${NODE_VERSION}-slim AS build
WORKDIR /app

RUN npm install -g pnpm@9

# Install ALL dependencies (including devDependencies for build)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# --- Production stage ---
FROM node:${NODE_VERSION}-slim AS runner
WORKDIR /app
ENV NODE_ENV="production"
ENV HOSTNAME="0.0.0.0"
ENV PORT="3000"

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
