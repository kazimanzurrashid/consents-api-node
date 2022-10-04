import type { Request, Response, Router } from 'express';
import express from 'express';

import type HealthController from '../controllers/health-controller';

export default function healthRouter(controller: HealthController): Router {
  const router = express.Router();

  router.get('/', async (req: Request, res: Response) =>
    controller.status(req, res)
  );

  return router;
}
