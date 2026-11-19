'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { fetchCurrentUser, hasPermission } from '@/lib/account';
import { authFetch } from '@/lib/auth';

const LIST_PATH = '/categories';
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

function trimmed(value: FormDataEntryValue | null): string {
  return String(value ?? '').trim();
}

function categoryPayload(formData: FormData) {
  return {
    name: trimmed(formData.get('name')),
    slug: trimmed(formData.get('slug')),
    description: trimmed(formData.get('description')),
  };
}

type Payload = ReturnType<typeof categoryPayload>;

function validatePayload(payload: Payload): 'missing' | 'invalid' | 'ok' {
  if (!payload.name) return 'missing';

  if (
    payload.name.length > 255 ||
    payload.slug.length > 255 ||
    payload.description.length > 255
  ) {
    return 'invalid';
  }

  return 'ok';
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
  if (res.status === 409) {
    redirect(withQuery(back, { error: 'exists' }));
  }
  if (res.status === 400 || res.status === 422) {
    redirect(withQuery(back, { error: 'invalid' }));
  }
  if (res.status === 404) {
    redirect(withQuery(back, { error: 'notfound' }));
  }
  if (!res.ok) {
    redirect(withQuery(back, { error: 'server' }));
  }
}

function revalidateCategories(id?: string): void {
  revalidatePath(LIST_PATH);
  revalidatePath('/products');
  if (id) revalidatePath(`${LIST_PATH}/${id}`);
}

export async function createCategory(formData: FormData) {
  await requirePermission('categories:create', CREATE_PATH);

  const payload = categoryPayload(formData);
  const validation = validatePayload(payload);

  if (validation !== 'ok') {
    redirect(withQuery(CREATE_PATH, { error: validation }));
  }

  let res: Response;
  try {
    res = await authFetch('/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    redirect(withQuery(CREATE_PATH, { error: 'server' }));
  }

  redirectForStatus(res, CREATE_PATH);

  revalidateCategories();
  redirect(withQuery(LIST_PATH, { updated: 'created' }));
}

export async function updateCategory(formData: FormData) {
  const id = trimmed(formData.get('categoryId'));
  const back = returnPath(formData.get('returnTo'));

  await requirePermission('categories:update', back);

  if (!id) redirect(withQuery(back, { error: 'missing' }));

  const payload = categoryPayload(formData);
  const validation = validatePayload(payload);

  if (validation !== 'ok') {
    redirect(withQuery(back, { error: validation }));
  }

  let res: Response;
  try {
    res = await authFetch(`/categories/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    redirect(withQuery(back, { error: 'server' }));
  }

  redirectForStatus(res, back);

  revalidateCategories(id);
  redirect(withQuery(LIST_PATH, { updated: 'saved' }));
}

export async function deleteCategory(formData: FormData) {
  const id = trimmed(formData.get('categoryId'));
  const back = returnPath(formData.get('returnTo'));

  await requirePermission('categories:delete', back);

  if (!id) redirect(withQuery(back, { error: 'missing' }));

  let res: Response;
  try {
    res = await authFetch(`/categories/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  } catch {
    redirect(withQuery(back, { error: 'server' }));
  }

  redirectForStatus(res, back);

  revalidateCategories(id);
  redirect(withQuery(LIST_PATH, { deleted: 'true', updated: 'deleted' }));
}

export async function restoreCategory(formData: FormData) {
  const id = trimmed(formData.get('categoryId'));
  const back = returnPath(formData.get('returnTo'));

  await requirePermission('categories:delete', back);

  if (!id) redirect(withQuery(back, { error: 'missing' }));

  let res: Response;
  try {
    res = await authFetch(`/categories/${encodeURIComponent(id)}/restore`, {
      method: 'PATCH',
    });
  } catch {
    redirect(withQuery(back, { error: 'server' }));
  }

  redirectForStatus(res, back);

  revalidateCategories(id);
  redirect(withQuery(LIST_PATH, { deleted: 'false', updated: 'restored' }));
}
