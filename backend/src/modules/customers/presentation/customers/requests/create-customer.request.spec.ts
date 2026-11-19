import 'reflect-metadata';
import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateCustomerRequest } from './create-customer.request';
import { ListCustomersRequest } from './list-customers.request';
import { CustomerGender } from '../../../domain/enums/customer-gender.enum';

const validateRequest = async <T extends object>(
  type: new () => T,
  payload: Record<string, unknown>,
) => {
  const instance = plainToInstance(type, payload);
  const errors = await validate(instance, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  return { instance, errors };
};

const validPayload = {
  firstName: '  Nguyễn  ',
  lastName: 'Văn A',
  email: 'khach@example.invalid',
  password: 'MatKhau@123',
  gender: CustomerGender.FEMALE,
  dateOfBirth: '1998-04-12',
  phones: [{ phone: '0901234567', isPrimary: true }],
  addresses: [{ address: '12 Nguyễn Huệ', isDefault: true }],
};

describe('CreateCustomerRequest', () => {
  it('accepts a full profile and trims names and contacts', async () => {
    const { instance, errors } = await validateRequest(
      CreateCustomerRequest,
      validPayload,
    );

    expect(errors).toHaveLength(0);
    expect(instance).toMatchObject({
      firstName: 'Nguyễn',
      phones: [{ phone: '0901234567', isPrimary: true }],
      addresses: [{ address: '12 Nguyễn Huệ', isDefault: true }],
    });
  });

  it.each([
    {
      field: 'phones',
      extra: { phones: [], addresses: [{ address: '12 Nguyễn Huệ' }] },
    },
    {
      field: 'addresses',
      extra: { phones: [{ phone: '0901234567' }], addresses: [] },
    },
  ])('requires at least one $field', async ({ field, extra }) => {
    const { errors } = await validateRequest(CreateCustomerRequest, {
      ...validPayload,
      ...extra,
    });

    expect(errors.map((error) => error.property)).toContain(field);
  });

  it('rejects an invalid gender or date format', async () => {
    const { errors } = await validateRequest(CreateCustomerRequest, {
      ...validPayload,
      gender: 'unknown',
      dateOfBirth: '12/04/1998',
    });

    expect(errors.map((error) => error.property).sort()).toEqual([
      'dateOfBirth',
      'gender',
    ]);
  });

  it('rejects a password shorter than 8 characters', async () => {
    const { errors } = await validateRequest(CreateCustomerRequest, {
      ...validPayload,
      password: 'short',
    });

    expect(errors[0].property).toBe('password');
  });
});

describe('ListCustomersRequest', () => {
  it('defaults deleted to all', async () => {
    const { instance, errors } = await validateRequest(
      ListCustomersRequest,
      {},
    );

    expect(errors).toHaveLength(0);
    expect(instance.deleted).toBe('all');
  });

  it('accepts page and limit within bounds', async () => {
    const { instance, errors } = await validateRequest(ListCustomersRequest, {
      page: '2',
      limit: '50',
      deleted: 'false',
      search: '  nguyen  ',
    });

    expect(errors).toHaveLength(0);
    expect(instance).toMatchObject({
      page: 2,
      limit: 50,
      deleted: false,
      search: 'nguyen',
    });
  });

  it('rejects limit above 100 and page below 1', async () => {
    const { errors } = await validateRequest(ListCustomersRequest, {
      page: '0',
      limit: '101',
    });

    expect(errors.map((error) => error.property).sort()).toEqual([
      'limit',
      'page',
    ]);
  });
});
