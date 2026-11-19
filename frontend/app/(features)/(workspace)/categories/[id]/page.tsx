import { Suspense } from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { WorkspacePage } from '@/components/layout/WorkspaceShell';
import { FormMessage } from '@/components/roles/FormMessage';
import { fetchCurrentUser, hasPermission } from '@/lib/account';
import { authFetch } from '@/lib/auth';
import {
  categoryStateLabel,
  fetchProductOptions,
  formatCategoryDate,
  isCategoryDeleted,
  type CategoryDetail,
} from '@/lib/categories';
import { first } from '@/lib/list-filters';
import { deleteCategory, restoreCategory, updateCategory } from '../actions';
import { CategoryForm } from '../category-form';

const ERROR_MESSAGES: Record<string, string> = {
  missing: 'Thiếu thông tin danh mục.',
  invalid: 'Dữ liệu danh mục không hợp lệ. Kiểm tra lại các trường đã nhập.',
  exists: 'Tên hoặc slug danh mục đã tồn tại.',
  forbidden: 'Bạn không có quyền thay đổi danh mục.',
  notfound: 'Không tìm thấy danh mục.',
  server: 'Không lưu được thay đổi. Kiểm tra kết nối rồi thử lại.',
};

const UPDATED_MESSAGES: Record<string, string> = {
  saved: 'Đã cập nhật danh mục.',
  deleted: 'Đã xoá danh mục. Có thể khôi phục từ danh sách.',
  restored: 'Đã khôi phục danh mục.',
};

type DetailQuery = {
  error?: string | string[];
  updated?: string | string[];
  returnTo?: string | string[];
};

async function CategoryDetailContent({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<DetailQuery>;
}) {
  const user = await fetchCurrentUser();

  if (!user) redirect('/login?next=/categories');
  if (!user.isSuperAdmin && !hasPermission(user, 'categories:read')) {
    redirect('/dashboard');
  }

  const [{ id }, query] = await Promise.all([params, searchParams]);
  const returnTo = first(query.returnTo);
  const listReturnPath =
    returnTo.startsWith('/categories') && !returnTo.startsWith('/categories/')
      ? returnTo
      : '/categories';

  let res: Response;
  try {
    res = await authFetch(`/categories/${encodeURIComponent(id)}`);
  } catch {
    throw new Error('Failed to fetch category: network error');
  }

  if (res.status === 404) notFound();
  if (res.status === 401) {
    redirect(`/login?next=${encodeURIComponent(`/categories/${id}`)}`);
  }
  if (res.status === 403) redirect('/dashboard');
  if (!res.ok) throw new Error(`Failed to fetch category: ${res.status}`);

  const category = (await res.json()) as CategoryDetail;
  const productOptions = await fetchProductOptions();
  const productNames = new Map(
    productOptions.map((product) => [
      product.id,
      product.sku ? `${product.name} (${product.sku})` : product.name,
    ]),
  );
  const deleted = isCategoryDeleted(category);
  const canUpdate =
    user.isSuperAdmin || hasPermission(user, 'categories:update');
  const canDelete =
    user.isSuperAdmin || hasPermission(user, 'categories:delete');
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
      title="Chi tiết danh mục"
      intro={`Thông tin của ${category.name}.`}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href={listReturnPath}
          className="text-[13px] font-medium text-accent hover:underline"
        >
          ← Danh sách danh mục
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {canDelete &&
            (deleted ? (
              <form action={restoreCategory}>
                <input type="hidden" name="categoryId" value={category.id} />
                <input type="hidden" name="returnTo" value={listReturnPath} />
                <button
                  type="submit"
                  className="border border-accent px-4 py-2.5 text-[13px] font-semibold text-accent transition-colors hover:bg-accent hover:text-paper"
                >
                  Khôi phục
                </button>
              </form>
            ) : (
              <form action={deleteCategory}>
                <input type="hidden" name="categoryId" value={category.id} />
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
          Danh mục này đã được xoá. Khôi phục để tiếp tục chỉnh sửa.
        </div>
      )}

      <section className="border border-rule bg-paper">
        <div className="border-b border-rule px-6 py-4">
          <h2 className="text-[15px] font-semibold">Thông tin danh mục</h2>
          <p className="mt-1 text-[13px] text-muted">
            Trạng thái: {categoryStateLabel(deleted)} · Tạo lúc:{' '}
            {formatCategoryDate(category.createdAt)} · Cập nhật lúc:{' '}
            {formatCategoryDate(category.updatedAt)}
          </p>
        </div>

        <CategoryForm
          action={updateCategory}
          values={{
            name: category.name,
            slug: category.slug,
            description: category.description ?? '',
          }}
          submitLabel="Lưu thay đổi"
          cancelHref={listReturnPath}
          categoryId={category.id}
          returnTo={listReturnPath}
          locked={locked}
        />
      </section>

      <section className="mt-8 border border-rule bg-paper">
        <div className="border-b border-rule px-6 py-4">
          <h2 className="text-[15px] font-semibold">Sản phẩm liên kết</h2>
          <p className="mt-1 text-[13px] text-muted">
            Liên kết được chỉnh từ form của từng sản phẩm.
          </p>
        </div>

        <div className="px-6 py-5">
          {category.productIds.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {category.productIds.map((productId) => (
                <li key={productId}>
                  <Link
                    href={`/products/${productId}`}
                    className="inline-flex border border-rule px-3 py-1.5 text-[13px] text-ink transition-colors hover:border-accent hover:text-accent"
                  >
                    {productNames.get(productId) ?? productId}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] leading-6 text-muted">
              Danh mục này chưa có sản phẩm nào liên kết. Mở trang sản phẩm để
              gắn danh mục.
            </p>
          )}
        </div>
      </section>
    </WorkspacePage>
  );
}

export default function CategoryDetailPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<DetailQuery>;
}) {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <CategoryDetailContent {...props} />
    </Suspense>
  );
}
