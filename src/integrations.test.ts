import 'reflect-metadata';

import { readFile } from 'fs/promises';

import { join as fsJoin, resolve as fsResolve } from 'path';
import type { Express } from 'express';
import Pino from 'pino';
import { container } from 'tsyringe';
import { Client, Pool } from 'pg';

import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { PostgreSqlContainer } from '@testcontainers/postgresql';

import request from 'supertest';
import type { Response } from 'supertest';
import { faker } from '@faker-js/faker';

import createApp from './app';
import type { IUser } from './features/user';
import consents from './consents';

interface IErrorsResult {
  errors?: string[];
}

async function usePostgreSQL(
  func: (client: Client) => Promise<void>
): Promise<void> {
  const client = container.resolve<() => Client>('PGClientFactory')();
  await client.connect();
  await func(client);
  await client.end();
}

async function deleteUser(id: string): Promise<void> {
  await usePostgreSQL(async (client) => {
    await client.query('DELETE FROM "users" WHERE id = $1', [id]);
  });
}

async function runApp(action: (a: Express) => Promise<void>): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    try {
      const app = createApp();

      const server = app.listen(async () => {
        try {
          await action(app);

          server.close((err) => {
            if (err) {
              reject(err);
              return;
            }

            resolve();
          });
        } catch (e) {
          reject(e);
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

describe('integrations', () => {
  jest.setTimeout(1000 * 300);

  let postgresContainer: StartedPostgreSqlContainer;

  beforeAll(async () => {
    postgresContainer = await new PostgreSqlContainer(
      'postgres:14.5-alpine3.16'
    ).start();

    const config = {
      host: postgresContainer.getHost(),
      port: postgresContainer.getPort(),
      database: postgresContainer.getDatabase(),
      user: postgresContainer.getUsername(),
      password: postgresContainer.getPassword()
    };

    container.register('PGPool', {
      useValue: new Pool(config)
    });
    container.register('PGClientFactory', {
      useValue: () => new Client(config)
    });
    container.register('Logger', { useValue: Pino() });

    const basePath = (() => {
      if (process.env.NODE_ENV !== 'production') {
        return fsJoin(fsResolve(), 'src');
      }
      return fsResolve();
    })();

    const schema = await readFile(fsJoin(basePath, 'schema.sql'), 'utf-8');

    await usePostgreSQL(async (client) => {
      await client.query(schema);
    });
  });

  describe('POST /users', () => {
    describe('new user', () => {
      const email = faker.internet.email().toLowerCase();

      let statusCode: number;
      let result: IUser;

      beforeAll(async () => {
        await runApp(async (app) => {
          const response = await request(app).post('/users').send({
            email
          });

          statusCode = response.statusCode;
          result = response.body;
        });
      });

      it('responds with http status code 201', () => {
        expect(statusCode).toEqual(201);
      });

      it('returns newly created user', () => {
        expect(result.id).toBeDefined();
        expect(result.email).toEqual(email);
        expect(result.consents).toHaveLength(0);
      });

      afterAll(async () => {
        if (result) {
          await deleteUser(result.id);
        }
      });
    });

    describe('already registered user', () => {
      let existingUserId: string;

      let statusCode: number;
      let result: IErrorsResult;

      beforeAll(async () => {
        await runApp(async (app) => {
          const email = faker.internet.email().toLowerCase();

          let response: Response;

          response = await request(app)
            .post('/users')
            .send({
              email
            })
            .expect(201);

          existingUserId = response.body.id;

          response = await request(app).post('/users').send({
            email
          });

          statusCode = response.statusCode;
          result = response.body;
        });
      });

      it('responds with http status code 422', () => {
        expect(statusCode).toEqual(422);
      });

      it('returns error', () => {
        expect(result.errors).toHaveLength(1);
      });

      afterAll(async () => {
        if (existingUserId) {
          await deleteUser(existingUserId);
        }
      });
    });
  });

  describe('DELETE /users/:id', () => {
    let statusCode: number;

    beforeAll(async () => {
      await runApp(async (app) => {
        let response: Response;

        response = await request(app).post('/users').send({
          email: faker.internet.email().toLowerCase()
        });

        const existingUserId = response.body.id as string;

        response = await request(app).delete(`/users/${existingUserId}`);

        statusCode = response.statusCode;
      });
    });

    it('responds with http status code 204', () => {
      expect(statusCode).toEqual(204);
    });
  });

  describe('GET /users/:id', () => {
    describe('existent user', () => {
      const email = faker.internet.email().toLowerCase();

      let statusCode: number;
      let result: IUser;

      beforeAll(async () => {
        await runApp(async (app) => {
          let response: Response;

          response = await request(app).post('/users').send({
            email
          });

          const existingUserId = response.body.id as string;

          response = await request(app).get(`/users/${existingUserId}`);

          statusCode = response.statusCode;
          result = response.body;
        });
      });

      it('responds with http status code 200', () => {
        expect(statusCode).toEqual(200);
      });

      it('returns matching user', () => {
        expect(result.id).toBeDefined();
        expect(result.email).toEqual(email);
        expect(result.consents).toHaveLength(0);
      });

      afterAll(async () => {
        if (result) {
          await deleteUser(result.id);
        }
      });
    });

    describe('non-existent user', () => {
      let statusCode: number;
      let result: IErrorsResult;

      beforeAll(async () => {
        await runApp(async (app) => {
          const response = await request(app).get(
            `/users/${faker.string.uuid()}`
          );

          statusCode = response.statusCode;
          result = response.body;
        });
      });

      it('responds with http status code 404', () => {
        expect(statusCode).toEqual(404);
      });

      it('returns error', () => {
        expect(result.errors).toHaveLength(1);
      });
    });
  });

  describe('POST /events', () => {
    describe('known user', () => {
      let user: IUser;
      let statusCode: number;

      beforeAll(async () => {
        await runApp(async (app) => {
          let response: Response;

          response = await request(app)
            .post('/users')
            .send({
              email: faker.internet.email().toLowerCase()
            })
            .expect(201);

          user = response.body;

          response = await request(app)
            .post('/events')
            .send({
              user: {
                id: user.id
              },
              consents: [
                {
                  id: consents.email,
                  enabled: true
                },
                {
                  id: consents.sms,
                  enabled: false
                }
              ]
            });

          statusCode = response.statusCode;
        });
      });

      it('responds with http status code 201', () => {
        expect(statusCode).toEqual(201);
      });

      afterAll(async () => {
        if (!user) {
          return;
        }

        await usePostgreSQL(async (client) => {
          await client.query('DELETE FROM "events" WHERE user_id = $1', [
            user.id
          ]);
        });

        await deleteUser(user.id);
      });
    });

    describe('unknown user', () => {
      let statusCode: number;

      beforeAll(async () => {
        await runApp(async (app) => {
          const response = await request(app)
            .post('/events')
            .send({
              user: {
                id: faker.string.uuid()
              },
              consents: [
                {
                  id: consents.email,
                  enabled: true
                }
              ]
            });

          statusCode = response.statusCode;
        });
      });

      it('responds with http status code 422', () => {
        expect(statusCode).toEqual(422);
      });
    });
  });

  describe('GET /health', () => {
    describe('simple', () => {
      let statusCode: number;

      beforeAll(async () => {
        await runApp(async (app) => {
          const response = await request(app).get('/health');

          statusCode = response.statusCode;
        });
      });

      it('responds with http status code 200', () => {
        expect(statusCode).toEqual(200);
      });
    });

    describe('detail', () => {
      let statusCode: number;

      beforeAll(async () => {
        await runApp(async (app) => {
          const response = await request(app).get('/health');

          statusCode = response.statusCode;
        });
      });

      it('responds with http status code 200', () => {
        expect(statusCode).toEqual(200);
      });
    });
  });

  describe('GET /', () => {
    let statusCode: number;

    beforeAll(async () => {
      await runApp(async (app) => {
        const response = await request(app).get('/');

        statusCode = response.statusCode;
      });
    });

    it('responds with http status code 200', () => {
      expect(statusCode).toEqual(200);
    });
  });

  describe('ALL OTHER STUFFS', () => {
    let statusCode: number;
    let result: IErrorsResult;

    beforeAll(async () => {
      await runApp(async (app) => {
        const response = await request(app).get('/foo-bar');

        statusCode = response.statusCode;
        result = response.body;
      });
    });

    it('responds with http status code 404', () => {
      expect(statusCode).toEqual(404);
    });

    it('returns error', () => {
      expect(result.errors).toHaveLength(1);
    });
  });

  afterAll(async () => {
    await container.resolve<Pool>('PGPool').end();
    await postgresContainer?.stop();
  });
});
