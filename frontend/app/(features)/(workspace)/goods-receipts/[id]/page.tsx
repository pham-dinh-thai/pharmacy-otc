import { Suspense } from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { WorkspacePage } from '@/components/layout/WorkspaceShell';
import { FormMessage } from '@/components/roles/FormMessage';
import { fetchCurrentUser, hasPermission } from '@/lib/account';
import { fetchProductOptions } from '@/lib/categories';
import { authFetch } from '@/lib/auth';
import {
  fetchSupplierOptions,
  formatExpiryDate,
  formatReceiptDate,
  goodsReceiptStatusLabel,
  type GoodsReceiptStatus,
  type GoodsReceiptDetail,
} from '@/lib/goods-receipts';
import { first } from '@/lib/list-filters';
import { formatVND } from '@/lib/utils';
import { cancelGoodsReceipt, confirmGoodsReceipt } from '../actions';

const TH_CLASS =
  'border-b border-rule py-2 pr-4 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted';
const TD_CLASS = 'border-b border-rule py-3 pr-4 align-top';

const ERROR_MESSAGES: Record<string, string> = {
  forbidden: 'Bạn không có quyền thay đổi phiếu nhập.',
  conflict: 'Phiếu không còn ở trạng thái chờ xác nhận.',
  notfound: 'Không tìm thấy phiếu nhập.',
  server: 'Không lưu được thay đổi. Kiểm tra kết nối rồi thử lại.',
};

const UPDATED_MESSAGES: Record<string, string> = {
  confirmed: 'Đã xác nhận phiếu nhập. Lô hàng đã được nhập kho.',
  cancelled: 'Đã huỷ phiếu nhập.',
};

