import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { WorkspacePage } from '@/components/layout/WorkspaceShell';
import { ListFilterForm } from '@/components/pagination/ListFilterForm';
import { PageSizeForm } from '@/components/pagination/PageSizeForm';
import { PaginationNav } from '@/components/pagination/PaginationNav';
import { FormMessage } from '@/components/roles/FormMessage';
import { fetchCurrentUser, hasPermission } from '@/lib/account';
import { authFetch } from '@/lib/auth';
import { fetchProductOptions } from '@/lib/categories';
import {
  BATCH_STATUS_FILTERS,
  EXPIRY_FILTERS,
  batchStatusLabel,
  expiryBeforeFromOption,
  formatBatchDate,
  type BatchPage,
} from '@/lib/inventories';
import { first, listApiQuery } from '@/lib/list-filters';
import { listPageHref, parseLimit, parsePage } from '@/lib/pagination';
import { formatVND } from '@/lib/utils';

const TH_CLASS =
  'border-b border-rule py-2 pr-4 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted';
const TD_CLASS = 'border-b border-rule py-4 pr-4 align-top';

const UPDATED_MESSAGES: Record<string, string> = {
  issued: 'Đã xuất kho theo lô.',
  reconciled: 'Đã cập nhật số lô theo kết quả kiểm kê.',
};

type ListQuery = {
  updated?: string | string[];
  search?: string | string[];
  productId?: string | string[];
  status?: string | string[];
  expiresBefore?: string | string[];
  page?: string | string[];
  limit?: string | string[];
};

function StatusCell({ status }: { status: string }) {
  const tone =
    status === 'active'
      ? 'border-emerald-700 text-emerald-800'
      : status === 'out'
        ? 'border-rule text-muted'
        : 'border-red-600 text-red-700';

  return (
    <span
      className={`inline-flex whitespace-nowrap border px-2 py-1 text-[11px] font-semibold ${tone}`}
    >
      {batchStatusLabel(status as 'active' | 'expired' | 'out')}
    </span>
  );
}

