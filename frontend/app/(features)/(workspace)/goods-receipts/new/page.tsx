import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { WorkspacePage } from '@/components/layout/WorkspaceShell';
import { FormMessage } from '@/components/roles/FormMessage';
import { fetchCurrentUser, hasPermission } from '@/lib/account';
import { fetchProductOptions } from '@/lib/categories';
import { fetchSupplierOptions } from '@/lib/goods-receipts';
import { first } from '@/lib/list-filters';
import { createGoodsReceipt } from '../actions';
import { GoodsReceiptForm } from '../goods-receipt-form';

const ERROR_MESSAGES: Record<string, string> = {
  missing: 'Chọn nhà cung cấp và điền đủ thông tin cho mỗi dòng nhập.',
  invalid: 'Dữ liệu phiếu nhập không hợp lệ. Kiểm tra số lượng, giá và hạn dùng.',
  conflict: 'Sản phẩm và số lô bị trùng trong cùng một phiếu.',
  forbidden: 'Bạn không có quyền tạo phiếu nhập.',
  notfound: 'Không tìm thấy nhà cung cấp hoặc sản phẩm.',
  server: 'Không tạo được phiếu nhập. Kiểm tra kết nối rồi thử lại.',
};

type NewQuery = {
  error?: string | string[];
};

async function NewGoodsReceiptForm({
  searchParams,
}: {
  searchParams: Promise<NewQuery>;
}) {
  const user = await fetchCurrentUser();

  if (!user) redirect('/login?next=/goods-receipts/new');
  if (!user.isSuperAdmin && !hasPermission(user, 'goods_receipts:create')) {
    redirect('/dashboard');
  }

  const query = await searchParams;
  const rawError = first(query.error);
  const errorMessage = rawError
    ? (ERROR_MESSAGES[rawError] ?? ERROR_MESSAGES.server)
    : undefined;

  const [supplierOptions, productOptions] = await Promise.all([
    fetchSupplierOptions(),
    fetchProductOptions(),
  ]);

  return (
    <WorkspacePage
      eyebrow="Không gian làm việc"
      title="Tạo phiếu nhập"
      intro="Lập phiếu ở trạng thái chờ xác nhận. Lô hàng chỉ nhập kho sau khi phiếu được xác nhận."
    >
      <div className="mb-6">
        <Link
          href="/goods-receipts"
          className="text-[13px] font-medium text-accent hover:underline"
        >
          ← Danh sách phiếu nhập
        </Link>
      </div>

      <FormMessage message={errorMessage} />

      {productOptions.length === 0 || supplierOptions.length === 0 ? (
        <div className="border border-rule bg-paper px-6 py-5 text-[13px] leading-6 text-muted">
          Cần có ít nhất một nhà cung cấp và một sản phẩm đang hoạt động trước
          khi lập phiếu nhập.
        </div>
      ) : (
        <section className="border border-rule bg-paper">
          <div className="border-b border-rule px-6 py-4">
            <h2 className="text-[15px] font-semibold">Thông tin phiếu nhập</h2>
            <p className="mt-1 text-[13px] text-muted">
              Mã phiếu được sinh tự động sau khi lưu.
            </p>
          </div>

          <GoodsReceiptForm
            action={createGoodsReceipt}
            supplierOptions={supplierOptions}
            productOptions={productOptions}
            submitLabel="Tạo phiếu nhập"
            cancelHref="/goods-receipts"
          />
        </section>
      )}
    </WorkspacePage>
  );
}

export default function NewGoodsReceiptPage({
  searchParams,
}: {
  searchParams: Promise<NewQuery>;
}) {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <NewGoodsReceiptForm searchParams={searchParams} />
    </Suspense>
  );
}
