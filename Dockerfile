FROM node:22-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build Next.js app
RUN npm run build

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

ENV NODE_ENV=production

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
# Copy static assets into standalone directory
COPY --from=builder /app/.next/static ./.next/static
# Copy public directory
COPY --from=builder /app/public ./public
# Copy Prisma schema and node_modules for prisma db push
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

EXPOSE 3000

CMD ["node", "server.js"]