async function BatchList({ searchParams }: { searchParams: Promise<ListQuery> }) {
  const user = await fetchCurrentUser();

  if (!user) redirect('/login?next=/inventories/batches');
  if (!user.isSuperAdmin && !hasPermission(user, 'inventories:read')) {
    redirect('/dashboard');
  }

  const query = await searchParams;
  const page = parsePage(first(query.page));
  const limit = parseLimit(first(query.limit));
  const lotNumber = first(query.search).trim();
  const productId = first(query.productId).trim();
  const status = first(query.status);
  const expiryOption = first(query.expiresBefore);
  const expiresBefore = expiryBeforeFromOption(expiryOption);

  const urlFilters = {
    ...(lotNumber ? { search: lotNumber } : {}),
    ...(productId ? { productId } : {}),
    ...(BATCH_STATUS_FILTERS.some((item) => item.value === status) &&
    status !== 'all'
      ? { status }
      : {}),
    ...(EXPIRY_FILTERS.some((item) => item.value === expiryOption) &&
    expiryOption !== ''
      ? { expiresBefore: expiryOption }
      : {}),
  };
  const apiFilters = {
    ...(lotNumber ? { lotNumber } : {}),
    ...(productId ? { productId } : {}),
    ...(urlFilters.status ? { status: urlFilters.status } : {}),
    ...(expiresBefore ? { expiresBefore } : {}),
  };
  const listHref = listPageHref(
    '/inventories/batches',
    page,
    limit,
    urlFilters,
  );

  let res: Response;
  try {
    res = await authFetch(
      `/inventories/batches?${listApiQuery(apiFilters, page, limit)}`,
    );
  } catch {
    throw new Error('Failed to fetch batches: network error');
  }

  if (res.status === 401) {
    redirect(`/login?next=${encodeURIComponent(listHref)}`);
  }
  if (res.status === 403) redirect('/dashboard');
  if (!res.ok) throw new Error(`Failed to fetch batches: ${res.status}`);

  const result = (await res.json()) as BatchPage;
  const totalPages = Math.max(1, Math.ceil(result.total / result.limit));

  if (result.page > totalPages) {
    redirect(
      listPageHref('/inventories/batches', totalPages, limit, urlFilters),
    );
  }

  const productOptions = await fetchProductOptions();
  const productNames = new Map(
    productOptions.map((product) => [
      product.id,
      product.sku ? `${product.name} (${product.sku})` : product.name,
    ]),
  );

  const updated = !query.updated ? undefined : UPDATED_MESSAGES[first(query.updated)];

  return (
    <WorkspacePage
      eyebrow="Không gian làm việc"
      title="Lô hàng"
      intro="Xuất kho và kiểm kê từng lô. Lô hết hạn hoặc đã xuất hết vẫn được giữ lại để đối chiếu."
    >
      <div className="mb-6">
        <Link
          href="/inventories"
          className="text-[13px] font-medium text-accent hover:underline"
        >
          ← Tồn kho
        </Link>
      </div>

      <FormMessage message={updated} tone="success" />

      <ListFilterForm
        action="/inventories/batches"
        limit={limit}
        search={lotNumber}
        searchPlaceholder="Tìm số lô"
        selects={[
          {
            name: 'productId',
            label: 'Sản phẩm',
            options: [
              { value: '', label: 'Tất cả' },
              ...productOptions.map((product) => ({
                value: product.id,
                label: product.sku
                  ? `${product.name} (${product.sku})`
                  : product.name,
              })),
            ],
          },
          {
            name: 'status',
            label: 'Trạng thái',
            options: BATCH_STATUS_FILTERS.map((option) => ({
              value: option.value,
              label: option.label,
            })),
          },
          {
            name: 'expiresBefore',
            label: 'Hạn dùng',
            options: EXPIRY_FILTERS.map((option) => ({
              value: option.value,
              label: option.label,
            })),
          },
        ]}
        values={{ productId, status, expiresBefore: expiryOption }}
      />

      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-4">
        <p className="text-[13px] text-muted">
          {result.total} lô · Trang {result.page}/{totalPages}
        </p>
        <PageSizeForm
          action="/inventories/batches"
          limit={limit}
          filters={urlFilters}
        />
      </div>

      {result.items.length > 0 ? (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse text-[13px]">
            <thead>
              <tr>
                <th className={TH_CLASS}>Sản phẩm</th>
                <th className={TH_CLASS}>Số lô</th>
                <th className={`${TH_CLASS} text-right`}>Tồn</th>
                <th className={`${TH_CLASS} text-right`}>Giá nhập</th>
                <th className={`${TH_CLASS} text-right`}>Giá trị</th>
                <th className={TH_CLASS}>Trạng thái</th>
                <th className={TH_CLASS}>Hạn dùng</th>
                <th className={`${TH_CLASS} text-right`}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((batch) => (
                <tr key={batch.id}>
                  <td className={TD_CLASS}>
                    {productNames.get(batch.productId) ?? '—'}
                  </td>
                  <td className={TD_CLASS}>{batch.lotNumber}</td>
                  <td className={`${TD_CLASS} text-right tabular-nums`}>
                    {batch.quantity}
                  </td>
                  <td className={`${TD_CLASS} text-right tabular-nums`}>
                    {formatVND(Number(batch.unitCost))}
                  </td>
                  <td className={`${TD_CLASS} text-right tabular-nums`}>
                    {formatVND(Number(batch.totalCost))}
                  </td>
                  <td className={TD_CLASS}>
                    <StatusCell status={batch.status} />
                  </td>
                  <td className={`${TD_CLASS} whitespace-nowrap`}>
                    {formatBatchDate(batch.expiresAt)}
                  </td>
                  <td className={`${TD_CLASS} text-right`}>
                    <Link
                      href={`/inventories/batches/${batch.id}?returnTo=${encodeURIComponent(listHref)}`}
                      className="whitespace-nowrap text-[12px] font-medium text-accent hover:underline"
                    >
                      Chi tiết
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-6 text-[13px] leading-6 text-muted">
          Không có lô hàng nào phù hợp với bộ lọc.
        </p>
      )}

      <PaginationNav
        path="/inventories/batches"
        page={result.page}
        limit={limit}
        totalPages={totalPages}
        label="Phân trang lô hàng"
        filters={urlFilters}
      />
    </WorkspacePage>
  );
}

export default function BatchesPage({
  searchParams,
}: {
  searchParams: Promise<ListQuery>;
}) {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <BatchList searchParams={searchParams} />
    </Suspense>
  );
}
