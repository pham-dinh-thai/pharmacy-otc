'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { fetchCurrentUser, hasPermission } from '@/lib/account';
import { authFetch } from '@/lib/auth';
import { isCustomerGender } from '@/lib/customers';

const LIST_PATH = '/customers';
const CREATE_PATH = `${LIST_PATH}/new`;

function withQuery(path: string, query: Record<string, string>): string {
  const url = new URL(path, 'http://localhost');

  Object.entries(query).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return `${url.pathname}${url.search}`;
}

function returnPath(value: FormDataEntryValue | null): string {
  const path = String(value ?? '');

  if (path === LIST_PATH || path.startsWith(`${LIST_PATH}/`)) return path;
  if (path.startsWith(`${LIST_PATH}?`)) return path;

  return LIST_PATH;
}

/** Chỉ giữ lại đường dẫn danh sách (có thể kèm filter), bỏ đường dẫn chi tiết. */
function listReturnPath(value: FormDataEntryValue | null): string {
  const path = returnPath(value);
  const url = new URL(path, 'http://localhost');

  return url.pathname === LIST_PATH ? `${url.pathname}${url.search}` : LIST_PATH;
}

function trimmed(value: FormDataEntryValue | null): string {
  return String(value ?? '').trim();
}

function optionalText(value: FormDataEntryValue | null): string | null {
  return trimmed(value) || null;
}

function indexes(values: FormDataEntryValue[]): Set<number> {
  return new Set(values.map((value) => Number(value)));
}

function customerPayload(formData: FormData, withPassword: boolean) {
  const primaryIndexes = indexes(formData.getAll('phonePrimary'));
  const defaultIndexes = indexes(formData.getAll('addressDefault'));

  const phones = formData
    .getAll('phone')
    .flatMap((value, index) => {
      const phone = trimmed(value);

      return phone ? [{ phone, isPrimary: primaryIndexes.has(index) }] : [];
    });

  const addresses = formData
    .getAll('address')
    .flatMap((value, index) => {
      const address = trimmed(value);

      return address ? [{ address, isDefault: defaultIndexes.has(index) }] : [];
    });

  const payload: {
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    gender: string | null;
    dateOfBirth: string | null;
    phones: { phone: string; isPrimary: boolean }[];
    addresses: { address: string; isDefault: boolean }[];
  } = {
    firstName: trimmed(formData.get('firstName')),
    lastName: trimmed(formData.get('lastName')),
    email: trimmed(formData.get('email')),
    gender: optionalText(formData.get('gender')),
    dateOfBirth: optionalText(formData.get('dateOfBirth')),
    phones,
    addresses,
  };

  if (withPassword) {
    // Không trim mật khẩu: khoảng trắng là một phần của secret.
    payload.password = String(formData.get('password') ?? '');
  }

  return payload;
}

type Payload = ReturnType<typeof customerPayload>;

function validatePayload(
  payload: Payload,
  withPassword: boolean,
): 'ok' | 'missing' | 'invalid' {
  if (
    !payload.firstName ||
    !payload.lastName ||
    !payload.email ||
    !payload.phones.length ||
    !payload.addresses.length
  ) {
    return 'missing';
  }

  if (withPassword && !payload.password) return 'missing';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) return 'invalid';
  if (payload.gender && !isCustomerGender(payload.gender)) return 'invalid';
  if (
    payload.dateOfBirth &&
    !/^\d{4}-\d{2}-\d{2}$/.test(payload.dateOfBirth)
  ) {
    return 'invalid';
  }
  if (payload.phones.some((item) => item.phone.length > 30)) return 'invalid';
  if (payload.addresses.some((item) => item.address.length > 500)) {
    return 'invalid';
  }
  if (
    withPassword &&
    (payload.password!.length < 8 || payload.password!.length > 128)
  ) {
    return 'invalid';
  }

  return 'ok';
}

