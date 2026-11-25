import { cache } from 'react';
import { authFetch } from './auth';

export type DeliveryContact = {
  phone: string | null;
  address: string | null;
};

/** SĐT/địa chỉ giao hàng lưu trong bản ghi customers của chính user. */
export const fetchDeliveryContact = cache(
  async (): Promise<DeliveryContact> => {
    try {
      const response = await authFetch('/customers/me/delivery-contact');
      if (!response.ok) return { phone: null, address: null };

      return (await response.json()) as DeliveryContact;
    } catch {
      return { phone: null, address: null };
    }
  },
);
