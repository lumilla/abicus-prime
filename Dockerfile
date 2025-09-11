FROM node:20.15.0 AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci


FROM node:20.15.0 AS build
ARG GIT_HASH=""
ENV GIT_HASH=${GIT_HASH}
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build


FROM nginx:1.26.1

# Create a non-root user
RUN groupadd -r nginx-user && useradd -r -g nginx-user nginx-user

WORKDIR /usr/share/nginx/html/
COPY --from=build /app/dist /usr/share/nginx/html/

# Change ownership of nginx html directory to non-root user
RUN chown -R nginx-user:nginx-user /usr/share/nginx/html/

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD ["curl", "-f", "http://localhost:80/"]

EXPOSE 80

# Switch to non-root user
USER nginx-user