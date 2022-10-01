import 'reflect-metadata';

import type { Logger } from 'pino';
import type { Client } from 'pg';

import HealthReadinessRequest from './health-readiness-request';
import HealthReadinessHandler from './health-readiness-handler';

describe('HealthReadinessHandler', () => {
  describe('handle', () => {
    let readinessRequest: HealthReadinessRequest;

    beforeAll(() => {
      readinessRequest = new HealthReadinessRequest({
        ts: new Date()
      });
    });

    describe('success', () => {
      let res: boolean;

      beforeAll(async () => {
        const postgreSQL = {
          connect: jest.fn(async () => Promise.resolve()),
          end: jest.fn(async () => Promise.resolve())
        };

        const handler = new HealthReadinessHandler(
          () => postgreSQL as unknown as Client,
          jest.fn() as unknown as Logger
        );

        res = await handler.handle(readinessRequest);
      });

      it('returns true', () => {
        expect(res).toEqual(true);
      });
    });

    describe('fail', () => {
      let loggerError: jest.Mock;
      let res: boolean;

      beforeAll(async () => {
        const postgreSQL = {
          connect: jest.fn(async () => Promise.resolve()),
          end: jest.fn(async () =>
            Promise.reject(new Error('Intentional error'))
          )
        };

        loggerError = jest.fn();

        const logger = {
          error: loggerError
        };

        const handler = new HealthReadinessHandler(
          () => postgreSQL as unknown as Client,
          logger as unknown as Logger
        );

        res = await handler.handle(readinessRequest);
      });

      it('returns false', () => {
        expect(res).toEqual(false);
      });

      it('logs error', () => {
        expect(loggerError).toHaveBeenCalled();
      });
    });
  });
});
