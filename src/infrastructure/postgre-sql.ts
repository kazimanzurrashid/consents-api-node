import type { QueryResult } from 'pg';
import { Pool } from 'pg';
import { inject, injectable } from 'tsyringe';

export interface IPostgreSQLBase {
  query: (sql: string, values?: unknown[]) => Promise<QueryResult>;
}

@injectable()
export default class PostgreSQL implements PostgreSQL {
  constructor(@inject('PGPool') private readonly _pg: Pool) {}

  async query(sql: string, values?: unknown[]): Promise<QueryResult> {
    return this._pg.query(sql, values);
  }

  async unit<T>(action: (client: IPostgreSQLBase) => Promise<T>): Promise<T> {
    const client = await this._pg.connect();

    try {
      return await action(client);
    } finally {
      client.release();
    }
  }
}
