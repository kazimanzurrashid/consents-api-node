import type HealthController from '../controllers/health-controller';
import healthRouter from './health-router';

describe('healthRouter', () => {
  describe('GET /', () => {
    let mockedControllerStatus: jest.Mock;
    let match;

    beforeAll(() => {
      mockedControllerStatus = jest.fn(async () => Promise.resolve());
      const router = healthRouter({
        status: mockedControllerStatus
      } as unknown as HealthController);

      match = router.stack.find(
        (x) => x.route.path === '/' && x.route.methods.get
      );
    });

    it('delegates to controller status', async () => {
      await match.handle({ method: 'GET' }, {}, () => {
        return;
      });

      expect(mockedControllerStatus).toHaveBeenCalled();
    });
  });
});
