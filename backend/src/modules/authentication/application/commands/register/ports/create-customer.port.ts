import type { CustomerProfileInput } from '../../../../../customers/domain/customer.aggregate';

export type CreateCustomerRequest = CustomerProfileInput & {
  userId: string;
};

export interface ICreateCustomerPort {
  execute(request: CreateCustomerRequest): Promise<{ id: string }>;
}

export const CREATE_CUSTOMER_PORT = 'ICreateCustomerPort';
