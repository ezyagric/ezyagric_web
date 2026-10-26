# EzyAgric website: build the static export with Node, then serve the
# files with nginx. Only the built out/ folder reaches the final image.
#
#   docker build -t ezyagric-web \
#     --build-arg NEXT_PUBLIC_SITE_ENV=production \
#     --build-arg NEXT_PUBLIC_SITE_URL=https://ezyagric.com \
#     --build-arg NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX .
#   docker run --rm -p 8080:80 ezyagric-web     # http://localhost:8080
#
# The build needs internet access: npm ci, and next/font downloads
# Nunito Sans from Google Fonts once at build time.

# ---- 1. Build -------------------------------------------------------------
FROM node:24.22-alpine AS build
WORKDIR /app

# Dependencies first, so this layer is reused until package*.json change.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# NEXT_PUBLIC_* values are baked into the HTML and JS at build time, so
# staging and production are separate images built with different args.
# Defaults to preview so a build without build-args can never pass for
# production (preview shows the banner and is never indexed).
ARG NEXT_PUBLIC_SITE_ENV=preview
ARG NEXT_PUBLIC_SITE_URL=https://ezyagric.com
ARG NEXT_PUBLIC_GA_ID=
ENV NEXT_PUBLIC_SITE_ENV=$NEXT_PUBLIC_SITE_ENV \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---- 2. Serve -------------------------------------------------------------
FROM nginx:1.30-alpine

RUN rm -rf /usr/share/nginx/html/*
# A server block: the image's own /etc/nginx/nginx.conf includes conf.d/*.conf.
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/out /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
