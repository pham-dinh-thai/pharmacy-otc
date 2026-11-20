import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { WorkspacePage } from '@/components/layout/WorkspaceShell';
import { PageSizeForm } from '@/components/pagination/PageSizeForm';
import { PaginationNav } from '@/components/pagination/PaginationNav';
import { fetchCurrentUser, hasPermission } from '@/lib/account';
import { authFetch } from '@/lib/auth';
import { fetchProductOptions } from '@/lib/categories';
import { formatBatchDate, type InventorySummaryPage } from '@/lib/inventories';
import { first, listApiQuery } from '@/lib/list-filters';
import { listPageHref, parseLimit, parsePage } from '@/lib/pagination';
import { formatVND } from '@/lib/utils';

const TH_CLASS =
  'border-b border-rule py-2 pr-4 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted';
const TD_CLASS = 'border-b border-rule py-4 pr-4 align-top';

type ListQuery = {
  search?: string | string[];
  productId?: string | string[];
  page?: string | string[];
  limit?: string | string[];
};

async function InventorySummaryList({
  searchParams,
}: {
  searchParams: Promise<ListQuery>;
}) {
  const user = await fetchCurrentUser();

  if (!user) redirect('/login?next=/inventories');
  if (!user.isSuperAdmin && !hasPermission(user, 'inventories:read')) {
    redirect('/dashboard');
  }

  const query = await searchParams;
  const page = parsePage(first(query.page));
  const limit = parseLimit(first(query.limit));
  const productId = first(query.productId).trim();
  const filters: Record<string, string> = productId ? { productId } : {};
  const listHref = listPageHref('/inventories', page, limit, filters);

  let res: Response;
  try {
    res = await authFetch(`/inventories?${listApiQuery(filters, page, limit)}`);
  } catch {
    throw new Error('Failed to fetch inventory summary: network error');
  }

  if (res.status === 401) {
    redirect(`/login?next=${encodeURIComponent(listHref)}`);
  }
  if (res.status === 403) redirect('/dashboard');
  if (!res.ok) throw new Error(`Failed to fetch inventory summary: ${res.status}`);

  const result = (await res.json()) as InventorySummaryPage;
  const totalPages = Math.max(1, Math.ceil(result.total / result.limit));

  if (result.page > totalPages) {
    redirect(listPageHref('/inventories', totalPages, limit, filters));
  }

  const productOptions = await fetchProductOptions();
  const productNames = new Map(
    productOptions.map((product) => [
      product.id,
      product.sku ? `${product.name} (${product.sku})` : product.name,
    ]),
  );

  return (
    <WorkspacePage
      eyebrow="Không gian làm việc"
      title="Tồn kho"
      intro="Tồn tổng hợp theo sản phẩm. Mở danh sách lô để xuất kho hoặc kiểm kê."
    >
      <form
        method="get"
        action="/inventories"
        className="mt-5 flex flex-wrap items-end gap-3 border-b border-rule pb-4"
      >
        <label className="min-w-[260px] flex-1 text-[13px] text-muted">
          Sản phẩm
          <select
            name="productId"
            defaultValue={productId}
            className="mt-1 w-full border border-rule bg-paper px-3 py-2 text-[13px] focus:border-ink"
          >
            <option value="">Tất cả</option>
            {productOptions.map((product) => (
              <option key={product.id} value={product.id}>
                {product.sku
                  ? `${product.name} (${product.sku})`
                  : product.name}
              </option>
            ))}
          </select>
        </label>
        <input type="hidden" name="limit" value={limit} />
        <button
          type="submit"
          className="border border-ink bg-ink px-4 py-2 text-[13px] font-semibold text-paper transition-colors hover:bg-accent"
        >
          Lọc
        </button>
        {productId && (
          <Link
            href={listPageHref('/inventories', 1, limit)}
            className="px-1 py-2 text-[13px] text-muted hover:text-accent hover:underline"
          >
            Xoá lọc
          </Link>
        )}
      </form>

      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-4">
        <p className="text-[13px] text-muted">
          {result.total} sản phẩm có tồn · Trang {result.page}/{totalPages}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <PageSizeForm action="/inventories" limit={limit} filters={filters} />
          <Link
            href="/inventories/batches"
            className="border border-ink px-4 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-accent"
          >
            Danh sách lô hàng
          </Link>
        </div>
      </div>

      {result.items.length > 0 ? (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-[13px]">
            <thead>
              <tr>
                <th className={TH_CLASS}>Sản phẩm</th>
                <th className={`${TH_CLASS} text-right`}>Tổng tồn</th>
                <th className={`${TH_CLASS} text-right`}>Số lô</th>
                <th className={TH_CLASS}>Hạn dùng gần nhất</th>
                <th className={`${TH_CLASS} text-right`}>Giá trị tồn</th>
                <th className={TH_CLASS}>Cập nhật lúc</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((item) => (
                <tr key={item.productId}>
                  <td className={TD_CLASS}>
                    <Link
                      href={`/inventories/batches?productId=${encodeURIComponent(item.productId)}`}
                      className="font-semibold text-accent hover:underline"
                    >
                      {productNames.get(item.productId) ?? '—'}
                    </Link>
                  </td>
                  <td className={`${TD_CLASS} text-right tabular-nums`}>
                    {item.totalQuantity}
                  </td>
                  <td className={`${TD_CLASS} text-right tabular-nums`}>
                    {item.batchCount}
                  </td>
                  <td className={`${TD_CLASS} whitespace-nowrap`}>
                    {formatBatchDate(item.nearestExpiry)}
                  </td>
                  <td className={`${TD_CLASS} text-right tabular-nums`}>
                    {formatVND(Number(item.stockValue))}
                  </td>
                  <td className={`${TD_CLASS} whitespace-nowrap text-muted`}>
                    {formatBatchDate(item.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-6 text-[13px] leading-6 text-muted">
          Chưa có lô hàng nào trong kho, hoặc sản phẩm không có tồn.
        </p>
      )}

      <PaginationNav
        path="/inventories"
        page={result.page}
        limit={limit}
        totalPages={totalPages}
        label="Phân trang tồn kho"
        filters={filters}
      />
    </WorkspacePage>
  );
}

export default function InventoriesPage({
  searchParams,
}: {
  searchParams: Promise<ListQuery>;
}) {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <InventorySummaryList searchParams={searchParams} />
    </Suspense>
  );
}
