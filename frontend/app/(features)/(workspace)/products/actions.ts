'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { fetchCurrentUser, hasPermission } from '@/lib/account';
import { authFetch } from '@/lib/auth';

const LIST_PATH = '/products';
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

function listReturnPath(value: FormDataEntryValue | null): string {
  const path = returnPath(value);
  const url = new URL(path, 'http://localhost');

  return url.pathname === LIST_PATH ? `${url.pathname}${url.search}` : LIST_PATH;
}

function trimmed(value: FormDataEntryValue | null): string {
  return String(value ?? '').trim();
}

function productPayload(formData: FormData) {
  const categoryIds = [
    ...new Set(
      formData
        .getAll('categoryIds')
        .map((value) => trimmed(value))
        .filter(Boolean),
    ),
  ];

  return {
    name: trimmed(formData.get('name')),
    unitPrice: trimmed(formData.get('unitPrice')),
    quantity: Number(trimmed(formData.get('quantity'))),
    categoryIds,
  };
}

type Payload = ReturnType<typeof productPayload>;

function validatePayload(payload: Payload): 'missing' | 'invalid' | 'ok' {
  if (!payload.name || !payload.unitPrice || !payload.categoryIds.every(Boolean)) {
    return 'missing';
  }

  if (
    payload.name.length > 255 ||
    !/^\d+$/.test(payload.unitPrice) ||
    !Number.isSafeInteger(payload.quantity) ||
    payload.quantity < 0
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
  if (res.status === 404) {
    redirect(withQuery(back, { error: 'notfound' }));
  }
  if (!res.ok) {
    redirect(withQuery(back, { error: 'server' }));
  }
}

function revalidateProduct(id?: string): void {
  revalidatePath(LIST_PATH);
  if (id) revalidatePath(`${LIST_PATH}/${id}`);
}

export async function createProduct(formData: FormData) {
  await requirePermission('products:create', CREATE_PATH);

  const payload = productPayload(formData);
  const validation = validatePayload(payload);

  if (validation !== 'ok') {
    redirect(withQuery(CREATE_PATH, { error: validation }));
  }

  let res: Response;
  try {
    res = await authFetch('/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    redirect(withQuery(CREATE_PATH, { error: 'server' }));
  }

  redirectForStatus(res, CREATE_PATH);

  const body = await readJson<{ id?: string }>(res);

  revalidateProduct(body?.id);
  redirect(withQuery(LIST_PATH, { updated: 'created' }));
}

export async function updateProduct(formData: FormData) {
  const id = trimmed(formData.get('productId'));
  const back = returnPath(formData.get('returnTo'));

  await requirePermission('products:update', back);

  if (!id) redirect(withQuery(back, { error: 'missing' }));

  const payload = productPayload(formData);
  const validation = validatePayload(payload);

  if (validation !== 'ok') {
    redirect(withQuery(back, { error: validation }));
  }

  let res: Response;
  try {
    res = await authFetch(`/products/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    redirect(withQuery(back, { error: 'server' }));
  }

  redirectForStatus(res, back);

  revalidateProduct(id);
  redirect(
    withQuery(listReturnPath(formData.get('returnTo')), { updated: 'saved' }),
  );
}

export async function deleteProduct(formData: FormData) {
  const id = trimmed(formData.get('productId'));
  const back = returnPath(formData.get('returnTo'));

  await requirePermission('products:delete', back);

  if (!id) redirect(withQuery(back, { error: 'missing' }));

  let res: Response;
  try {
    res = await authFetch(`/products/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  } catch {
    redirect(withQuery(back, { error: 'server' }));
  }

  redirectForStatus(res, back);

  revalidateProduct(id);
  redirect(withQuery(LIST_PATH, { deleted: 'true', updated: 'deleted' }));
}

export async function restoreProduct(formData: FormData) {
  const id = trimmed(formData.get('productId'));
  const back = returnPath(formData.get('returnTo'));

  await requirePermission('products:delete', back);

  if (!id) redirect(withQuery(back, { error: 'missing' }));

  let res: Response;
  try {
    res = await authFetch(`/products/${encodeURIComponent(id)}/restore`, {
      method: 'PATCH',
    });
  } catch {
    redirect(withQuery(back, { error: 'server' }));
  }

  redirectForStatus(res, back);

  revalidateProduct(id);
  redirect(withQuery(LIST_PATH, { deleted: 'false', updated: 'restored' }));
}
