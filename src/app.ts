import type { Express } from 'express';
import express from 'express';
import type { Logger } from 'pino';
import { container } from 'tsyringe';

import userRouter from './routes/users-router';
import UsersController from './controllers/users-controller';
import eventsRouter from './routes/events-router';
import EventsController from './controllers/events-controller';
import healthRouter from './routes/health-router';
import HealthController from './controllers/health-controller';
import openApiRouter from './routes/open-api-router';

export default function createApp(): Express {
  return express()
    .disable('x-powered-by')
    .disable('etag')
    .use(
      // eslint-disable-next-line @typescript-eslint/no-require-imports,@typescript-eslint/no-var-requires
      require('express-pino-logger')({
        logger: container.resolve<Logger>('Logger')
      })
    )
    .use(express.json())
    .use('/users', userRouter(container.resolve(UsersController)))
    .use('/events', eventsRouter(container.resolve(EventsController)))
    .use('/health', healthRouter(container.resolve(HealthController)))
    .use('/', openApiRouter());
}
