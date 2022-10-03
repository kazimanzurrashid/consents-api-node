import 'reflect-metadata';

import { resolve, join } from 'path';
import { readFile } from 'fs/promises';

import { container } from 'tsyringe';
import type { Logger } from 'pino';

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

  const app = createApp();

  const schema = await readFile(join(basePath, 'schema.sql'), 'utf-8');
  await container.resolve(PostgreSQL).query(schema);

  app.listen(process.env.PORT, () => {
    container.resolve<Logger>('Logger').info('API Started!');
  });
})();
