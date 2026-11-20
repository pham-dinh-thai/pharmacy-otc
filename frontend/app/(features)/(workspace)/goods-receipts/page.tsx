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
import {
  GOODS_RECEIPT_STATUS_FILTERS,
  fetchSupplierOptions,
  formatReceiptDate,
  goodsReceiptStatusLabel,
  type GoodsReceiptPage,
  type GoodsReceiptStatus,
} from '@/lib/goods-receipts';
import { first, listApiQuery } from '@/lib/list-filters';
import { listPageHref, parseLimit, parsePage } from '@/lib/pagination';
import { formatVND } from '@/lib/utils';
import { cancelGoodsReceipt, confirmGoodsReceipt } from './actions';

const TH_CLASS =
  'border-b border-rule py-2 pr-4 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted';
const TD_CLASS = 'border-b border-rule py-4 pr-4 align-top';

const ERROR_MESSAGES: Record<string, string> = {
  missing: 'Thiếu thông tin phiếu nhập.',
  forbidden: 'Bạn không có quyền thay đổi phiếu nhập.',
  invalid: 'Dữ liệu phiếu nhập không hợp lệ. Kiểm tra lại các trường đã nhập.',
  conflict: 'Phiếu không còn ở trạng thái cho phép thao tác, hoặc dòng nhập bị trùng.',
  notfound: 'Không tìm thấy phiếu nhập.',
  server: 'Không lưu được thay đổi. Kiểm tra kết nối rồi thử lại.',
};

const UPDATED_MESSAGES: Record<string, string> = {
  created: 'Đã tạo phiếu nhập.',
  confirmed: 'Đã xác nhận phiếu nhập. Lô hàng đã được nhập kho.',
  cancelled: 'Đã huỷ phiếu nhập.',
};

type ListQuery = {
  error?: string | string[];
  updated?: string | string[];
  search?: string | string[];
  status?: string | string[];
  supplierId?: string | string[];
  page?: string | string[];
  limit?: string | string[];
};

function StatusCell({ status }: { status: GoodsReceiptStatus }) {
  const tone =
    status === 'confirmed'
      ? 'border-emerald-700 text-emerald-800'
      : status === 'cancelled'
        ? 'border-red-600 text-red-700'
        : 'border-amber-700 text-amber-800';

  return (
    <span
      className={`inline-flex whitespace-nowrap border px-2 py-1 text-[11px] font-semibold ${tone}`}
    >
      {goodsReceiptStatusLabel(status)}
    </span>
  );
}

