import { readFileSync } from 'fs';
import { join, resolve } from 'path';

import type { Router } from 'express';
import express from 'express';

import type { JsonObject } from 'swagger-ui-express';
import { serve, setup } from 'swagger-ui-express';

export default function openApiRouter(): Router {
  const getDocument = (): JsonObject => {
    const path = join(resolve(), 'open-api.json');
    const content = readFileSync(path, 'utf8');

    return JSON.parse(content) as JsonObject;
  };

  const router = express.Router();

  router.use(serve);
  router.get('/', setup(getDocument()));

  return router;
}
