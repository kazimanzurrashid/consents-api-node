FROM node:16.15.1-alpine3.16 AS builder
WORKDIR /usr/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run release

FROM node:16.15.1-alpine3.16
USER node
WORKDIR /usr/app
COPY --chown=node:node --from=builder /usr/app/dist /usr/app/build/health-check.js /usr/app/src/schema.sql ./
ENTRYPOINT ["node", "index.js"]
