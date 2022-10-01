import { injectable } from 'tsyringe';

import type { Request, Response } from 'express';

import Mediator from '../infrastructure/mediator';
import HealthReadinessRequest from '../features/health-readiness/health-readiness-request';

@injectable()
export default class HealthController {
  constructor(private readonly _mediator: Mediator) {}

  liveness(_: Request, res: Response): void {
    res.status(200).json({
      healthy: true,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  }

  async readiness(_: Request, res: Response): Promise<void> {
    const request = new HealthReadinessRequest({
      ts: new Date()
    });

    const result = await this._mediator.send<boolean, HealthReadinessRequest>(
      request
    );

    if (!result) {
      res.status(503).json({
        healthy: false,
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.status(200).json({
      healthy: true,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  }
}
