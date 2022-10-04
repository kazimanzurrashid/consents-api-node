import type EventsController from '../controllers/health-controller';
import eventsRouter from './health-router';

describe('healthRouter', () => {
  describe('/', () => {
    let mockedControllerStatus: jest.Mock;
    let match;

    beforeAll(() => {
      mockedControllerStatus = jest.fn(async () => Promise.resolve());
      const router = eventsRouter({
        status: mockedControllerStatus
      } as unknown as EventsController);

      match = router.stack.find(
        (x) => x.route.path === '/' && x.route.methods.get
      );
    });

    it('handles HTTP GET', () => {
      expect(match).toBeDefined();
    });

    it('delegates to controller status', async () => {
      await match.handle({ method: 'GET' }, {}, () => {
        return;
      });

      expect(mockedControllerStatus).toHaveBeenCalled();
    });
  });
});
