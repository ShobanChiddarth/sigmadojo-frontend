# Build stage
FROM node:24.13.0-bookworm AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# Production stage
FROM nginx:1.30.4

COPY --from=builder /app/dist /usr/share/nginx/html

RUN echo 'window.__ENV__ = { VITE_BACKEND_URL: "${VITE_BACKEND_URL}" };' \
    > /usr/share/nginx/html/env.template.js

RUN printf '#!/bin/sh\n\
envsubst < /usr/share/nginx/html/env.template.js > /usr/share/nginx/html/env.js\n\
exec nginx -g "daemon off;"\n' \
    > /docker-entrypoint.sh \
    && chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