async function GoodsReceiptsList({
  searchParams,
}: {
  searchParams: Promise<ListQuery>;
}) {
  const user = await fetchCurrentUser();

  if (!user) redirect('/login?next=/goods-receipts');
  if (!user.isSuperAdmin && !hasPermission(user, 'goods_receipts:read')) {
    redirect('/dashboard');
  }

  const query = await searchParams;
  const page = parsePage(first(query.page));
  const limit = parseLimit(first(query.limit));
  const search = first(query.search).trim();
  const status = first(query.status);
  const supplierId = first(query.supplierId).trim();
  const filters = {
    ...(search ? { search } : {}),
    ...(GOODS_RECEIPT_STATUS_FILTERS.some((item) => item.value === status) &&
    status !== 'all'
      ? { status }
      : {}),
    ...(supplierId ? { supplierId } : {}),
  };
  const listHref = listPageHref('/goods-receipts', page, limit, filters);
  const detailHref = (id: string) =>
    `/goods-receipts/${id}?returnTo=${encodeURIComponent(listHref)}`;

  let res: Response;
  try {
    res = await authFetch(`/goods-receipts?${listApiQuery(filters, page, limit)}`);
  } catch {
    throw new Error('Failed to fetch goods receipts: network error');
  }

  if (res.status === 401) {
    redirect(`/login?next=${encodeURIComponent(listHref)}`);
  }
  if (res.status === 403) redirect('/dashboard');
  if (!res.ok) throw new Error(`Failed to fetch goods receipts: ${res.status}`);

  const result = (await res.json()) as GoodsReceiptPage;
  const totalPages = Math.max(1, Math.ceil(result.total / result.limit));

  if (result.page > totalPages) {
    redirect(listPageHref('/goods-receipts', totalPages, limit, filters));
  }

  const supplierOptions = await fetchSupplierOptions();
  const supplierNames = new Map(
    supplierOptions.map((supplier) => [supplier.id, supplier.name]),
  );

  const canCreate =
    user.isSuperAdmin || hasPermission(user, 'goods_receipts:create');
  const canConfirm =
    user.isSuperAdmin || hasPermission(user, 'goods_receipts:confirm');
  const canCancel =
    user.isSuperAdmin || hasPermission(user, 'goods_receipts:cancel');

  const errorMessage = query.error
    ? (ERROR_MESSAGES[first(query.error)] ?? ERROR_MESSAGES.server)
    : undefined;
  const updatedMessage =
    !query.error && query.updated
      ? UPDATED_MESSAGES[first(query.updated)]
      : undefined;

  return (
    <WorkspacePage
      eyebrow="Không gian làm việc"
      title="Phiếu nhập"
      intro="Theo dõi phiếu nhập, xác nhận lô hàng và cập nhật tồn kho."
    >
      <FormMessage message={errorMessage} />
      <FormMessage message={updatedMessage} tone="success" />

      <ListFilterForm
        action="/goods-receipts"
        limit={limit}
        search={search}
        searchPlaceholder="Mã phiếu (GR-0001)"
        selects={[
          {
            name: 'status',
            label: 'Trạng thái',
            options: GOODS_RECEIPT_STATUS_FILTERS.map((option) => ({
              value: option.value,
              label: option.label,
            })),
          },
          {
            name: 'supplierId',
            label: 'Nhà cung cấp',
            options: [
              { value: '', label: 'Tất cả' },
              ...supplierOptions.map((supplier) => ({
                value: supplier.id,
                label: supplier.name,
              })),
            ],
          },
        ]}
        values={{ status, supplierId }}
      />

      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-4">
        <p className="text-[13px] text-muted">
          {result.total} phiếu · Trang {result.page}/{totalPages}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <PageSizeForm
            action="/goods-receipts"
            limit={limit}
            filters={filters}
          />

          {canCreate && (
            <Link
              href="/goods-receipts/new"
              className="bg-accent px-4 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-ink"
            >
              Tạo phiếu nhập
            </Link>
          )}
        </div>
      </div>

      {result.items.length > 0 ? (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse text-[13px]">
            <thead>
              <tr>
                <th className={TH_CLASS}>Mã phiếu</th>
                <th className={TH_CLASS}>Nhà cung cấp</th>
                <th className={TH_CLASS}>Trạng thái</th>
                <th className={`${TH_CLASS} text-right`}>Dòng</th>
                <th className={`${TH_CLASS} text-right`}>Tổng SL</th>
                <th className={`${TH_CLASS} text-right`}>Tổng tiền</th>
                <th className={TH_CLASS}>Tạo lúc</th>
                <th className={`${TH_CLASS} text-right`}>Hành động</th>
              </tr>
            </thead>

            <tbody>
              {result.items.map((receipt) => (
                <tr key={receipt.id}>
                  <td className={TD_CLASS}>
                    <Link
                      href={detailHref(receipt.id)}
                      className="font-semibold text-accent hover:underline"
                    >
                      {receipt.code}
                    </Link>
                  </td>
                  <td className={TD_CLASS}>
                    {supplierNames.get(receipt.supplierId) ?? '—'}
                  </td>
                  <td className={TD_CLASS}>
                    <StatusCell status={receipt.status} />
                  </td>
                  <td className={`${TD_CLASS} text-right tabular-nums`}>
                    {receipt.lineCount}
                  </td>
                  <td className={`${TD_CLASS} text-right tabular-nums`}>
                    {receipt.totalQuantity}
                  </td>
                  <td className={`${TD_CLASS} whitespace-nowrap text-right tabular-nums`}>
                    {formatVND(Number(receipt.totalCost))}
                  </td>
                  <td className={`${TD_CLASS} whitespace-nowrap text-muted`}>
                    {formatReceiptDate(receipt.createdAt)}
                  </td>
                  <td className={`${TD_CLASS} text-right`}>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Link
                        href={detailHref(receipt.id)}
                        className="whitespace-nowrap text-[12px] font-medium text-accent hover:underline"
                      >
                        Chi tiết
                      </Link>

                      {receipt.status === 'pending' && canConfirm && (
                        <form action={confirmGoodsReceipt}>
                          <input
                            type="hidden"
                            name="receiptId"
                            value={receipt.id}
                          />
                          <input
                            type="hidden"
                            name="returnTo"
                            value={listHref}
                          />
                          <button
                            type="submit"
                            className="whitespace-nowrap border border-accent px-2.5 py-1 text-[12px] font-medium text-accent transition-colors hover:bg-accent hover:text-paper"
                          >
                            Xác nhận
                          </button>
                        </form>
                      )}

                      {receipt.status === 'pending' && canCancel && (
                        <form action={cancelGoodsReceipt}>
                          <input
                            type="hidden"
                            name="receiptId"
                            value={receipt.id}
                          />
                          <input
                            type="hidden"
                            name="returnTo"
                            value={listHref}
                          />
                          <button
                            type="submit"
                            className="whitespace-nowrap border border-rule px-2.5 py-1 text-[12px] text-muted transition-colors hover:border-red-600 hover:text-red-700"
                          >
                            Huỷ
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-6 text-[13px] leading-6 text-muted">
          Không có phiếu nhập nào phù hợp với bộ lọc.
        </p>
      )}

      <PaginationNav
        path="/goods-receipts"
        page={result.page}
        limit={limit}
        totalPages={totalPages}
        label="Phân trang phiếu nhập"
        filters={filters}
      />
    </WorkspacePage>
  );
}

export default function GoodsReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<ListQuery>;
}) {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <GoodsReceiptsList searchParams={searchParams} />
    </Suspense>
  );
}
