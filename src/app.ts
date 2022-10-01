import 'reflect-metadata';

import { readFile } from 'fs/promises';
import { join, resolve } from 'path';

import Pino from 'pino';
import express from 'express';
import { Client, Pool } from 'pg';
import { container } from 'tsyringe';

import PostgreSQL from './infrastructure/postgre-sql';
import userRouter from './routes/users-router';
import UsersController from './controllers/users-controller';
import eventsRouter from './routes/events-router';
import EventsController from './controllers/events-controller';
import healthRouter from './routes/health-router';
import HealthController from './controllers/health-controller';
import openApiRouter from './routes/open-api-router';

const logger = Pino();

(() => {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports,@typescript-eslint/no-var-requires
    require('dotenv').config();
  }

  container.register('PGPool', { useValue: new Pool() });
  container.register('PGClient', { useValue: new Client() });
  container.register('Logger', { useValue: logger });
})();

const app = express()
  .disable('x-powered-by')
  .disable('etag')
  .use(
    // eslint-disable-next-line @typescript-eslint/no-require-imports,@typescript-eslint/no-var-requires
    require('express-pino-logger')({
      logger
    })
  )
  .use(express.json())
  .use('/users', userRouter(container.resolve(UsersController)))
  .use('/events', eventsRouter(container.resolve(EventsController)))
  .use('/health', healthRouter(container.resolve(HealthController)))
  .use('/', openApiRouter());

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  const basePath = (() => {
    if (process.env.NODE_ENV !== 'production') {
      return join(resolve(), 'src');
    }

    return resolve();
  })();

  const schema = await readFile(join(basePath, 'schema.sql'), 'utf-8');
  await container.resolve(PostgreSQL).query(schema);

  app.listen(process.env.PORT, () => {
    logger.info('API Started!');
  });
})();
