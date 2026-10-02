FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable && addgroup -S scholarpath && adduser -S scholarpath -G scholarpath
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile && pnpm store prune
COPY --from=build /app/server.js ./server.js
COPY --from=build /app/dist ./dist
USER scholarpath
EXPOSE 3001
CMD ["pnpm", "start"]
