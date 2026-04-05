# Stage 1: Build
FROM node:20-alpine AS build

# Set work directory
WORKDIR /usr/

# Copy all files to the container
COPY . .

# Clear npm cache and install dependencies with retry logic and legacy peer deps
RUN yarn
# Build the project
RUN yarn build

# Stage 2: Production
FROM node:20-alpine AS api-prod

# Install dumb-init
RUN apk add --no-cache dumb-init

# Set NODE_ENV to production
ENV NODE_ENV production

# Set work directory
WORKDIR /usr/

# Copy built files from the build stage
COPY --from=build /usr/dist ./dist
COPY --from=build /usr/static ./static
COPY ./package* ./

# Install production dependencies
RUN yarn install --production

# Command to run the app
CMD ["dumb-init", "node", "dist/server.js"]
