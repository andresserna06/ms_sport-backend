import { HttpStatus, ParseIntPipe } from '@nestjs/common';
import { SportsService } from '../services/sports.service';
import { SportsController } from './sports.controller';

describe('SportsController', () => {
  let service: jest.Mocked<
    Pick<
      SportsService,
      | 'create'
      | 'findAll'
      | 'findOne'
      | 'findSubSports'
      | 'update'
      | 'deactivate'
      | 'activate'
      | 'remove'
    >
  >;
  let controller: SportsController;

  beforeEach(() => {
    service = {
      create: jest.fn().mockResolvedValue('created'),
      findAll: jest.fn().mockResolvedValue('list'),
      findOne: jest.fn().mockResolvedValue('one'),
      findSubSports: jest.fn().mockResolvedValue('subs'),
      update: jest.fn().mockResolvedValue('updated'),
      deactivate: jest.fn().mockResolvedValue('deactivated'),
      activate: jest.fn().mockResolvedValue('activated'),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    controller = new SportsController(service as unknown as SportsService);
  });

  it('delegates every route to a single service method', async () => {
    const dto = { name: 'Fútbol' };
    const filters = { name: 'fut' };

    await expect(controller.create(dto)).resolves.toBe('created');
    await expect(controller.findAll(filters)).resolves.toBe('list');
    await expect(controller.findOne(1)).resolves.toBe('one');
    await expect(controller.findSubSports(1, { all: true })).resolves.toBe('subs');
    await expect(controller.update(1, dto)).resolves.toBe('updated');
    await expect(controller.deactivate(1)).resolves.toBe('deactivated');
    await expect(controller.activate(1)).resolves.toBe('activated');
    await expect(controller.remove(1)).resolves.toBeUndefined();

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(service.findAll).toHaveBeenCalledWith(filters);
    expect(service.findSubSports).toHaveBeenCalledWith(1, { all: true });
    expect(service.update).toHaveBeenCalledWith(1, dto);
    expect(service.remove).toHaveBeenCalledWith(1);
  });

  it('answers 204 No Content on DELETE', () => {
    const httpCode = Reflect.getMetadata(
      '__httpCode__',
      SportsController.prototype.remove,
    );

    expect(httpCode).toBe(HttpStatus.NO_CONTENT);
  });

  it.each([
    'findOne',
    'findSubSports',
    'update',
    'deactivate',
    'activate',
    'remove',
  ] as const)('validates the :id of %s with the integer id pipe', (method) => {
    const args = Reflect.getMetadata(
      '__routeArguments__',
      SportsController,
      method,
    ) as Record<string, { pipes: unknown[] }>;

    // @IdParam is a custom decorator: the global ValidationPipe does not
    // convert it, so the id pipe sees the raw text.
    const idArg = Object.values(args).find((arg) => arg.pipes.length > 0);

    expect(idArg?.pipes).toHaveLength(1);
    expect(idArg?.pipes[0]).toBeInstanceOf(ParseIntPipe);
  });

  it('exposes the routes of the API map', () => {
    const route = (name: keyof SportsController) => ({
      path: Reflect.getMetadata('path', SportsController.prototype[name]),
      method: Reflect.getMetadata('method', SportsController.prototype[name]),
    });

    expect(Reflect.getMetadata('path', SportsController)).toBe('sports');
    // RequestMethod: GET=0, POST=1, PUT=2, DELETE=3, PATCH=4
    expect(route('create')).toEqual({ path: '/', method: 1 });
    expect(route('findAll')).toEqual({ path: '/', method: 0 });
    expect(route('findOne')).toEqual({ path: ':id', method: 0 });
    expect(route('findSubSports')).toEqual({ path: ':id/subsports', method: 0 });
    expect(route('update')).toEqual({ path: ':id', method: 2 });
    expect(route('deactivate')).toEqual({ path: ':id/deactivate', method: 4 });
    expect(route('activate')).toEqual({ path: ':id/activate', method: 4 });
    expect(route('remove')).toEqual({ path: ':id', method: 3 });
  });
});
