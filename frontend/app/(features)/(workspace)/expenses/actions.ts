'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { fetchCurrentUser, hasPermission } from '@/lib/account';
import { authFetch } from '@/lib/auth';
import {
  EXPENSE_CATEGORY_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
} from '@/lib/expenses';

const LIST_PATH = '/expenses';
const CREATE_PATH = `${LIST_PATH}/new`;
const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

function revalidateExpenses(id?: string): void {
  revalidatePath(LIST_PATH);
  revalidatePath('/dashboard');
  if (id) revalidatePath(`${LIST_PATH}/${id}`);
}

function expensePayload(formData: FormData) {
  return {
    name: trimmed(formData.get('name')),
    category: trimmed(formData.get('category')),
    amount: trimmed(formData.get('amount')),
    expenseDate: trimmed(formData.get('expenseDate')),
    supplierId: trimmed(formData.get('supplierId')) || null,
    paymentMethod: trimmed(formData.get('paymentMethod')) || null,
    note: trimmed(formData.get('note')) || null,
  };
}

type Payload = ReturnType<typeof expensePayload>;

function validatePayload(payload: Payload): 'missing' | 'invalid' | 'ok' {
  const values = [
    payload.name,
    payload.category,
    payload.amount,
    payload.expenseDate,
  ];

  if (values.some((value) => !value)) return 'missing';

  if (
    payload.name.length > 255 ||
    !EXPENSE_CATEGORY_OPTIONS.some(
      (option) => option.value === payload.category,
    ) ||
    !/^\d+$/.test(payload.amount) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(payload.expenseDate) ||
    Number.isNaN(Date.parse(payload.expenseDate))
  ) {
    return 'invalid';
  }

  if (payload.supplierId && !UUID_V4.test(payload.supplierId)) {
    return 'invalid';
  }

  if (
    payload.paymentMethod &&
    !PAYMENT_METHOD_OPTIONS.some(
      (option) => option.value === payload.paymentMethod,
    )
  ) {
    return 'invalid';
  }

  if (payload.note && payload.note.length > 2000) return 'invalid';

  return 'ok';
}

export async function createExpense(formData: FormData) {
  await requirePermission('expenses:create', CREATE_PATH);

  const payload = expensePayload(formData);
  const validation = validatePayload(payload);

  if (validation !== 'ok') {
    redirect(withQuery(CREATE_PATH, { error: validation }));
  }

  let res: Response;
  try {
    res = await authFetch('/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    redirect(withQuery(CREATE_PATH, { error: 'server' }));
  }

  redirectForStatus(res, CREATE_PATH);

  revalidateExpenses();
  redirect(withQuery(LIST_PATH, { updated: 'created' }));
}

export async function updateExpense(formData: FormData) {
  const id = trimmed(formData.get('expenseId'));
  const back = returnPath(formData.get('returnTo'));

  await requirePermission('expenses:update', back);

  if (!id) redirect(withQuery(back, { error: 'missing' }));

  const payload = expensePayload(formData);
  const validation = validatePayload(payload);

  if (validation !== 'ok') {
    redirect(withQuery(back, { error: validation }));
  }

  let res: Response;
  try {
    res = await authFetch(`/expenses/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    redirect(withQuery(back, { error: 'server' }));
  }

  redirectForStatus(res, back);

  revalidateExpenses(id);
  redirect(
    withQuery(`${LIST_PATH}/${id}`, { returnTo: back, updated: 'saved' }),
  );
}

async function transitionExpense(
  formData: FormData,
  permission: string,
  action: 'approve' | 'pay-supplier' | 'pay' | 'cancel',
  updated: string,
) {
  const id = trimmed(formData.get('expenseId'));
  const back = returnPath(formData.get('returnTo'));

  await requirePermission(permission, back);

  if (!id) redirect(withQuery(back, { error: 'missing' }));

  let res: Response;
  try {
    res = await authFetch(`/expenses/${encodeURIComponent(id)}/${action}`, {
      method: 'PATCH',
    });
  } catch {
    redirect(withQuery(back, { error: 'server' }));
  }

  redirectForStatus(res, back);

  revalidateExpenses(id);
  redirect(withQuery(back, { updated }));
}

export async function approveExpense(formData: FormData) {
  await transitionExpense(formData, 'expenses:approve', 'approve', 'approved');
}

export async function paySupplierExpense(formData: FormData) {
  await transitionExpense(
    formData,
    'expenses:pay',
    'pay-supplier',
    'supplier_paid',
  );
}

export async function payExpense(formData: FormData) {
  await transitionExpense(formData, 'expenses:pay', 'pay', 'paid');
}

export async function cancelExpense(formData: FormData) {
  await transitionExpense(formData, 'expenses:cancel', 'cancel', 'cancelled');
}
