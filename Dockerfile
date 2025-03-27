# Build stage
FROM oven/bun:latest AS build

WORKDIR /app

# Copy package.json and lockfile
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Production stage
FROM oven/bun:latest AS production

WORKDIR /app

# Copy package.json and lockfile
COPY package.json bun.lockb ./

# Install only production dependencies
RUN bun install --frozen-lockfile --production

# Copy built application from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules

# Copy necessary files for runtime
COPY .env.example ./

# Expose the application port
EXPOSE 3000

# Set NODE_ENV to production
ENV NODE_ENV=production

# Start the application
CMD ["bun", "run", "start:prod"]