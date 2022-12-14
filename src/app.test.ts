import 'reflect-metadata';
import type { Express } from 'express';

import { container } from 'tsyringe';
import { Client, Pool } from 'pg';
import Pino from 'pino';

import createApp from './app';

describe('app', () => {
  let app: Express;

  beforeAll(() => {
    container.register('PGPool', { useValue: new Pool() });
    container.register('PGClientFactory', { useValue: () => new Client() });
    container.register('Logger', { useValue: Pino() });

    app = createApp();
  });

  it('disables x-powered-by', () => {
    expect(app.get('x-powered-by')).toEqual(false);
  });

  it('disables etag', () => {
    expect(app.get('etag')).toEqual(false);
  });

  it('has logger middleware', () => {
    const mw = app._router.stack.find((x) => x.name === 'loggingMiddleware');
    expect(mw).toBeDefined();
  });

  it('has json middleware', () => {
    const mw = app._router.stack.find((x) => x.name === 'jsonParser');
    expect(mw).toBeDefined();
  });

  it('mounts users router', () => {
    const router = app._router.stack.find(
      (x) => x.name === 'router' && x.regexp.toString().includes('/users')
    );
    expect(router).toBeDefined();
  });

  it('mounts events router', () => {
    const router = app._router.stack.find(
      (x) => x.name === 'router' && x.regexp.toString().includes('/events')
    );
    expect(router).toBeDefined();
  });

  it('mounts health router', () => {
    const router = app._router.stack.find(
      (x) => x.name === 'router' && x.regexp.toString().includes('/health')
    );
    expect(router).toBeDefined();
  });

  it('mounts open-api router', () => {
    const router = app._router.stack.find(
      (x) => x.name === 'router' && x.regexp.toString() === '/^\\/?(?=\\/|$)/i'
    );
    expect(router).toBeDefined();
  });

  it('handles all other stuffs', () => {
    const route = app._router.stack.find(
      (x) => x.name === 'bound dispatch' && x.route.path === '*'
    );

    expect(route).toBeDefined();

    const mockedJson = jest.fn();
    const mockedStatus = jest.fn(() => ({ json: mockedJson }));

    route.handle({ method: 'GET' }, { status: mockedStatus }, () => {
      return;
    });

    expect(mockedStatus).toHaveBeenCalledWith(404);
    expect(mockedJson).toHaveBeenCalled();
  });
});
