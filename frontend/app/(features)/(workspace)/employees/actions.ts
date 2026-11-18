'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { fetchCurrentUser, hasPermission } from '@/lib/account';
import { authFetch } from '@/lib/auth';
import {
  isEmployeePosition,
  MANAGEABLE_EMPLOYEE_STATUSES,
} from '@/lib/employees';

const LIST_PATH = '/employees';
const CREATE_PATH = `${LIST_PATH}/new`;

function employeePath(id: string): string {
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

function trimmed(value: FormDataEntryValue | null): string {
  return String(value ?? '').trim();
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

/** Tạo nhân viên cùng tài khoản đăng nhập trong một giao dịch. */
export async function createEmployee(formData: FormData) {
  await requirePermission('employees:create', CREATE_PATH);

  const firstName = trimmed(formData.get('firstName'));
  const lastName = trimmed(formData.get('lastName'));
  const email = trimmed(formData.get('email'));
  const password = String(formData.get('password') ?? '');
  const departmentId = trimmed(formData.get('departmentId'));
  const positionRaw = formData.get('position');
  const position =
    positionRaw === null ? null : trimmed(positionRaw) || null;

  if (!firstName || !lastName || !email || !password || !departmentId) {
    redirect(`${CREATE_PATH}?error=missing`);
  }

  if (position !== null && !isEmployeePosition(position)) {
    redirect(`${CREATE_PATH}?error=invalid`);
  }

  let res: Response;
  try {
    res = await authFetch('/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        password,
        departmentId,
        position,
      }),
    });
  } catch {
    redirect(`${CREATE_PATH}?error=server`);
  }

  if (res.status === 401) redirect(`/login?next=${encodeURIComponent(CREATE_PATH)}`);
  if (res.status === 403) redirect(`${CREATE_PATH}?error=forbidden`);
  if (res.status === 404) redirect(`${CREATE_PATH}?error=department`);
  if (res.status === 409) redirect(`${CREATE_PATH}?error=conflict`);
  if (res.status === 400 || res.status === 422) {
    redirect(`${CREATE_PATH}?error=invalid`);
  }
  if (!res.ok) redirect(`${CREATE_PATH}?error=server`);

  const body = await readJson<{ id?: string }>(res);

  revalidatePath(LIST_PATH);
  redirect(body?.id ? employeePath(body.id) : LIST_PATH);
}

/** Cập nhật phòng ban và chức danh; không sửa họ tên hay email tại đây. */
export async function updateEmployee(formData: FormData) {
  const id = trimmed(formData.get('employeeId'));
  const back = returnPath(formData.get('returnTo'));

  await requirePermission('employees:update', back);

  const departmentId = trimmed(formData.get('departmentId'));
  const positionRaw = formData.get('position');
  const position = positionRaw === null ? undefined : trimmed(positionRaw) || null;

  if (!id || !departmentId) redirect(withQuery(back, { error: 'missing' }));

  if (
    position !== undefined &&
    position !== null &&
    !isEmployeePosition(position)
  ) {
    redirect(withQuery(back, { error: 'invalid' }));
  }

  let res: Response;
  try {
    res = await authFetch(`/employees/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ departmentId, position }),
    });
  } catch {
    redirect(withQuery(back, { error: 'server' }));
  }

  if (res.status === 401) redirect(`/login?next=${encodeURIComponent(back)}`);
  if (res.status === 403) redirect(withQuery(back, { error: 'forbidden' }));
  if (res.status === 404) redirect(`${LIST_PATH}?error=missing`);
  if (res.status === 409) redirect(withQuery(back, { error: 'conflict' }));
  if (res.status === 400 || res.status === 422) {
    redirect(withQuery(back, { error: 'invalid' }));
  }
  if (!res.ok) redirect(withQuery(back, { error: 'server' }));

  revalidatePath(LIST_PATH);
  revalidatePath(employeePath(id));
  redirect(withQuery(back, { updated: 'saved' }));
}

/**
 * Đổi trạng thái làm việc qua endpoint chuyên biệt. Nghỉ việc đi qua
 * `resignEmployee` để dùng chung luồng vô hiệu hoá tài khoản.
 */
export async function changeEmployeeStatus(formData: FormData) {
  const id = trimmed(formData.get('employeeId'));
  const back = returnPath(formData.get('returnTo'));
  const status = trimmed(formData.get('status'));

  await requirePermission('employees:update', back);

  if (!id) redirect(`${LIST_PATH}?error=missing`);
  if (!MANAGEABLE_EMPLOYEE_STATUSES.includes(status as never)) {
    redirect(withQuery(back, { error: 'invalid' }));
  }

  let res: Response;
  try {
    res = await authFetch(`/employees/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  } catch {
    redirect(withQuery(back, { error: 'server' }));
  }

  if (res.status === 401) redirect(`/login?next=${encodeURIComponent(back)}`);
  if (res.status === 403) redirect(withQuery(back, { error: 'forbidden' }));
  if (res.status === 404) redirect(`${LIST_PATH}?error=missing`);
  if (res.status === 400 || res.status === 422) {
    redirect(withQuery(back, { error: 'invalid' }));
  }
  if (!res.ok) redirect(withQuery(back, { error: 'server' }));

  revalidatePath(LIST_PATH);
  revalidatePath(employeePath(id));
  redirect(withQuery(back, { updated: 'status' }));
}

/** Nghỉ việc = cập nhật status RESIGNED, không xoá bản ghi nhân viên. */
export async function resignEmployee(formData: FormData) {
  const id = trimmed(formData.get('employeeId'));
  const back = returnPath(formData.get('returnTo'));

  await requirePermission('employees:delete', back);

  if (!id) redirect(`${LIST_PATH}?error=missing`);

  let res: Response;
  try {
    res = await authFetch(`/employees/${id}`, { method: 'DELETE' });
  } catch {
    redirect(withQuery(back, { error: 'server' }));
  }

  if (res.status === 401) redirect(`/login?next=${encodeURIComponent(back)}`);
  if (res.status === 403) redirect(withQuery(back, { error: 'forbidden' }));
  if (res.status === 404) redirect(`${LIST_PATH}?error=missing`);
  if (res.status === 409) redirect(`${LIST_PATH}?error=alreadyResigned`);
  if (!res.ok) redirect(withQuery(back, { error: 'server' }));

  revalidatePath(LIST_PATH);
  revalidatePath(employeePath(id));
  redirect(withQuery(listReturnPath(formData.get('returnTo')), { updated: 'resigned' }));
}
