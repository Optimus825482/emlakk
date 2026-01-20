# Build Stage
FROM node:20-slim AS builder
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package*.json ./
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-retry-maxtimeout 600000 && \
    npm config set fetch-retry-mintimeout 10000 && \
    npm install

# Copy source
COPY . .

# Environment variables for build
ARG DATABASE_URL
ARG DIRECT_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXTAUTH_SECRET

ENV DATABASE_URL=$DATABASE_URL
ENV DIRECT_URL=$DIRECT_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NEXT_TELEMETRY_DISABLED=1

# Build
RUN npm run build

# Production Stage
FROM node:20-slim AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "start"]
