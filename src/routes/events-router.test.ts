import type EventsController from '../controllers/events-controller';
import eventsRouter from './events-router';

describe('eventsRouter', () => {
  describe('POST /', () => {
    let mockedControllerCreate: jest.Mock;
    let match;

    beforeAll(() => {
      mockedControllerCreate = jest.fn(async () => Promise.resolve());
      const router = eventsRouter({
        create: mockedControllerCreate
      } as unknown as EventsController);

      match = router.stack.find(
        (x) => x.route.path === '/' && x.route.methods.post
      );
    });

    it('decorates with validation middleware', () => {
      expect(match.route.stack).toHaveLength(2);
    });

    it('delegates to controller create', async () => {
      await match.handle({ method: 'POST' }, {}, () => {
        return;
      });

      expect(mockedControllerCreate).toHaveBeenCalled();
    });
  });
});
