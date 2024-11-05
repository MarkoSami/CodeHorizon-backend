# Use Node.js LTS (Long Term Support) as the base image
FROM node:20-slim AS builder

# Set working directory
WORKDIR /usr/src/app

# Copy only package files first
COPY package*.json ./

# Install dependencies - this layer will be cached if package files don't change
RUN npm ci

# Then copy the rest of the code
COPY . .

# Build TypeScript code
RUN npm run build

# Create production image
FROM node:20-slim AS production

# Set working directory
WORKDIR /usr/src/app

# Set NODE_ENV
ENV NODE_ENV=production

# Copy package files first
COPY package*.json ./

# Install only production dependencies - this layer will be cached
RUN npm ci --only=production

# Copy built files from builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]