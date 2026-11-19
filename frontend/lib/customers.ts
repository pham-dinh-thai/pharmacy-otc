import type { TriStateValue } from './list-filters';

export type CustomerGender = 'male' | 'female' | 'other';
export type CustomerDeletedFilter = TriStateValue;

export const CUSTOMER_GENDERS: readonly {
  value: CustomerGender;
  label: string;
}[] = [
  { value: 'male', label: 'Nam' },
  { value: 'female', label: 'Nữ' },
  { value: 'other', label: 'Khác' },
];

export const CUSTOMER_DELETED_FILTERS: readonly {
  value: CustomerDeletedFilter;
  label: string;
}[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'false', label: 'Đang dùng' },
  { value: 'true', label: 'Đã xoá' },
];

export type CustomerPhone = {
  id: string;
  phone: string;
  isPrimary: boolean;
};

export type CustomerAddress = {
  id: string;
  address: string;
  isDefault: boolean;
};

export type CustomerListItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  primaryPhone: string;
  phoneCount: number;
  gender: CustomerGender | null;
  dateOfBirth: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CustomerDetail = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: CustomerGender | null;
  dateOfBirth: string | null;
  phones: CustomerPhone[];
  addresses: CustomerAddress[];
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CustomerPage = {
  items: CustomerListItem[];
  total: number;
  page: number;
  limit: number;
};

export function isCustomerGender(value: string): value is CustomerGender {
  return value === 'male' || value === 'female' || value === 'other';
}

export function customerGenderLabel(gender: CustomerGender | null): string {
  if (!gender) return '—';

  return CUSTOMER_GENDERS.find((item) => item.value === gender)?.label ?? '—';
}

export function customerFullName(customer: {
  firstName: string;
  lastName: string;
}): string {
  return `${customer.lastName} ${customer.firstName}`.trim();
}

export function isCustomerDeleted(customer: { deletedAt: string | null }) {
  return Boolean(customer.deletedAt);
}

export function customerStateLabel(deleted: boolean): string {
  return deleted ? 'Đã xoá' : 'Đang dùng';
}

export function formatCustomerDate(value: string | null | undefined): string {
  if (!value) return '—';

  return new Date(value).toLocaleString('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

/** Ngày sinh được lưu ở 00:00 UTC nên ép UTC để không lệch ngày khi hiển thị. */
export function formatCustomerBirthDate(
  value: string | null | undefined,
): string {
  if (!value) return '—';

  return new Date(value).toLocaleDateString('vi-VN', { timeZone: 'UTC' });
}

/** Chuyển giá trị ISO từ API sang dạng `yyyy-mm-dd` cho input type="date". */
export function toDateInputValue(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : '';
}