type DetailQuery = {
  error?: string | string[];
  updated?: string | string[];
  returnTo?: string | string[];
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

async function GoodsReceiptDetailContent({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<DetailQuery>;
}) {
  const user = await fetchCurrentUser();

  if (!user) redirect('/login?next=/goods-receipts');
  if (!user.isSuperAdmin && !hasPermission(user, 'goods_receipts:read')) {
    redirect('/dashboard');
  }

  const [{ id }, query] = await Promise.all([params, searchParams]);
  const returnTo = first(query.returnTo);
  const listReturnPath =
    returnTo.startsWith('/goods-receipts') &&
    !returnTo.startsWith('/goods-receipts/')
      ? returnTo
      : '/goods-receipts';

  let res: Response;
  try {
    res = await authFetch(`/goods-receipts/${encodeURIComponent(id)}`);
  } catch {
    throw new Error('Failed to fetch goods receipt: network error');
  }

  if (res.status === 404) notFound();
  if (res.status === 401) {
    redirect(`/login?next=${encodeURIComponent(`/goods-receipts/${id}`)}`);
  }
  if (res.status === 403) redirect('/dashboard');
  if (!res.ok) throw new Error(`Failed to fetch goods receipt: ${res.status}`);

  const receipt = (await res.json()) as GoodsReceiptDetail;
  const [supplierOptions, productOptions] = await Promise.all([
    fetchSupplierOptions(),
    fetchProductOptions(),
  ]);
  const supplierName =
    supplierOptions.find((supplier) => supplier.id === receipt.supplierId)
      ?.name ?? '—';
  const productNames = new Map(
    productOptions.map((product) => [
      product.id,
      product.sku ? `${product.name} (${product.sku})` : product.name,
    ]),
  );
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
      title={`Chi tiết phiếu ${receipt.code}`}
      intro={`${supplierName} · ${formatReceiptDate(receipt.createdAt)}.`}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href={listReturnPath}
          className="text-[13px] font-medium text-accent hover:underline"
        >
          ← Danh sách phiếu nhập
        </Link>

        {receipt.status === 'pending' && (canConfirm || canCancel) && (
          <div className="flex flex-wrap items-center gap-2">
            {canConfirm && (
              <form action={confirmGoodsReceipt}>
                <input type="hidden" name="receiptId" value={receipt.id} />
                <input type="hidden" name="returnTo" value={listReturnPath} />
                <button
                  type="submit"
                  className="bg-accent px-4 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-ink"
                >
                  Xác nhận nhập kho
                </button>
              </form>
            )}

            {canCancel && (
              <form action={cancelGoodsReceipt}>
                <input type="hidden" name="receiptId" value={receipt.id} />
                <input type="hidden" name="returnTo" value={listReturnPath} />
                <button
                  type="submit"
                  className="border border-rule px-4 py-2.5 text-[13px] font-medium text-muted transition-colors hover:border-red-600 hover:text-red-700"
                >
                  Huỷ phiếu
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      <FormMessage message={errorMessage} />
      <FormMessage message={updatedMessage} tone="success" />

      <section className="border border-rule bg-paper">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-6 py-4">
          <div>
            <h2 className="text-[15px] font-semibold">Thông tin phiếu</h2>
            <p className="mt-1 text-[13px] text-muted">
              Tạo lúc {formatReceiptDate(receipt.createdAt)} · Cập nhật lúc{' '}
              {formatReceiptDate(receipt.updatedAt)}
            </p>
          </div>
          <StatusCell status={receipt.status} />
        </div>

        <dl className="grid gap-x-8 gap-y-4 px-6 py-5 text-[13px] md:grid-cols-3">
          <div>
            <dt className="text-muted">Nhà cung cấp</dt>
            <dd className="mt-1 font-medium">{supplierName}</dd>
          </div>
          <div>
            <dt className="text-muted">Tổng số lượng</dt>
            <dd className="mt-1 font-medium tabular-nums">
              {receipt.totalQuantity}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Tổng tiền nhập</dt>
            <dd className="mt-1 font-medium tabular-nums">
              {formatVND(Number(receipt.totalCost))}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Người tạo</dt>
            <dd className="mt-1 break-all font-mono text-[12px]">
              {receipt.createdBy}
            </dd>
          </div>
          {receipt.confirmedAt && (
            <div>
              <dt className="text-muted">Xác nhận lúc</dt>
              <dd className="mt-1">{formatReceiptDate(receipt.confirmedAt)}</dd>
            </div>
          )}
          {receipt.cancelledAt && (
            <div>
              <dt className="text-muted">Huỷ lúc</dt>
              <dd className="mt-1">{formatReceiptDate(receipt.cancelledAt)}</dd>
            </div>
          )}
        </dl>
      </section>

      <section className="mt-8 border border-rule bg-paper">
        <div className="border-b border-rule px-6 py-4">
          <h2 className="text-[15px] font-semibold">Dòng nhập ({receipt.lineCount})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-[13px]">
            <thead>
              <tr>
                <th className={TH_CLASS}>Sản phẩm</th>
                <th className={TH_CLASS}>Số lô</th>
                <th className={`${TH_CLASS} text-right`}>Số lượng</th>
                <th className={`${TH_CLASS} text-right`}>Giá nhập</th>
                <th className={`${TH_CLASS} text-right`}>Thành tiền</th>
                <th className={TH_CLASS}>Hạn dùng</th>
                <th className={TH_CLASS}>Lô kho</th>
              </tr>
            </thead>
            <tbody>
              {receipt.lines.map((line) => (
                <tr key={line.id}>
                  <td className={TD_CLASS}>
                    {productNames.get(line.productId) ?? '—'}
                  </td>
                  <td className={TD_CLASS}>{line.lotNumber}</td>
                  <td className={`${TD_CLASS} text-right tabular-nums`}>
                    {line.quantity}
                  </td>
                  <td className={`${TD_CLASS} text-right tabular-nums`}>
                    {formatVND(Number(line.unitCost))}
                  </td>
                  <td className={`${TD_CLASS} text-right tabular-nums`}>
                    {formatVND(Number(line.totalCost))}
                  </td>
                  <td className={`${TD_CLASS} whitespace-nowrap`}>
                    {formatExpiryDate(line.expiresAt)}
                  </td>
                  <td className={`${TD_CLASS} break-all font-mono text-[11px] text-muted`}>
                    {line.batchId ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </WorkspacePage>
  );
}

export default function GoodsReceiptDetailPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<DetailQuery>;
}) {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <GoodsReceiptDetailContent {...props} />
    </Suspense>
  );
}
