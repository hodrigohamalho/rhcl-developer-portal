# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.d/99-portal-config.sh
USER 0
RUN chmod +x /docker-entrypoint.d/99-portal-config.sh && \
    chmod -R g+rw /usr/share/nginx/html
USER 1001
EXPOSE 8080
