# Development Stage
FROM node:20-alpine AS debug
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH

# Install dependencies
COPY ["package.json", "yarn.lock", "tsconfig.json", "./"]
RUN rm -rf node_modules && yarn install --immutable

# Copy the source code into the container
COPY . .

# Run Vite development server
CMD ["yarn", "dev"]

# Build Stage (for production)
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies again for production build
COPY ["package.json", "yarn.lock", "tsconfig.json", "./"]
RUN rm -rf node_modules && yarn install --immutable

# Copy the source code and build the project for production
COPY . .
RUN yarn build

# Production environment using NGINX
FROM nginx:stable-alpine AS client-prod
# Vite's output is in the dist directory
COPY --from=build /app/dist /usr/share/nginx/html  
COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf
CMD ["nginx", "-g", "daemon off;"]
