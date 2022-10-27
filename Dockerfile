# syntax=docker/dockerfile:1
FROM node:18.12.0-alpine3.16 AS builder
WORKDIR /usr/app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build && npm run pack && npm run copy-other-required-files

FROM node:18.12.0-alpine3.16
USER node
WORKDIR /usr/app
COPY --chown=node:node --from=builder /usr/app/dist /usr/app/src/schema.sql ./
ENV NODE_ENV="production"
EXPOSE 3001
CMD ["node", "index.js"]
