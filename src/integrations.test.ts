import 'reflect-metadata';

import { readFile } from 'fs/promises';
import { join, resolve } from 'path';
import type { Server } from 'http';

import Pino from 'pino';
import { container } from 'tsyringe';

import { PostgreSqlContainer } from 'testcontainers';
import type { StartedPostgreSqlContainer } from 'testcontainers/dist/modules/postgresql/postgresql-container';

import { Client, Pool } from 'pg';
import request from 'supertest';
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

describe('integrations', () => {
  jest.setTimeout(1000 * 30);

  let postgresContainer: StartedPostgreSqlContainer;

  beforeAll(async () => {
    postgresContainer = await new PostgreSqlContainer(
      'postgres:14.4-alpine3.16'
    ).start();

    container.register('PGPool', {
      useValue: new Pool({
        host: postgresContainer.getHost(),
        port: postgresContainer.getPort(),
        database: postgresContainer.getDatabase(),
        user: postgresContainer.getUsername(),
        password: postgresContainer.getPassword()
      })
    });

    container.register('PGClientFactory', {
      useValue: () =>
        new Client({
          host: postgresContainer.getHost(),
          port: postgresContainer.getPort(),
          database: postgresContainer.getDatabase(),
          user: postgresContainer.getUsername(),
          password: postgresContainer.getPassword()
        })
    });
    container.register('Logger', { useValue: Pino() });

    const basePath = (() => {
      if (process.env.NODE_ENV !== 'production') {
        return join(resolve(), 'src');
      }
      return resolve();
    })();

    const schema = await readFile(join(basePath, 'schema.sql'), 'utf-8');

    await usePostgreSQL(async (client) => {
      await client.query(schema);
    });
  });

  describe('POST /users', () => {
    describe('complete new user', () => {
      let server: Server;

      let email: string;

      let statusCode: number;
      let result: IUser;

      beforeAll(async () => {
        return new Promise<void>((done) => {
          email = faker.internet.email().toLowerCase();

          const app = createApp();

          server = app.listen(async () => {
            const response = await request(app).post('/users').send({
              email
            });

            statusCode = response.statusCode;
            result = response.body;

            done();
          });
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
        await deleteUser(result.id);
        return new Promise<void>((done) => {
          server.close(() => done());
        });
      });
    });

    describe('already registered user', () => {
      let server: Server;

      let statusCode: number;
      let existingUser: IUser;
      let result: IErrorsResult;

      beforeAll(async () => {
        return new Promise<void>((done) => {
          const email = faker.internet.email().toLowerCase();

          const app = createApp();

          server = app.listen(async () => {
            let response;

            response = await request(app).post('/users').send({
              email
            });

            existingUser = response.body;

            response = await request(app).post('/users').send({
              email
            });

            statusCode = response.statusCode;
            result = response.body;

            done();
          });
        });
      });

      it('responds with http status code 422', () => {
        expect(statusCode).toEqual(422);
      });

      it('returns error', () => {
        expect(result.errors).toHaveLength(1);
      });

      afterAll(async () => {
        await deleteUser(existingUser.id);
        return new Promise<void>((done) => {
          server.close(() => done());
        });
      });
    });
  });

  describe('DELETE /users/:id', () => {
    let server: Server;

    let statusCode: number;

    beforeAll(async () => {
      return new Promise<void>((done) => {
        const app = createApp();

        server = app.listen(async () => {
          let response;

          response = await request(app).post('/users').send({
            email: faker.internet.email().toLowerCase()
          });

          const existingUserId = response.body.id as string;

          response = await request(app).delete(`/users/${existingUserId}`);

          statusCode = response.statusCode;

          done();
        });
      });
    });

    it('responds with http status code 204', () => {
      expect(statusCode).toEqual(204);
    });

    afterAll(async () => {
      return new Promise<void>((done) => {
        server.close(() => done());
      });
    });
  });

  describe('GET /users/:id', () => {
    describe('existent user', () => {
      let server: Server;

      let email: string;

      let statusCode: number;
      let result: IUser;

      beforeAll(async () => {
        return new Promise<void>((done) => {
          email = faker.internet.email().toLowerCase();

          const app = createApp();

          server = app.listen(async () => {
            let response;

            response = await request(app).post('/users').send({
              email
            });

            const existingUserId = response.body.id as string;

            response = await request(app).get(`/users/${existingUserId}`);

            statusCode = response.statusCode;
            result = response.body;

            done();
          });
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
        await deleteUser(result.id);
        return new Promise<void>((done) => {
          server.close(() => done());
        });
      });
    });

    describe('non-existent user', () => {
      let server: Server;

      let statusCode: number;
      let result: IErrorsResult;

      beforeAll((done) => {
        const app = createApp();

        server = app.listen(async () => {
          const id = faker.datatype.uuid();
          const response = await request(app).get(`/users/${id}`);

          statusCode = response.statusCode;
          result = response.body;

          done();
        });
      });

      it('responds with http status code 404', () => {
        expect(statusCode).toEqual(404);
      });

      it('returns error', () => {
        expect(result.errors).toHaveLength(1);
      });

      afterAll(async () => {
        return new Promise<void>((done) => {
          server.close(() => done());
        });
      });
    });
  });

  describe('POST /events', () => {
    describe('known user', () => {
      let server: Server;

      let user: IUser;
      let statusCode: number;

      beforeAll((done) => {
        const app = createApp();

        server = app.listen(async () => {
          let response;

          response = await request(app).post('/users').send({
            email: faker.internet.email().toLowerCase()
          });

          user = response.body;

          response = await request(app)
            .post(`/events`)
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

          done();
        });
      });

      it('responds with http status code 201', () => {
        expect(statusCode).toEqual(201);
      });

      afterAll(async () => {
        await usePostgreSQL(async (client) => {
          await client.query('DELETE FROM "events" WHERE user_id = $1', [
            user.id
          ]);
        });
        await deleteUser(user.id);
        return new Promise<void>((done) => {
          server.close(() => done());
        });
      });
    });

    describe('unknown user', () => {
      let server: Server;

      let statusCode: number;

      beforeAll((done) => {
        const app = createApp();

        server = app.listen(async () => {
          const response = await request(app)
            .post(`/events`)
            .send({
              user: {
                id: faker.datatype.uuid()
              },
              consents: [
                {
                  id: consents.email,
                  enabled: true
                }
              ]
            });

          statusCode = response.statusCode;

          done();
        });
      });

      it('responds with http status code 422', () => {
        expect(statusCode).toEqual(422);
      });

      afterAll(async () => {
        return new Promise<void>((done) => {
          server.close(() => done());
        });
      });
    });
  });

  afterAll(async () => {
    await container.resolve<Pool>('PGPool').end();
    await postgresContainer.stop();
  });
});
