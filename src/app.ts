import type { Express } from 'express';
import express from 'express';
import Pino from 'pino';
import { container } from 'tsyringe';
import { Client, Pool } from 'pg';

import userRouter from './routes/users-router';
import UsersController from './controllers/users-controller';
import eventsRouter from './routes/events-router';
import EventsController from './controllers/events-controller';
import healthRouter from './routes/health-router';
import HealthController from './controllers/health-controller';
import openApiRouter from './routes/open-api-router';

export default function createApp(): Express {
  const logger = Pino();

  container.register('PGPool', { useValue: new Pool() });
  container.register('PGClientFactory', { useValue: () => new Client() });
  container.register('Logger', { useValue: logger });

  return express()
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
}
