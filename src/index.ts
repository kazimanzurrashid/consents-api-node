import 'reflect-metadata';

import { resolve, join } from 'path';
import { readFile } from 'fs/promises';

import { container } from 'tsyringe';
import Pino from 'pino';
import { Client, Pool } from 'pg';

import PostgreSQL from './infrastructure/postgre-sql';
import createApp from './app';

void (async () => {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports,@typescript-eslint/no-var-requires
    require('dotenv').config();
  }

  const basePath = (() => {
    if (process.env.NODE_ENV !== 'production') {
      return join(resolve(), 'src');
    }
    return resolve();
  })();

  const logger = Pino();

  container.register('PGPool', { useValue: new Pool() });
  container.register('PGClientFactory', { useValue: () => new Client() });
  container.register('Logger', { useValue: logger });

  const app = createApp();

  const schema = await readFile(join(basePath, 'schema.sql'), 'utf-8');
  await container.resolve(PostgreSQL).query(schema);

  app.listen(process.env.PORT, () => {
    logger.info('API Started!');
  });
})();
