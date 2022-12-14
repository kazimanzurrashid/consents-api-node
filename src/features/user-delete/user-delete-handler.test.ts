import 'reflect-metadata';
import type { Logger } from 'pino';

import UserDeleteRequest from './user-delete-request';
import Id from '../../infrastructure/id';
import type PostgreSQL from '../../infrastructure/postgre-sql';
import UserDeleteHandler from './user-delete-handler';

describe('UserDeleteHandler', () => {
  describe('handle', () => {
    let deleteRequest: UserDeleteRequest;

    beforeAll(() => {
      deleteRequest = new UserDeleteRequest({
        id: Id.generate()
      });
    });

    describe('success', () => {
      let mockedPostgreQuery: jest.Mock;

      beforeAll(async () => {
        mockedPostgreQuery = jest.fn(async () => Promise.resolve());

        // noinspection JSUnusedGlobalSymbols
        const postgreSQL = {
          unit: (func) => func({ query: mockedPostgreQuery })
        };

        const handler = new UserDeleteHandler(
          postgreSQL as unknown as PostgreSQL,
          jest.fn() as unknown as Logger
        );

        await handler.handle(deleteRequest);
      });

      it('begins transaction', () => {
        expect(mockedPostgreQuery).toHaveBeenCalledWith('BEGIN');
      });

      it('commits transaction', () => {
        expect(mockedPostgreQuery).toHaveBeenCalledWith('COMMIT');
      });
    });

    describe('fail', () => {
      let mockedPostgreQuery: jest.Mock;
      let loggerError: jest.Mock;

      beforeAll(async () => {
        mockedPostgreQuery = jest.fn();

        mockedPostgreQuery
          .mockReturnValueOnce(Promise.resolve())
          .mockReturnValueOnce(Promise.resolve())
          .mockReturnValueOnce(Promise.reject(new Error('ERROR')));

        // noinspection JSUnusedGlobalSymbols
        const postgreSQL = {
          unit: (func) => func({ query: mockedPostgreQuery })
        };

        loggerError = jest.fn();

        const logger = {
          error: loggerError
        };

        const handler = new UserDeleteHandler(
          postgreSQL as unknown as PostgreSQL,
          logger as unknown as Logger
        );

        await handler.handle(deleteRequest);
      });

      it('begins transaction', () => {
        expect(mockedPostgreQuery).toHaveBeenCalledWith('BEGIN');
      });

      it('rollbacks transaction', () => {
        expect(mockedPostgreQuery).toHaveBeenCalledWith('ROLLBACK');
      });

      it('logs error', () => {
        expect(loggerError).toHaveBeenCalled();
      });
    });
  });
});
