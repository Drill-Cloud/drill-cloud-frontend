FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG VITE_CLOUD_API_URL=http://localhost:3100
ARG VITE_DEFAULT_EDGE=edge5
ENV VITE_CLOUD_API_URL=$VITE_CLOUD_API_URL
ENV VITE_DEFAULT_EDGE=$VITE_DEFAULT_EDGE
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
