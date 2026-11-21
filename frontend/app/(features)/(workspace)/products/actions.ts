'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { fetchCurrentUser, hasPermission } from '@/lib/account';
import { authFetch } from '@/lib/auth';
import {
  ALLOWED_PRODUCT_IMAGE_TYPES,
  PRODUCT_IMAGE_MAX_BYTES,
} from '@/lib/product-image';

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

  return url.pathname === LIST_PATH
    ? `${url.pathname}${url.search}`
    : LIST_PATH;
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
    sku: trimmed(formData.get('sku')).toUpperCase(),
    unitPrice: trimmed(formData.get('unitPrice')),
    unit: trimmed(formData.get('unit')),
    description: trimmed(formData.get('description')),
    imageUrl: trimmed(formData.get('imageUrl')),
    warning: trimmed(formData.get('warning')),
    categoryIds,
  };
}

type Payload = ReturnType<typeof productPayload>;

function validatePayload(payload: Payload): 'missing' | 'invalid' | 'ok' {
  if (!payload.name || !payload.unitPrice) {
    return 'missing';
  }

  if (
    payload.name.length > 255 ||
    payload.sku.length > 100 ||
    payload.unit.length > 50 ||
    payload.description.length > 1000 ||
    payload.imageUrl.length > 2048 ||
    payload.warning.length > 1000 ||
    !/^\d+$/.test(payload.unitPrice)
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

function revalidateProduct(id?: string): void {
  revalidatePath(LIST_PATH);
  if (id) revalidatePath(`${LIST_PATH}/${id}`);
}

type UploadedImage = {
  hash: string;
  url: string;
  contentType: string;
  size: number;
};

async function uploadProductImage(file: File, back: string): Promise<string> {
  if (
    file.size > PRODUCT_IMAGE_MAX_BYTES ||
    !ALLOWED_PRODUCT_IMAGE_TYPES.has(file.type)
  ) {
    redirect(withQuery(back, { error: 'image' }));
  }

  let res: Response;
  try {
    res = await authFetch('/uploads/images', {
      method: 'POST',
      headers: { 'Content-Type': file.type },
      body: file,
    });
  } catch {
    redirect(withQuery(back, { error: 'image' }));
  }

  if (!res.ok) {
    redirect(withQuery(back, { error: 'image' }));
  }

  const uploaded = (await res.json()) as UploadedImage;

  return uploaded.url;
}

async function resolveImageUrl(
  formData: FormData,
  payload: { imageUrl: string },
  back: string,
): Promise<void> {
  const image = formData.get('image');

  if (image instanceof File && image.size > 0) {
    payload.imageUrl = await uploadProductImage(image, back);
  }
}

export async function createProduct(formData: FormData) {
  await requirePermission('products:create', CREATE_PATH);

  const payload = productPayload(formData);
  const validation = validatePayload(payload);

  if (validation !== 'ok') {
    redirect(withQuery(CREATE_PATH, { error: validation }));
  }

  await resolveImageUrl(formData, payload, CREATE_PATH);

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

  await resolveImageUrl(formData, payload, back);

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
