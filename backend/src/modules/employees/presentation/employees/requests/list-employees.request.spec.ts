import 'reflect-metadata';
import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { EmployeePosition } from '../../../domain/enums/employee-position.enum';
import { EmployeeStatus } from '../../../domain/enums/employee-status.enum';
import { ListEmployeesRequest } from './list-employees.request';

const DEPARTMENT_ID = '4e770b20-0ab6-494a-9bfd-e475e07c7a17';

const validateRequest = async (payload: Record<string, unknown>) => {
  const instance = plainToInstance(ListEmployeesRequest, payload);
  const errors = await validate(instance, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  return { instance, errors };
};

describe('ListEmployeesRequest', () => {
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

  it('accepts valid search, department, position and status filters', async () => {
    const { instance, errors } = await validateRequest({
      search: '  nguyen  ',
      departmentId: DEPARTMENT_ID,
      position: EmployeePosition.PHARMACIST,
      status: EmployeeStatus.WORKING,
    });

    expect(errors).toHaveLength(0);
    expect(instance.search).toBe('nguyen');
    expect(instance.departmentId).toBe(DEPARTMENT_ID);
    expect(instance.position).toBe(EmployeePosition.PHARMACIST);
    expect(instance.status).toBe(EmployeeStatus.WORKING);
  });

  it.each([
    { search: 'x'.repeat(256) },
    { departmentId: 'not-a-uuid' },
    { position: 'Khác' },
    { status: 'active' },
  ])('rejects invalid filters %p', async (payload) => {
    const { errors } = await validateRequest(payload);

    expect(errors.length).toBeGreaterThan(0);
  });

  it.each([{ page: '0' }, { page: '-1' }, { limit: '0' }, { limit: '101' }])(
    'rejects invalid pagination values %p',
    async (payload) => {
      const { errors } = await validateRequest(payload);

      expect(errors.length).toBeGreaterThan(0);
    },
  );
});
