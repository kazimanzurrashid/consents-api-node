import { inject, injectable } from 'tsyringe';
import { Logger } from 'pino';

import handles from '../../infrastructure/handles';
import Handler from '../../infrastructure/handler';
import UserDeleteRequest from './user-delete-request';
import PostgreSQL from '../../infrastructure/postgre-sql';

@injectable()
@handles(UserDeleteRequest)
export default class UserDeleteHandler extends Handler<
  UserDeleteRequest,
  void
> {
  constructor(
    private readonly _db: PostgreSQL,
    @inject('Logger') private readonly _logger: Logger
  ) {
    super();
  }

  async handle(request: UserDeleteRequest): Promise<void> {
    await this._db.unit(async (db) => {
      await db.query('BEGIN');

      try {
        await db.query('DELETE FROM "events" WHERE user_id = $1', [request.id]);

        await db.query('DELETE FROM "users" WHERE id = $1', [request.id]);
      } catch (e) {
        this._logger.error(
          { error: e, userId: request.id },
          // eslint-disable-next-line i18n-text/no-en
          'User delete error'
        );
        await db.query('ROLLBACK');
        return;
      }

      await db.query('COMMIT');
    });
  }
}