async function readJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function requirePermission(
  permission: string,
  fallback: string,
): Promise<void> {
  const user = await fetchCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(fallback)}`);
  }

  if (!user.isSuperAdmin && !hasPermission(user, permission)) {
    redirect(withQuery(fallback, { error: 'forbidden' }));
  }
}

function redirectForStatus(res: Response, back: string): void {
  if (res.status === 401) {
    redirect(`/login?next=${encodeURIComponent(back)}`);
  }
  if (res.status === 403) {
    redirect(withQuery(back, { error: 'forbidden' }));
  }
  if (res.status === 400 || res.status === 422) {
    redirect(withQuery(back, { error: 'invalid' }));
  }
  if (res.status === 409) {
    redirect(withQuery(back, { error: 'exists' }));
  }
  if (res.status === 404) {
    redirect(withQuery(back, { error: 'notfound' }));
  }
  if (!res.ok) {
    redirect(withQuery(back, { error: 'server' }));
  }
}

function revalidateCustomer(id?: string): void {
  revalidatePath(LIST_PATH);
  if (id) revalidatePath(`${LIST_PATH}/${id}`);
}

/** Tạo khách hàng kèm account; mật khẩu do quản trị đặt. */
export async function createCustomer(formData: FormData) {
  await requirePermission('customers:create', CREATE_PATH);

  const payload = customerPayload(formData, true);
  const validation = validatePayload(payload, true);

  if (validation !== 'ok') {
    redirect(withQuery(CREATE_PATH, { error: validation }));
  }

  let res: Response;
  try {
    res = await authFetch('/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    redirect(withQuery(CREATE_PATH, { error: 'server' }));
  }

  redirectForStatus(res, CREATE_PATH);

  const body = await readJson<{ id?: string }>(res);

  revalidateCustomer(body?.id);
  redirect(withQuery(LIST_PATH, { updated: 'created' }));
}

/** Cập nhật toàn bộ hồ sơ khách hàng (thay thế đầy đủ). */
export async function updateCustomer(formData: FormData) {
  const id = trimmed(formData.get('customerId'));
  const back = returnPath(formData.get('returnTo'));

  await requirePermission('customers:update', back);

  if (!id) redirect(withQuery(back, { error: 'missing' }));

  const payload = customerPayload(formData, false);
  const validation = validatePayload(payload, false);

  if (validation !== 'ok') {
    redirect(withQuery(back, { error: validation }));
  }

  let res: Response;
  try {
    res = await authFetch(`/customers/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    redirect(withQuery(back, { error: 'server' }));
  }

  redirectForStatus(res, back);

  revalidateCustomer(id);
  redirect(
    withQuery(listReturnPath(formData.get('returnTo')), { updated: 'saved' }),
  );
}

/** Xoá mềm khách hàng; có thể khôi phục từ danh sách hoặc trang chi tiết. */
export async function deleteCustomer(formData: FormData) {
  const id = trimmed(formData.get('customerId'));
  const back = returnPath(formData.get('returnTo'));

  await requirePermission('customers:delete', back);

  if (!id) redirect(withQuery(back, { error: 'missing' }));

  let res: Response;
  try {
    res = await authFetch(`/customers/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  } catch {
    redirect(withQuery(back, { error: 'server' }));
  }

  redirectForStatus(res, back);

  revalidateCustomer(id);
  redirect(withQuery(LIST_PATH, { deleted: 'true', updated: 'deleted' }));
}

/** Khôi phục khách hàng đã xoá mềm. */
export async function restoreCustomer(formData: FormData) {
  const id = trimmed(formData.get('customerId'));
  const back = returnPath(formData.get('returnTo'));

  await requirePermission('customers:delete', back);

  if (!id) redirect(withQuery(back, { error: 'missing' }));

  let res: Response;
  try {
    res = await authFetch(`/customers/${encodeURIComponent(id)}/restore`, {
      method: 'PATCH',
    });
  } catch {
    redirect(withQuery(back, { error: 'server' }));
  }

  redirectForStatus(res, back);

  revalidateCustomer(id);
  redirect(withQuery(LIST_PATH, { deleted: 'false', updated: 'restored' }));
}
