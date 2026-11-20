import { Suspense } from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { WorkspacePage } from '@/components/layout/WorkspaceShell';
import { FormMessage } from '@/components/roles/FormMessage';
import { fetchCurrentUser, hasPermission } from '@/lib/account';
import { authFetch } from '@/lib/auth';
import { fetchProductOptions } from '@/lib/categories';
import {
  BATCH_STATUS_FILTERS,
  batchStatusLabel,
  formatBatchDate,
  type BatchDetail,
  type BatchStatus,
} from '@/lib/inventories';
import { first } from '@/lib/list-filters';
import { formatVND } from '@/lib/utils';
import { issueBatchStock, reconcileBatchStock } from '../../actions';

const INPUT_CLASS =
  'mt-1 w-full border border-rule bg-paper px-3 py-2.5 text-[13px] focus:border-ink';
const LABEL_CLASS = 'block text-[12px] font-medium text-muted';

const ERROR_MESSAGES: Record<string, string> = {
  forbidden: 'Bạn không có quyền thay đổi lô hàng.',
  invalid: 'Số lượng không hợp lệ. Kiểm tra lại ô nhập.',
  conflict: 'Lô hàng không đủ tồn để xuất, hoặc trạng thái lô đã thay đổi.',
  notfound: 'Không tìm thấy lô hàng.',
  server: 'Không lưu được thay đổi. Kiểm tra kết nối rồi thử lại.',
};

const UPDATED_MESSAGES: Record<string, string> = {
  issued: 'Đã xuất kho theo lô.',
  reconciled: 'Đã cập nhật số lô theo kết quả kiểm kê.',
};

type DetailQuery = {
  error?: string | string[];
  updated?: string | string[];
  returnTo?: string | string[];
};

function StatusCell({ status }: { status: BatchStatus }) {
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
      {batchStatusLabel(status)}
    </span>
  );
}

