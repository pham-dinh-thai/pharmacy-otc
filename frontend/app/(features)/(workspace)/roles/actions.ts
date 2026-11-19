'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { authFetch } from '@/lib/auth';

const LIST_PATH = '/roles';

function rolePath(id: string): string {
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

async function readJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Tạo vai trò mới rồi mở trang quản lý quyền của vai trò đó. */
export async function createRole(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const isSuperAdmin = formData.get('isSuperAdmin') === 'on';
  const permissions = [
    ...new Set(
      formData
        .getAll('permissions')
        .map((permission) => String(permission))
        .filter(Boolean),
    ),
  ];

  if (!name) redirect(`${LIST_PATH}/new?error=missing`);

  let res: Response;
  try {
    res = await authFetch('/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, permissions, isSuperAdmin }),
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
  redirect(body?.id ? rolePath(body.id) : LIST_PATH);
}

/** Cấp quyền cho vai trò. */
export async function grantPermission(formData: FormData) {
  const roleId = String(formData.get('roleId') ?? '');
  const permission = String(formData.get('permission') ?? '');
  const back = roleId ? rolePath(roleId) : LIST_PATH;

  if (!roleId || !permission) redirect(`${LIST_PATH}?error=missing`);

  let res: Response;
  try {
    res = await authFetch(`/roles/${roleId}/permissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permission }),
    });
  } catch {
    redirect(withQuery(back, { error: 'server' }));
  }

  if (res.status === 401) redirect(`/login?next=${encodeURIComponent(back)}`);
  if (res.status === 403) redirect(withQuery(back, { error: 'forbidden' }));
  if (res.status === 404) redirect(`${LIST_PATH}?error=missing`);
  if (res.status === 409) redirect(withQuery(back, { error: 'granted' }));
  if (res.status === 400 || res.status === 422) {
    redirect(withQuery(back, { error: 'invalid' }));
  }
  if (!res.ok) redirect(withQuery(back, { error: 'server' }));

  revalidatePath(LIST_PATH);
  revalidatePath(back);
  redirect(withQuery(back, { updated: 'granted' }));
}

/** Xoá quyền khỏi vai trò. */
export async function revokePermission(formData: FormData) {
  const roleId = String(formData.get('roleId') ?? '');
  const permission = String(formData.get('permission') ?? '');
  const back = roleId ? rolePath(roleId) : LIST_PATH;

  if (!roleId || !permission) redirect(`${LIST_PATH}?error=missing`);

  let res: Response;
  try {
    res = await authFetch(
      `/roles/${roleId}/permissions/${encodeURIComponent(permission)}`,
      { method: 'DELETE' },
    );
  } catch {
    redirect(withQuery(back, { error: 'server' }));
  }

  if (res.status === 401) redirect(`/login?next=${encodeURIComponent(back)}`);
  if (res.status === 403) redirect(withQuery(back, { error: 'forbidden' }));
  if (res.status === 404) redirect(`${LIST_PATH}?error=missing`);
  if (res.status === 409) redirect(withQuery(back, { error: 'notGranted' }));
  if (res.status === 400 || res.status === 422) {
    redirect(withQuery(back, { error: 'invalid' }));
  }
  if (!res.ok) redirect(withQuery(back, { error: 'server' }));

  revalidatePath(LIST_PATH);
  revalidatePath(back);
  redirect(withQuery(back, { updated: 'removed' }));
}

/** Vô hiệu hoá vai trò (xoá mềm): vai trò ngừng cấp quyền nhưng vẫn khôi phục được. */
export async function disableRole(formData: FormData) {
  const roleId = String(formData.get('roleId') ?? '');
  const back = returnPath(formData.get('returnTo'));

  if (!roleId) redirect(`${LIST_PATH}?error=missing`);

  let res: Response;
  try {
    res = await authFetch(`/roles/${roleId}`, { method: 'DELETE' });
  } catch {
    redirect(withQuery(back, { error: 'server' }));
  }

  if (res.status === 401) redirect(`/login?next=${encodeURIComponent(back)}`);
  if (res.status === 403) redirect(withQuery(back, { error: 'forbidden' }));
  if (res.status === 404) redirect(`${LIST_PATH}?error=missing`);
  if (res.status === 409) redirect(withQuery(back, { error: 'cannotDisable' }));
  if (!res.ok) redirect(withQuery(back, { error: 'server' }));

  revalidatePath(LIST_PATH);
  revalidatePath(rolePath(roleId));
  redirect(withQuery(back, { updated: 'disabled' }));
}

/** Khôi phục vai trò đã bị vô hiệu hoá. */
export async function restoreRole(formData: FormData) {
  const roleId = String(formData.get('roleId') ?? '');
  const back = returnPath(formData.get('returnTo'));

  if (!roleId) redirect(`${LIST_PATH}?error=missing`);

  let res: Response;
  try {
    res = await authFetch(`/roles/${roleId}/restore`, { method: 'PATCH' });
  } catch {
    redirect(withQuery(back, { error: 'server' }));
  }

  if (res.status === 401) redirect(`/login?next=${encodeURIComponent(back)}`);
  if (res.status === 403) redirect(withQuery(back, { error: 'forbidden' }));
  if (res.status === 404) redirect(`${LIST_PATH}?error=missing`);
  if (res.status === 409) redirect(withQuery(back, { error: 'notDisabled' }));
  if (!res.ok) redirect(withQuery(back, { error: 'server' }));

  revalidatePath(LIST_PATH);
  revalidatePath(rolePath(roleId));
  redirect(withQuery(back, { updated: 'restored' }));
}
