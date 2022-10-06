# syntax=docker/dockerfile:1
FROM node:16.17.1-alpine3.16 AS builder
WORKDIR /usr/app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run release

FROM node:16.17.1-alpine3.16
USER node
WORKDIR /usr/app
COPY --chown=node:node --from=builder /usr/app/dist /usr/app/src/schema.sql ./
CMD ["node", "index.js"]
