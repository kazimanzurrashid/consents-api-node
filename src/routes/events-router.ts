import type { Request, Response, Router } from 'express';
import express from 'express';

import type EventsController from '../controllers/events-controller';
import validate from '../middlewares/validate';
import { eventCreateRequestSchema } from '../features/event-create/event-create-request';

export default function eventsRouter(controller: EventsController): Router {
  const router = express.Router();

  router.post(
    '/',
    validate(eventCreateRequestSchema),
    async (req: Request, res: Response) => controller.create(req, res)
  );

  return router;
}
