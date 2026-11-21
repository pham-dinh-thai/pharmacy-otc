import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { WorkspacePage } from '@/components/layout/WorkspaceShell';
import { FormMessage } from '@/components/roles/FormMessage';
import { fetchCurrentUser, hasPermission } from '@/lib/account';
import { fetchCategoryOptions } from '@/lib/products';
import { createProduct } from '../actions';
import { EMPTY_PRODUCT_FORM, ProductForm } from '../product-form';

const ERROR_MESSAGES: Record<string, string> = {
  missing: 'Nhập đầy đủ tên sản phẩm, đơn giá và số lượng tồn.',
  invalid: 'Dữ liệu sản phẩm không hợp lệ. Kiểm tra lại các trường đã nhập.',
  exists: 'Mã SKU đã tồn tại. Đổi mã rồi thử lại.',
  forbidden: 'Bạn không có quyền tạo sản phẩm.',
  notfound: 'Không tìm thấy danh mục đã chọn.',
  image:
    'Không tải được ảnh. Chọn file JPG, PNG hoặc WebP dưới 5 MB rồi thử lại.',
  server: 'Không tạo được sản phẩm. Kiểm tra kết nối rồi thử lại.',
};

async function NewProductForm({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const user = await fetchCurrentUser();

  if (!user) redirect('/login?next=/products/new');
  if (!user.isSuperAdmin && !hasPermission(user, 'products:create')) {
    redirect('/dashboard');
  }

  const query = await searchParams;
  const rawError = Array.isArray(query.error) ? query.error[0] : query.error;
  const errorMessage = rawError
    ? (ERROR_MESSAGES[rawError] ?? ERROR_MESSAGES.server)
    : undefined;

  const categories = await fetchCategoryOptions();

  return (
    <WorkspacePage
      eyebrow="Không gian làm việc"
      title="Thêm sản phẩm"
      intro="Tạo sản phẩm mới, nhập đơn giá VND và chọn các danh mục liên kết."
    >
      <div className="mb-6">
        <Link
          href="/products"
          className="text-[13px] font-medium text-accent hover:underline"
        >
          ← Danh sách sản phẩm
        </Link>
      </div>

      <FormMessage message={errorMessage} />

      <section className="border border-rule bg-paper">
        <div className="border-b border-rule px-6 py-4">
          <h2 className="text-[15px] font-semibold">Thông tin sản phẩm</h2>
          <p className="mt-1 text-[13px] text-muted">
            Có thể tạo sản phẩm không gắn danh mục nếu chưa có danh mục hoạt
            động.
          </p>
        </div>

        <ProductForm
          action={createProduct}
          values={EMPTY_PRODUCT_FORM}
          categories={categories}
          submitLabel="Tạo sản phẩm"
          cancelHref="/products"
        />
      </section>
    </WorkspacePage>
  );
}

export default function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <NewProductForm searchParams={searchParams} />
    </Suspense>
  );
}
