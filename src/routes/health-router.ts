import type { Request, Response, Router } from 'express';
import express from 'express';

import type HealthController from '../controllers/health-controller';

export default function healthRouter(controller: HealthController): Router {
  const router = express.Router();

  router.get('/', (req: Request, res: Response) =>
    controller.liveness(req, res)
  );

  router.get('/readiness', async (req: Request, res: Response) =>
    controller.readiness(req, res)
  );

  return router;
}
