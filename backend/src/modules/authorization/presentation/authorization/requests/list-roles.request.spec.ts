import 'reflect-metadata';
import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListRolesRequest } from './list-roles.request';

const validateRequest = async (payload: Record<string, unknown>) => {
  const instance = plainToInstance(ListRolesRequest, payload);
  const errors = await validate(instance, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  return { instance, errors };
};

describe('ListRolesRequest', () => {
  it('accepts an empty query', async () => {
    const { errors } = await validateRequest({});

    expect(errors).toHaveLength(0);
  });

  it('coerces page and limit from strings to integers', async () => {
    const { instance, errors } = await validateRequest({
      page: '2',
      limit: '50',
    });

    expect(errors).toHaveLength(0);
    expect(instance.page).toBe(2);
    expect(instance.limit).toBe(50);
  });

  it.each([{ page: '0' }, { page: '2.5' }, { limit: '0' }, { limit: '101' }])(
    'rejects invalid pagination values %p',
    async (payload) => {
      const { errors } = await validateRequest(payload);

      expect(errors.length).toBeGreaterThan(0);
    },
  );
});
