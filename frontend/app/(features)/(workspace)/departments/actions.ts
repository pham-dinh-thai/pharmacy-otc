'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { authFetch } from '@/lib/auth';

const LIST_PATH = '/departments';

function departmentPath(id: string): string {
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

/** Khi quay về danh sách thì giữ lại page/limit. */
function listReturnPath(value: FormDataEntryValue | null): string {
  const url = new URL(returnPath(value), 'http://localhost');

  return url.pathname === LIST_PATH ? `${url.pathname}${url.search}` : LIST_PATH;
}

async function readJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Tạo phòng ban mới. */
export async function createDepartment(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();

  if (!name) redirect(`${LIST_PATH}/new?error=missing`);

  let res: Response;
  try {
    res = await authFetch('/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
  } catch {
    redirect(`${LIST_PATH}/new?error=server`);
  }

  if (res.status === 401) redirect(`/login?next=${LIST_PATH}/new`);
  if (res.status === 403) redirect(`${LIST_PATH}/new?error=forbidden`);
  if (res.status === 409) redirect(`${LIST_PATH}/new?error=exists`);
  if (res.status === 400 || res.status === 422) {
    redirect(`${LIST_PATH}/new?error=invalid`);
  }
  if (!res.ok) redirect(`${LIST_PATH}/new?error=server`);

  const body = await readJson<{ id?: string }>(res);

  revalidatePath(LIST_PATH);
  redirect(body?.id ? departmentPath(body.id) : LIST_PATH);
}

/** Đổi tên phòng ban đang hoạt động. */
export async function updateDepartment(formData: FormData) {
  const id = String(formData.get('departmentId') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  const back = returnPath(formData.get('returnTo'));

  if (!id || !name) redirect(withQuery(back, { error: 'missing' }));

  let res: Response;
  try {
    res = await authFetch(`/departments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
  } catch {
    redirect(withQuery(back, { error: 'server' }));
  }

  if (res.status === 401) redirect(`/login?next=${encodeURIComponent(back)}`);
  if (res.status === 403) redirect(withQuery(back, { error: 'forbidden' }));
  if (res.status === 404) redirect(`${LIST_PATH}?error=missing`);
  if (res.status === 409) redirect(withQuery(back, { error: 'exists' }));
  if (res.status === 400 || res.status === 422) {
    redirect(withQuery(back, { error: 'invalid' }));
  }
  if (!res.ok) redirect(withQuery(back, { error: 'server' }));

  revalidatePath(LIST_PATH);
  revalidatePath(departmentPath(id));
  redirect(withQuery(back, { updated: 'saved' }));
}

/** Vô hiệu hoá phòng ban (xoá mềm): ẩn khỏi danh sách chính, vẫn khôi phục được. */
export async function disableDepartment(formData: FormData) {
  const id = String(formData.get('departmentId') ?? '');
  const back = returnPath(formData.get('returnTo'));

  if (!id) redirect(`${LIST_PATH}?error=missing`);

  let res: Response;
  try {
    res = await authFetch(`/departments/${id}`, { method: 'DELETE' });
  } catch {
    redirect(withQuery(back, { error: 'server' }));
  }

  if (res.status === 401) redirect(`/login?next=${encodeURIComponent(back)}`);
  if (res.status === 403) redirect(withQuery(back, { error: 'forbidden' }));
  if (res.status === 404) redirect(`${LIST_PATH}?error=missing`);
  if (res.status === 409) redirect(withQuery(back, { error: 'alreadyDisabled' }));
  if (!res.ok) redirect(withQuery(back, { error: 'server' }));

  revalidatePath(LIST_PATH);
  revalidatePath(departmentPath(id));
  redirect(withQuery(listReturnPath(formData.get('returnTo')), { updated: 'disabled' }));
}

/** Khôi phục phòng ban đã vô hiệu hoá. */
export async function restoreDepartment(formData: FormData) {
  const id = String(formData.get('departmentId') ?? '');
  const back = returnPath(formData.get('returnTo'));

  if (!id) redirect(`${LIST_PATH}?error=missing`);

  let res: Response;
  try {
    res = await authFetch(`/departments/${id}/restore`, { method: 'PATCH' });
  } catch {
    redirect(withQuery(back, { error: 'server' }));
  }

  if (res.status === 401) redirect(`/login?next=${encodeURIComponent(back)}`);
  if (res.status === 403) redirect(withQuery(back, { error: 'forbidden' }));
  if (res.status === 404) redirect(`${LIST_PATH}?error=missing`);
  if (res.status === 409) redirect(withQuery(back, { error: 'notDisabled' }));
  if (!res.ok) redirect(withQuery(back, { error: 'server' }));

  revalidatePath(LIST_PATH);
  revalidatePath(departmentPath(id));
  redirect(withQuery(back, { updated: 'restored' }));
}
