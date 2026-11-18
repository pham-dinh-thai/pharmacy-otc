'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { fetchCurrentUser, hasPermission } from '@/lib/account';
import { authFetch } from '@/lib/auth';

const LIST_PATH = '/suppliers';
const CREATE_PATH = `${LIST_PATH}/new`;

function supplierPath(id: string): string {
  return `${LIST_PATH}/${id}`;
}

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

/** Luôn quay về danh sách (giữ lại bộ lọc nếu có) sau khi xử lý bản ghi. */
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

function supplierPayload(formData: FormData) {
  return {
    name: trimmed(formData.get('name')),
    phone: optionalText(formData.get('phone')),
    email: optionalText(formData.get('email')),
    address: optionalText(formData.get('address')),
    taxCode: optionalText(formData.get('taxCode')),
  };
}

function invalidPayload(payload: ReturnType<typeof supplierPayload>): boolean {
  return (
    !payload.name ||
    payload.name.length > 255 ||
    (payload.phone?.length ?? 0) > 30 ||
    (payload.email?.length ?? 0) > 255 ||
    (payload.address?.length ?? 0) > 255 ||
    (payload.taxCode?.length ?? 0) > 50
  );
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

function revalidateSupplier(id?: string): void {
  revalidatePath(LIST_PATH);
  if (id) revalidatePath(supplierPath(id));
}

/** Tạo nhà cung cấp; các trường tuỳ chọn để trống được gửi là null. */
export async function createSupplier(formData: FormData) {
  await requirePermission('suppliers:create', CREATE_PATH);

  const payload = supplierPayload(formData);

  if (invalidPayload(payload)) {
    redirect(withQuery(CREATE_PATH, { error: 'invalid' }));
  }

  let res: Response;
  try {
    res = await authFetch('/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    redirect(withQuery(CREATE_PATH, { error: 'server' }));
  }

  redirectForStatus(res, CREATE_PATH);

  const body = await readJson<{ id?: string }>(res);

  revalidateSupplier(body?.id);
  redirect(withQuery(LIST_PATH, { updated: 'created' }));
}

/** Cập nhật toàn bộ thông tin nhà cung cấp (thay thế đầy đủ). */
export async function updateSupplier(formData: FormData) {
  const id = trimmed(formData.get('supplierId'));
  const back = returnPath(formData.get('returnTo'));

  await requirePermission('suppliers:update', back);

  if (!id) redirect(withQuery(back, { error: 'missing' }));

  const payload = supplierPayload(formData);

  if (invalidPayload(payload)) {
    redirect(withQuery(back, { error: 'invalid' }));
  }

  let res: Response;
  try {
    res = await authFetch(`/suppliers/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    redirect(withQuery(back, { error: 'server' }));
  }

  redirectForStatus(res, back);

  revalidateSupplier(id);
  redirect(withQuery(listReturnPath(formData.get('returnTo')), { updated: 'saved' }));
}

/** Xoá mềm nhà cung cấp; có thể khôi phục từ danh sách hoặc trang chi tiết. */
export async function deleteSupplier(formData: FormData) {
  const id = trimmed(formData.get('supplierId'));
  const back = returnPath(formData.get('returnTo'));

  await requirePermission('suppliers:delete', back);

  if (!id) redirect(withQuery(back, { error: 'missing' }));

  let res: Response;
  try {
    res = await authFetch(`/suppliers/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  } catch {
    redirect(withQuery(back, { error: 'server' }));
  }

  redirectForStatus(res, back);

  revalidateSupplier(id);
  redirect(withQuery(LIST_PATH, { deleted: 'true', updated: 'deleted' }));
}

/** Khôi phục nhà cung cấp đã xoá mềm. */
export async function restoreSupplier(formData: FormData) {
  const id = trimmed(formData.get('supplierId'));
  const back = returnPath(formData.get('returnTo'));

  await requirePermission('suppliers:delete', back);

  if (!id) redirect(withQuery(back, { error: 'missing' }));

  let res: Response;
  try {
    res = await authFetch(`/suppliers/${encodeURIComponent(id)}/restore`, {
      method: 'PATCH',
    });
  } catch {
    redirect(withQuery(back, { error: 'server' }));
  }

  redirectForStatus(res, back);

  revalidateSupplier(id);
  redirect(withQuery(LIST_PATH, { deleted: 'false', updated: 'restored' }));
}
