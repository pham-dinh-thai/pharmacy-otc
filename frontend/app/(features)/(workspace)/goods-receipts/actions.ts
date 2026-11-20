'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { fetchCurrentUser, hasPermission } from '@/lib/account';
import { authFetch } from '@/lib/auth';
import type { ProductOption } from '@/lib/categories';

const LIST_PATH = '/goods-receipts';
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
  if (res.status === 404) {
    redirect(withQuery(back, { error: 'notfound' }));
  }
  if (res.status === 409) {
    redirect(withQuery(back, { error: 'conflict' }));
  }
  if (res.status === 400 || res.status === 422) {
    redirect(withQuery(back, { error: 'invalid' }));
  }
  if (!res.ok) {
    redirect(withQuery(back, { error: 'server' }));
  }
}

function revalidateGoodsReceipts(id?: string): void {
  revalidatePath(LIST_PATH);
  revalidatePath('/inventories');
  if (id) revalidatePath(`${LIST_PATH}/${id}`);
}

function receiptPayload(formData: FormData) {
  const productIds = formData.getAll('productId').map(trimmed);
  const lotNumbers = formData.getAll('lotNumber').map(trimmed);
  const quantities = formData.getAll('quantity').map(trimmed);
  const unitCosts = formData.getAll('unitCost').map(trimmed);
  const expiresAts = formData.getAll('expiresAt').map(trimmed);

  return {
    supplierId: trimmed(formData.get('supplierId')),
    lines: productIds.map((productId, index) => ({
      productId,
      lotNumber: lotNumbers[index] ?? '',
      // API mong số, không phải chuỗi: gửi chuỗi sẽ bị class-validator từ chối.
      quantity: Number(quantities[index] ?? ''),
      unitCost: unitCosts[index] ?? '',
      expiresAt: expiresAts[index] ?? '',
    })),
  };
}

type Payload = ReturnType<typeof receiptPayload>;

function validatePayload(payload: Payload): 'missing' | 'invalid' | 'ok' {
  if (!payload.supplierId || payload.lines.length === 0) return 'missing';

  for (const line of payload.lines) {
    if (!line.productId || !line.lotNumber || !line.expiresAt) return 'missing';

    if (line.lotNumber.length > 50) return 'invalid';
    if (!Number.isSafeInteger(line.quantity) || line.quantity < 1) {
      return 'invalid';
    }
    if (!/^\d+$/.test(line.unitCost) || BigInt(line.unitCost) <= BigInt(0)) {
      return 'invalid';
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(line.expiresAt)) return 'invalid';
  }

  return 'ok';
}

export async function createGoodsReceipt(formData: FormData) {
  await requirePermission('goods_receipts:create', CREATE_PATH);

  const payload = receiptPayload(formData);
  const validation = validatePayload(payload);

  if (validation !== 'ok') {
    redirect(withQuery(CREATE_PATH, { error: validation }));
  }

  let res: Response;
  try {
    res = await authFetch('/goods-receipts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    redirect(withQuery(CREATE_PATH, { error: 'server' }));
  }

  redirectForStatus(res, CREATE_PATH);

  revalidateGoodsReceipts();
  redirect(withQuery(LIST_PATH, { updated: 'created' }));
}

export async function confirmGoodsReceipt(formData: FormData) {
  const id = trimmed(formData.get('receiptId'));
  const back = returnPath(formData.get('returnTo'));

  await requirePermission('goods_receipts:confirm', back);

  if (!id) redirect(withQuery(back, { error: 'missing' }));

  let res: Response;
  try {
    res = await authFetch(`/goods-receipts/${encodeURIComponent(id)}/confirm`, {
      method: 'PATCH',
    });
  } catch {
    redirect(withQuery(back, { error: 'server' }));
  }

  redirectForStatus(res, back);

  revalidateGoodsReceipts(id);
  redirect(withQuery(LIST_PATH, { updated: 'confirmed' }));
}

export async function cancelGoodsReceipt(formData: FormData) {
  const id = trimmed(formData.get('receiptId'));
  const back = returnPath(formData.get('returnTo'));

  await requirePermission('goods_receipts:cancel', back);

  if (!id) redirect(withQuery(back, { error: 'missing' }));

  let res: Response;
  try {
    res = await authFetch(`/goods-receipts/${encodeURIComponent(id)}/cancel`, {
      method: 'PATCH',
    });
  } catch {
    redirect(withQuery(back, { error: 'server' }));
  }

  redirectForStatus(res, back);

  revalidateGoodsReceipts(id);
  redirect(withQuery(LIST_PATH, { updated: 'cancelled' }));
}

/**
 * Tìm sản phẩm theo từ khoá cho ô chọn trong phiếu nhập. Không redirect vì
 * được gọi từ client component trong lúc người dùng đang gõ.
 */
export async function searchProductOptions(
  keyword: string,
): Promise<ProductOption[]> {
  const search = keyword.trim();

  if (!search) return [];

  const user = await fetchCurrentUser();

  if (
    !user ||
    (!user.isSuperAdmin && !hasPermission(user, 'goods_receipts:create'))
  ) {
    return [];
  }

  try {
    const res = await authFetch(
      `/products?deleted=false&search=${encodeURIComponent(search)}&limit=100`,
    );

    if (!res.ok) return [];

    const body = (await res.json()) as { items: ProductOption[] };

    return body.items;
  } catch {
    return [];
  }
}
