import 'reflect-metadata';

import type { Request, Response } from 'express';
import HealthReadinessRequest from '../features/health-readiness/health-readiness-request';

import type Mediator from '../infrastructure/mediator';
import HealthController from './health-controller';

describe('HealthController', () => {
  describe('status', () => {
    describe('detail', () => {
      describe('success', () => {
        let mockedResponseStatus: jest.Mock;
        let readinessRequest: HealthReadinessRequest;

        beforeAll(async () => {
          const mockedMediatorSend: jest.Mock = jest.fn(async () =>
            Promise.resolve(true)
          );

          const mediator = {
            send: mockedMediatorSend
          };

          const controller = new HealthController(
            mediator as unknown as Mediator
          );

          const req = {
            query: {
              detail: 'true'
            }
          };

          mockedResponseStatus = jest.fn(() => ({ json: jest.fn() }));

          const res = {
            status: mockedResponseStatus
          };

          await controller.status(
            req as unknown as Request,
            res as unknown as Response
          );
          readinessRequest = mockedMediatorSend.mock.calls[0][0];
        });

        it('uses mediator', () => {
          expect(readinessRequest).toBeInstanceOf(HealthReadinessRequest);
        });

        it('returns http status code ok', () => {
          expect(mockedResponseStatus).toHaveBeenCalledWith(200);
        });
      });

      describe('fail', () => {
        let mockedResponseStatus: jest.Mock;
        let readinessRequest: HealthReadinessRequest;

        beforeAll(async () => {
          const mockedMediatorSend: jest.Mock = jest.fn(async () =>
            Promise.resolve(false)
          );

          const mediator = {
            send: mockedMediatorSend
          };

          const controller = new HealthController(
            mediator as unknown as Mediator
          );

          const req = {
            query: {
              detail: 'true'
            }
          };

          mockedResponseStatus = jest.fn(() => ({ json: jest.fn() }));

          const res = {
            status: mockedResponseStatus
          };

          await controller.status(
            req as unknown as Request,
            res as unknown as Response
          );
          readinessRequest = mockedMediatorSend.mock.calls[0][0];
        });

        it('uses mediator', () => {
          expect(readinessRequest).toBeInstanceOf(HealthReadinessRequest);
        });

        it('returns http status code service unavailable', () => {
          expect(mockedResponseStatus).toHaveBeenCalledWith(503);
        });
      });
    });

    describe('simple', () => {
      describe('without query string', () => {
        let mockedResponseStatus: jest.Mock;

        beforeAll(async () => {
          const controller = new HealthController({} as unknown as Mediator);

          const req = {
            query: {}
          };

          mockedResponseStatus = jest.fn(() => ({ json: jest.fn() }));

          const res = {
            status: mockedResponseStatus
          };

          await controller.status(
            req as unknown as Request,
            res as unknown as Response
          );
        });

        it('returns http status code ok', () => {
          expect(mockedResponseStatus).toHaveBeenCalledWith(200);
        });
      });

      describe('with query string', () => {
        let mockedResponseStatus: jest.Mock;

        beforeAll(async () => {
          const controller = new HealthController({} as unknown as Mediator);

          const req = {
            query: {
              detail: 'false'
            }
          };

          mockedResponseStatus = jest.fn(() => ({ json: jest.fn() }));

          const res = {
            status: mockedResponseStatus
          };

          await controller.status(
            req as unknown as Request,
            res as unknown as Response
          );
        });

        it('returns http status code ok', () => {
          expect(mockedResponseStatus).toHaveBeenCalledWith(200);
        });
      });
    });
  });
});
