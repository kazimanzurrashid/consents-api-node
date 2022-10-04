import type { Router } from 'express';

import openApiRouter from './open-api-router';

describe('openApiRouter', () => {
  describe('/', () => {
    let router: Router;

    beforeAll(() => (router = openApiRouter()));

    it('uses swagger-ui', () => {
      expect(router.stack.length).toBeGreaterThanOrEqual(2);
    });
  });
});
