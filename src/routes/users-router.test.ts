import type UsersController from '../controllers/users-controller';
import usersRouter from './users-router';

describe('usersRouter', () => {
  describe('POST /', () => {
    let mockedControllerCreate: jest.Mock;
    let match;

    beforeAll(() => {
      mockedControllerCreate = jest.fn(async () => Promise.resolve());
      const router = usersRouter({
        create: mockedControllerCreate
      } as unknown as UsersController);

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

  describe('DELETE /:id', () => {
    let mockedControllerDelete: jest.Mock;
    let match;

    beforeAll(() => {
      mockedControllerDelete = jest.fn(async () => Promise.resolve());
      const router = usersRouter({
        delete: mockedControllerDelete
      } as unknown as UsersController);

      match = router.stack.find(
        (x) => x.route.path === '/:id' && x.route.methods.delete
      );
    });

    it('delegates to controller delete', async () => {
      await match.handle({ method: 'DELETE' }, {}, () => {
        return;
      });

      expect(mockedControllerDelete).toHaveBeenCalled();
    });
  });

  describe('GET /:id', () => {
    let mockedControllerDetail: jest.Mock;
    let match;

    beforeAll(() => {
      mockedControllerDetail = jest.fn(async () => Promise.resolve());
      const router = usersRouter({
        detail: mockedControllerDetail
      } as unknown as UsersController);

      match = router.stack.find(
        (x) => x.route.path === '/:id' && x.route.methods.get
      );
    });

    it('delegates to controller detail', async () => {
      await match.handle({ method: 'GET' }, {}, () => {
        return;
      });

      expect(mockedControllerDetail).toHaveBeenCalled();
    });
  });
});
