# Build Stage
FROM node:22-bookworm AS builder
WORKDIR /app

# Install system dependencies (including libvips for Sharp)
RUN apt-get update && apt-get install -y \
    openssl \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package.json yarn.lock* package-lock.json* ./
RUN corepack enable && \
    yarn config set registry https://registry.npmmirror.com/ && \
    yarn config set network-timeout 600000 && \
    yarn install

# Copy source
COPY . .

# Environment variables for build
ARG DATABASE_URL
ARG DIRECT_URL
ARG AUTH_SECRET
ARG NEXT_PUBLIC_APP_URL
ARG DEEPSEEK_API_KEY

ENV DATABASE_URL=$DATABASE_URL
ENV DIRECT_URL=$DIRECT_URL
ENV AUTH_SECRET=$AUTH_SECRET
ENV AUTH_TRUST_HOST=true
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV DEEPSEEK_API_KEY=$DEEPSEEK_API_KEY
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=4096

# Build
RUN yarn build

# Production Stage
FROM node:22-bookworm-slim AS runner
WORKDIR /app

# Install runtime dependencies (including libvips for Sharp)
RUN apt-get update && apt-get install -y \
    openssl \
    libvips \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Create uploads directory for file uploads
RUN mkdir -p /app/public/uploads && chmod 777 /app/public/uploads

EXPOSE 3000

CMD ["yarn", "start"]
