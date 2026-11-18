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
  it('defaults both tri-state filters to all', async () => {
    const { instance, errors } = await validateRequest({});

    expect(errors).toHaveLength(0);
    expect(instance.deleted).toBe('all');
    expect(instance.isSuperAdmin).toBe('all');
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

  it.each([
    ['true', true],
    ['false', false],
    ['all', 'all'],
    [true, true],
  ])('coerces boolean filters %p to %p', async (value, expected) => {
    const { instance, errors } = await validateRequest({
      deleted: value,
      isSuperAdmin: value,
    });

    expect(errors).toHaveLength(0);
    expect(instance.deleted).toBe(expected);
    expect(instance.isSuperAdmin).toBe(expected);
  });

  it('trims the search term', async () => {
    const { instance, errors } = await validateRequest({ search: ' admin ' });

    expect(errors).toHaveLength(0);
    expect(instance.search).toBe('admin');
  });

  it.each([
    { page: '0' },
    { page: '2.5' },
    { limit: '0' },
    { limit: '101' },
    { deleted: 'yes' },
    { isSuperAdmin: '1' },
  ])('rejects invalid values %p', async (payload) => {
    const { errors } = await validateRequest(payload);

    expect(errors.length).toBeGreaterThan(0);
  });
});
