/* eslint-disable @next/next/no-img-element */
import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { WorkspacePage } from '@/components/layout/WorkspaceShell';
import { FormMessage } from '@/components/roles/FormMessage';
import { fetchCurrentUser, hasPermission } from '@/lib/account';
import { authFetch } from '@/lib/auth';
import { first } from '@/lib/list-filters';
import {
  fetchCategoryOptions,
  formatProductDate,
  isProductDeleted,
  productStateLabel,
  type ProductDetail,
} from '@/lib/products';
import { deleteProduct, restoreProduct, updateProduct } from '../actions';
import { ProductForm } from '../product-form';

const ERROR_MESSAGES: Record<string, string> = {
  missing: 'Thiếu thông tin sản phẩm.',
  forbidden: 'Bạn không có quyền thay đổi sản phẩm.',
  invalid: 'Dữ liệu sản phẩm không hợp lệ. Kiểm tra lại các trường đã nhập.',
  exists: 'Mã SKU đã tồn tại. Đổi mã rồi thử lại.',
  notfound: 'Không tìm thấy sản phẩm.',
  image:
    'Không tải được ảnh. Chọn file JPG, PNG hoặc WebP dưới 5 MB rồi thử lại.',
  server: 'Không lưu được thay đổi. Kiểm tra kết nối rồi thử lại.',
};

const UPDATED_MESSAGES: Record<string, string> = {
  saved: 'Đã cập nhật sản phẩm.',
  deleted: 'Đã xoá sản phẩm. Có thể khôi phục từ danh sách.',
  restored: 'Đã khôi phục sản phẩm.',
};

type DetailQuery = {
  error?: string | string[];
  updated?: string | string[];
  returnTo?: string | string[];
};

async function ProductDetailPageContent({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<DetailQuery>;
}) {
  const user = await fetchCurrentUser();

  if (!user) redirect('/login?next=/products');
  if (!user.isSuperAdmin && !hasPermission(user, 'products:read')) {
    redirect('/dashboard');
  }

  const [{ id }, query] = await Promise.all([params, searchParams]);
  const returnTo = first(query.returnTo);
  const listReturnPath =
    returnTo.startsWith('/products') && !returnTo.startsWith('/products/')
      ? returnTo
      : '/products';

  let res: Response;
  try {
    res = await authFetch(`/products/${encodeURIComponent(id)}`);
  } catch {
    throw new Error('Failed to fetch product: network error');
  }

  if (res.status === 404) notFound();
  if (res.status === 401) {
    redirect(`/login?next=${encodeURIComponent(`/products/${id}`)}`);
  }
  if (res.status === 403) redirect('/dashboard');
  if (!res.ok) throw new Error(`Failed to fetch product: ${res.status}`);

  const product = (await res.json()) as ProductDetail;
  const categories = await fetchCategoryOptions();
  const deleted = isProductDeleted(product);
  const canUpdate = user.isSuperAdmin || hasPermission(user, 'products:update');
  const canDelete = user.isSuperAdmin || hasPermission(user, 'products:delete');
  const locked = !canUpdate || deleted;

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
      title="Chi tiết sản phẩm"
      intro={`Thông tin của ${product.name}.`}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href={listReturnPath}
          className="text-[13px] font-medium text-accent hover:underline"
        >
          ← Danh sách sản phẩm
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {canDelete &&
            (deleted ? (
              <form action={restoreProduct}>
                <input type="hidden" name="productId" value={product.id} />
                <input type="hidden" name="returnTo" value={listReturnPath} />
                <button
                  type="submit"
                  className="border border-accent px-4 py-2.5 text-[13px] font-semibold text-accent transition-colors hover:bg-accent hover:text-paper"
                >
                  Khôi phục
                </button>
              </form>
            ) : (
              <form action={deleteProduct}>
                <input type="hidden" name="productId" value={product.id} />
                <input type="hidden" name="returnTo" value={listReturnPath} />
                <button
                  type="submit"
                  className="border border-rule px-4 py-2.5 text-[13px] font-medium text-muted transition-colors hover:border-red-600 hover:text-red-700"
                >
                  Xoá
                </button>
              </form>
            ))}
        </div>
      </div>

      <FormMessage message={errorMessage} />
      <FormMessage message={updatedMessage} tone="success" />

      {deleted && (
        <div className="mb-6 border border-red-600 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          Sản phẩm này đã được xoá. Khôi phục để tiếp tục chỉnh sửa.
        </div>
      )}

      <section className="border border-rule bg-paper">
        <div className="border-b border-rule px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[15px] font-semibold">Thông tin sản phẩm</h2>
              <p className="mt-1 text-[13px] text-muted">
                Trạng thái: {productStateLabel(deleted)} · Tạo lúc:{' '}
                {formatProductDate(product.createdAt)} · Cập nhật lúc:{' '}
                {formatProductDate(product.updatedAt)}
              </p>
            </div>
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={`Ảnh ${product.name}`}
                width={96}
                height={96}
                className="h-24 w-24 shrink-0 border border-rule object-cover"
              />
            )}
          </div>
        </div>

        <ProductForm
          action={updateProduct}
          values={{
            name: product.name,
            sku: product.sku ?? '',
            unitPrice: product.unitPrice,
            unit: product.unit ?? '',
            description: product.description ?? '',
            imageUrl: product.imageUrl ?? '',
            warning: product.warning ?? '',
            categoryIds: product.categoryIds,
          }}
          categories={categories}
          submitLabel="Lưu thay đổi"
          cancelHref={listReturnPath}
          productId={product.id}
          returnTo={listReturnPath}
          locked={locked}
        />
      </section>
    </WorkspacePage>
  );
}

export default function ProductDetailPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<DetailQuery>;
}) {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <ProductDetailPageContent {...props} />
    </Suspense>
  );
}
