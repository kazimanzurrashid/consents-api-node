import 'reflect-metadata';
import type { Pool } from 'pg';

import PostgreSQL from './postgre-sql';

describe('PostgreSQL', () => {
  describe('query', () => {
    let mockedQuery: jest.Mock;

    beforeAll(async () => {
      mockedQuery = jest.fn(async () => Promise.resolve());

      const postgres = new PostgreSQL({
        query: mockedQuery
      } as unknown as Pool);

      await postgres.query('SELECT "foo-bar"');
    });

    it('delegates to pool query', () => {
      expect(mockedQuery).toHaveBeenCalled();
    });
  });

  describe('unit', () => {
    let mockedPoolConnect: jest.Mock;
    let mockedClientRelease: jest.Mock;

    beforeAll(async () => {
      mockedClientRelease = jest.fn();
      mockedPoolConnect = jest.fn(async () =>
        Promise.resolve({
          query: jest.fn(async () => Promise.resolve()),
          release: mockedClientRelease
        })
      );

      const postgres = new PostgreSQL({
        connect: mockedPoolConnect
      } as unknown as Pool);

      await postgres.unit(async (db) => {
        await db.query('SELECT "baz-qux"');
      });
    });

    it('uses pool to get client', () => {
      expect(mockedPoolConnect).toHaveBeenCalled();
    });

    it('releases client after operation', () => {
      expect(mockedClientRelease).toHaveBeenCalled();
    });
  });
});
