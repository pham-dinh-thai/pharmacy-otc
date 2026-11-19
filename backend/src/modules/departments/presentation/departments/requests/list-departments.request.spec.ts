import 'reflect-metadata';
import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListDepartmentsRequest } from './list-departments.request';

const validateRequest = async (payload: Record<string, unknown>) => {
  const instance = plainToInstance(ListDepartmentsRequest, payload);
  const errors = await validate(instance, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  return { instance, errors };
};

describe('ListDepartmentsRequest', () => {
  it('defaults deleted to all and accepts an empty query', async () => {
    const { instance, errors } = await validateRequest({});

    expect(errors).toHaveLength(0);
    expect(instance.deleted).toBe('all');
  });

  it('coerces page and limit from strings to integers', async () => {
    const { instance, errors } = await validateRequest({
      page: '3',
      limit: '10',
    });

    expect(errors).toHaveLength(0);
    expect(instance.page).toBe(3);
    expect(instance.limit).toBe(10);
  });

  it.each([
    ['true', true],
    ['false', false],
    ['all', 'all'],
    [true, true],
  ])('coerces deleted=%p to %p', async (value, expected) => {
    const { instance, errors } = await validateRequest({ deleted: value });

    expect(errors).toHaveLength(0);
    expect(instance.deleted).toBe(expected);
  });

  it('trims the search term and ignores blank values', async () => {
    const { instance, errors } = await validateRequest({ search: '  kho  ' });
    const blank = await validateRequest({ search: '   ' });

    expect(errors).toHaveLength(0);
    expect(instance.search).toBe('kho');
    expect(blank.instance.search).toBeNull();
    expect(blank.errors).toHaveLength(0);
  });

  it.each([
    { page: '0' },
    { page: '1.5' },
    { limit: '0' },
    { limit: '101' },
    { deleted: 'yes' },
  ])('rejects invalid values %p', async (payload) => {
    const { errors } = await validateRequest(payload);

    expect(errors.length).toBeGreaterThan(0);
  });
});
