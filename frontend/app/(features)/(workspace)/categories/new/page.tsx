import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { WorkspacePage } from '@/components/layout/WorkspaceShell';
import { FormMessage } from '@/components/roles/FormMessage';
import { fetchCurrentUser, hasPermission } from '@/lib/account';
import { createCategory } from '../actions';
import { CategoryForm, EMPTY_CATEGORY_FORM } from '../category-form';

const ERROR_MESSAGES: Record<string, string> = {
  missing: 'Nhập tên danh mục.',
  invalid: 'Dữ liệu danh mục không hợp lệ. Kiểm tra lại các trường đã nhập.',
  exists: 'Tên hoặc slug danh mục đã tồn tại.',
  forbidden: 'Bạn không có quyền tạo danh mục.',
  notfound: 'Không tìm thấy danh mục.',
  server: 'Không tạo được danh mục. Kiểm tra kết nối rồi thử lại.',
};

async function NewCategoryForm({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const user = await fetchCurrentUser();

  if (!user) redirect('/login?next=/categories/new');
  if (!user.isSuperAdmin && !hasPermission(user, 'categories:create')) {
    redirect('/dashboard');
  }

  const query = await searchParams;
  const rawError = Array.isArray(query.error) ? query.error[0] : query.error;
  const errorMessage = rawError
    ? (ERROR_MESSAGES[rawError] ?? ERROR_MESSAGES.server)
    : undefined;

  return (
    <WorkspacePage
      eyebrow="Không gian làm việc"
      title="Thêm danh mục"
      intro="Tạo nhóm sản phẩm mới. Slug được tự sinh từ tên nếu bạn không nhập."
    >
      <div className="mb-6">
        <Link
          href="/categories"
          className="text-[13px] font-medium text-accent hover:underline"
        >
          ← Danh sách danh mục
        </Link>
      </div>

      <FormMessage message={errorMessage} />

      <section className="border border-rule bg-paper">
        <div className="border-b border-rule px-6 py-4">
          <h2 className="text-[15px] font-semibold">Thông tin danh mục</h2>
          <p className="mt-1 text-[13px] text-muted">
            Liên kết với sản phẩm được quản lý từ trang chi tiết từng sản phẩm.
          </p>
        </div>

        <CategoryForm
          action={createCategory}
          values={EMPTY_CATEGORY_FORM}
          submitLabel="Tạo danh mục"
          cancelHref="/categories"
        />
      </section>
    </WorkspacePage>
  );
}

export default function NewCategoryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <NewCategoryForm searchParams={searchParams} />
    </Suspense>
  );
}
