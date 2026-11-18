import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListSuppliersRequest } from './list-suppliers.request';

const validateRequest = async (payload: Record<string, unknown>) => {
  const instance = plainToInstance(ListSuppliersRequest, payload);
  const errors = await validate(instance, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  return { instance, errors };
};

describe('ListSuppliersRequest', () => {
  it('defaults deleted to false', async () => {
    const { instance, errors } = await validateRequest({});

    expect(errors).toHaveLength(0);
    expect(instance.deleted).toBe(false);
  });

  it.each([
    ['true', true],
    ['false', false],
    [true, true],
    [false, false],
  ])('coerces deleted=%p to %p', async (value, expected) => {
    const { instance, errors } = await validateRequest({ deleted: value });

    expect(errors).toHaveLength(0);
    expect(instance.deleted).toBe(expected);
  });

  it('rejects a non-boolean deleted value', async () => {
    const { errors } = await validateRequest({ deleted: 'maybe' });

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('deleted');
  });

  it('trims the search and converts a blank search to null', async () => {
    const trimmed = await validateRequest({ search: '  Công ty ABC  ' });
    const blank = await validateRequest({ search: '   ' });

    expect(trimmed.errors).toHaveLength(0);
    expect(trimmed.instance.search).toBe('Công ty ABC');
    expect(blank.errors).toHaveLength(0);
    expect(blank.instance.search).toBeNull();
  });

  it('rejects a search longer than 255 characters', async () => {
    const { errors } = await validateRequest({ search: 'A'.repeat(256) });

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('search');
  });

  it('rejects the removed status filter', async () => {
    const { errors } = await validateRequest({ status: 'active' });

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('status');
  });
});