async function BatchDetailContent({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<DetailQuery>;
}) {
  const user = await fetchCurrentUser();

  if (!user) redirect('/login?next=/inventories/batches');
  if (!user.isSuperAdmin && !hasPermission(user, 'inventories:read')) {
    redirect('/dashboard');
  }

  const [{ id }, query] = await Promise.all([params, searchParams]);
  const returnTo = first(query.returnTo);
  const listReturnPath =
    returnTo.startsWith('/inventories/batches') &&
    !returnTo.startsWith('/inventories/batches/')
      ? returnTo
      : '/inventories/batches';

  let res: Response;
  try {
    res = await authFetch(`/inventories/batches/${encodeURIComponent(id)}`);
  } catch {
    throw new Error('Failed to fetch batch: network error');
  }

  if (res.status === 404) notFound();
  if (res.status === 401) {
    redirect(`/login?next=${encodeURIComponent(`/inventories/batches/${id}`)}`);
  }
  if (res.status === 403) redirect('/dashboard');
  if (!res.ok) throw new Error(`Failed to fetch batch: ${res.status}`);

  const batch = (await res.json()) as BatchDetail;
  const productOptions = await fetchProductOptions();
  const productName =
    productOptions.find((product) => product.id === batch.productId)?.name ??
    '—';
  const canIssue = user.isSuperAdmin || hasPermission(user, 'inventories:issue');
  const canReconcile =
    user.isSuperAdmin || hasPermission(user, 'inventories:reconcile');

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
      title={`Chi tiết lô ${batch.lotNumber}`}
      intro={`${productName} · Hạn dùng ${formatBatchDate(batch.expiresAt)}.`}
    >
      <div className="mb-6">
        <Link
          href={listReturnPath}
          className="text-[13px] font-medium text-accent hover:underline"
        >
          ← Danh sách lô hàng
        </Link>
      </div>

      <FormMessage message={errorMessage} />
      <FormMessage message={updatedMessage} tone="success" />

      <section className="border border-rule bg-paper">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-6 py-4">
          <div>
            <h2 className="text-[15px] font-semibold">Thông tin lô</h2>
            <p className="mt-1 text-[13px] text-muted">
              Cập nhật lúc {formatBatchDate(batch.updatedAt)}
            </p>
          </div>
          <StatusCell status={batch.status} />
        </div>

        <dl className="grid gap-x-8 gap-y-4 px-6 py-5 text-[13px] md:grid-cols-3">
          <div>
            <dt className="text-muted">Số lượng tồn</dt>
            <dd className="mt-1 font-semibold tabular-nums">{batch.quantity}</dd>
          </div>
          <div>
            <dt className="text-muted">Giá nhập</dt>
            <dd className="mt-1 font-medium tabular-nums">
              {formatVND(Number(batch.unitCost))}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Giá trị lô</dt>
            <dd className="mt-1 font-medium tabular-nums">
              {formatVND(Number(batch.totalCost))}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Hạn dùng</dt>
            <dd className="mt-1">{formatBatchDate(batch.expiresAt)}</dd>
          </div>
          <div>
            <dt className="text-muted">Trạng thái</dt>
            <dd className="mt-1">
              {BATCH_STATUS_FILTERS.find((item) => item.value === batch.status)
                ?.label ?? batch.status}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Người tạo</dt>
            <dd className="mt-1 break-all font-mono text-[12px]">
              {batch.createdBy}
            </dd>
          </div>
        </dl>
      </section>

      {(canIssue || canReconcile) && (
        <section className="mt-8 grid gap-6 md:grid-cols-2">
          {canIssue && (
            <form
              action={issueBatchStock}
              className="border border-rule bg-paper p-6"
            >
              <h3 className="text-[14px] font-semibold">Xuất kho theo lô</h3>
              <p className="mt-1 text-[12px] leading-5 text-muted">
                Giảm tồn lô này đi một số lượng. Không được vượt quá tồn hiện có.
              </p>
              <input type="hidden" name="productId" value={batch.productId} />
              <input type="hidden" name="batchId" value={batch.id} />
              <input type="hidden" name="returnTo" value={listReturnPath} />
              <label className={`mt-5 ${LABEL_CLASS}`} htmlFor="issue-quantity">
                Số lượng xuất
              </label>
              <input
                id="issue-quantity"
                name="quantity"
                type="number"
                min={1}
                step={1}
                max={batch.quantity}
                required
                placeholder="0"
                className={INPUT_CLASS}
              />
              <button
                type="submit"
                className="mt-5 w-full bg-accent px-4 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-ink"
              >
                Xuất kho
              </button>
            </form>
          )}

          {canReconcile && (
            <form
              action={reconcileBatchStock}
              className="border border-rule bg-paper p-6"
            >
              <h3 className="text-[14px] font-semibold">Kiểm kê lô</h3>
              <p className="mt-1 text-[12px] leading-5 text-muted">
                Nhập số lượng đếm thực tế. Tồn lô sẽ được chỉnh về con số này.
              </p>
              <input type="hidden" name="productId" value={batch.productId} />
              <input type="hidden" name="batchId" value={batch.id} />
              <input type="hidden" name="returnTo" value={listReturnPath} />
              <label
                className={`mt-5 ${LABEL_CLASS}`}
                htmlFor="reconcile-quantity"
              >
                Số lượng đếm được
              </label>
              <input
                id="reconcile-quantity"
                name="quantity"
                type="number"
                min={0}
                step={1}
                required
                placeholder="0"
                className={INPUT_CLASS}
              />
              <button
                type="submit"
                className="mt-5 w-full border border-ink px-4 py-2.5 text-[13px] font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
              >
                Lưu kiểm kê
              </button>
            </form>
          )}
        </section>
      )}
    </WorkspacePage>
  );
}

export default function BatchDetailPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<DetailQuery>;
}) {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <BatchDetailContent {...props} />
    </Suspense>
  );
}
