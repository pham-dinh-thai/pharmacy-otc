'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { authFetch } from '@/lib/auth';

const LIST_PATH = '/departments';

function departmentPath(id: string): string {
  return `${LIST_PATH}/${id}`;
}

function returnPath(value: FormDataEntryValue | null): string {
  const path = String(value ?? '');

  return path === LIST_PATH || path.startsWith(`${LIST_PATH}/`)
    ? path
    : LIST_PATH;
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

  if (!id || !name) redirect(`${back}?error=missing`);

  let res: Response;
  try {
    res = await authFetch(`/departments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
  } catch {
    redirect(`${back}?error=server`);
  }

  if (res.status === 401) redirect(`/login?next=${back}`);
  if (res.status === 403) redirect(`${back}?error=forbidden`);
  if (res.status === 404) redirect(`${LIST_PATH}?error=missing`);
  if (res.status === 409) redirect(`${back}?error=exists`);
  if (res.status === 400 || res.status === 422) {
    redirect(`${back}?error=invalid`);
  }
  if (!res.ok) redirect(`${back}?error=server`);

  revalidatePath(LIST_PATH);
  revalidatePath(departmentPath(id));
  redirect(`${back}?updated=saved`);
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
    redirect(`${back}?error=server`);
  }

  if (res.status === 401) redirect(`/login?next=${back}`);
  if (res.status === 403) redirect(`${back}?error=forbidden`);
  if (res.status === 404) redirect(`${LIST_PATH}?error=missing`);
  if (res.status === 409) redirect(`${back}?error=alreadyDisabled`);
  if (!res.ok) redirect(`${back}?error=server`);

  revalidatePath(LIST_PATH);
  revalidatePath(departmentPath(id));
  redirect(`${LIST_PATH}?updated=disabled`);
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
    redirect(`${back}?error=server`);
  }

  if (res.status === 401) redirect(`/login?next=${back}`);
  if (res.status === 403) redirect(`${back}?error=forbidden`);
  if (res.status === 404) redirect(`${LIST_PATH}?error=missing`);
  if (res.status === 409) redirect(`${back}?error=notDisabled`);
  if (!res.ok) redirect(`${back}?error=server`);

  revalidatePath(LIST_PATH);
  revalidatePath(departmentPath(id));
  redirect(`${back}?updated=restored`);
}
