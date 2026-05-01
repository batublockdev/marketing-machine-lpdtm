FROM node:22-alpine

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

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "start"]