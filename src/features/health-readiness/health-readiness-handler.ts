import { inject, injectable } from 'tsyringe';
import type { Client } from 'pg';
import { Logger } from 'pino';

import handles from '../../infrastructure/handles';
import Handler from '../../infrastructure/handler';
import HealthReadinessRequest from './health-readiness-request';

@injectable()
@handles(HealthReadinessRequest)
export default class HealthReadinessHandler extends Handler<
  HealthReadinessRequest,
  boolean
> {
  constructor(
    @inject('PGClientFactory') private readonly _pgFactory: () => Client,
    @inject('Logger') private readonly _logger: Logger
  ) {
    super();
  }

  async handle(request: HealthReadinessRequest): Promise<boolean> {
    const pg = this._pgFactory();
    try {
      await pg.connect();
      await pg.end();

      return true;
    } catch (e) {
      this._logger.error(
        { error: e, timestamp: request.ts },
        // eslint-disable-next-line i18n-text/no-en
        'Failed to connect to database'
      );
      return false;
    }
  }
}
