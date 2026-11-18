import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { WorkspacePage } from '@/components/layout/WorkspaceShell';
import { FormMessage } from '@/components/roles/FormMessage';
import { fetchCurrentUser, hasPermission } from '@/lib/account';
import { authFetch } from '@/lib/auth';
import {
  formatSupplierDate,
  isSupplierDeleted,
  isSupplierDeletedFilter,
  supplierContact,
  supplierListHref,
  supplierQuery,
  supplierStateLabel,
  type Supplier,
  type SupplierDeletedFilter,
} from '@/lib/suppliers';
import { deleteSupplier, restoreSupplier } from './actions';
import { SupplierFilters } from './supplier-filters';

const TH_CLASS =
  'border-b border-rule py-2 pr-4 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted';
const TD_CLASS = 'border-b border-rule py-4 pr-4 align-top';

const ERROR_MESSAGES: Record<string, string> = {
  missing: 'Thiếu thông tin nhà cung cấp.',
  forbidden: 'Bạn không có quyền thay đổi nhà cung cấp.',
  invalid: 'Dữ liệu nhà cung cấp không hợp lệ.',
  exists: 'Mã hoặc thông tin liên hệ đã được dùng cho nhà cung cấp khác.',
  notfound: 'Không tìm thấy nhà cung cấp.',
  server: 'Không lưu được thay đổi. Kiểm tra kết nối rồi thử lại.',
};

const UPDATED_MESSAGES: Record<string, string> = {
  created: 'Đã tạo nhà cung cấp.',
  saved: 'Đã cập nhật nhà cung cấp.',
  deleted: 'Đã xoá nhà cung cấp. Có thể khôi phục từ danh sách.',
  restored: 'Đã khôi phục nhà cung cấp.',
};

type ListQuery = {
  error?: string | string[];
  updated?: string | string[];
  search?: string | string[];
  deleted?: string | string[];
};

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';

  return value ?? '';
}

function StateCell({ supplier }: { supplier: Supplier }) {
  const deleted = isSupplierDeleted(supplier);

  return (
    <span
      className={`inline-flex whitespace-nowrap border px-2 py-1 text-[11px] font-semibold ${
        deleted ? 'border-red-600 text-red-700' : 'border-rule text-muted'
      }`}
    >
      {supplierStateLabel(deleted)}
    </span>
  );
}

async function SuppliersList({
  searchParams,
}: {
  searchParams: Promise<ListQuery>;
}) {
  const user = await fetchCurrentUser();

  if (!user) redirect('/login?next=/suppliers');
  if (!user.isSuperAdmin && !hasPermission(user, 'suppliers:read')) {
    redirect('/dashboard');
  }

  const query = await searchParams;
  const search = first(query.search).trim();
  const deletedValue = first(query.deleted);
  const deletedFilter: SupplierDeletedFilter = isSupplierDeletedFilter(
    deletedValue,
  )
    ? deletedValue
    : 'false';
  const listHref = supplierListHref(deletedFilter, search);
  const detailHref = (id: string) =>
    `/suppliers/${id}?returnTo=${encodeURIComponent(listHref)}`;
  const filterQuery = supplierQuery(deletedFilter, search);

  let res: Response;
  try {
    res = await authFetch(`/suppliers${filterQuery}`);
  } catch {
    throw new Error('Failed to fetch suppliers: network error');
  }

  if (res.status === 401) {
    redirect(`/login?next=${encodeURIComponent(listHref)}`);
  }
  if (res.status === 403) redirect('/dashboard');
  if (res.status === 400 || res.status === 422) {
    redirect('/suppliers?error=invalid');
  }
  if (!res.ok) throw new Error(`Failed to fetch suppliers: ${res.status}`);

  const suppliers = (await res.json()) as Supplier[];

  const canCreate =
    user.isSuperAdmin || hasPermission(user, 'suppliers:create');
  const canUpdate =
    user.isSuperAdmin || hasPermission(user, 'suppliers:update');
  const canDelete =
    user.isSuperAdmin || hasPermission(user, 'suppliers:delete');

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
      title="Nhà cung cấp"
      intro="Danh sách nhà cung cấp, thông tin liên hệ và trạng thái sử dụng."
    >
      <FormMessage message={errorMessage} />
      <FormMessage message={updatedMessage} tone="success" />

      <SupplierFilters search={search} deleted={deletedFilter} />

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-4">
        <p className="text-[13px] text-muted">{suppliers.length} nhà cung cấp</p>

        {canCreate && (
          <Link
            href="/suppliers/new"
            className="bg-accent px-4 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-ink"
          >
            Thêm nhà cung cấp
          </Link>
        )}
      </div>

      {suppliers.length > 0 ? (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[1080px] border-collapse text-[13px]">
            <thead>
              <tr>
                <th className={TH_CLASS}>Mã</th>
                <th className={TH_CLASS}>Tên</th>
                <th className={TH_CLASS}>Trạng thái</th>
                <th className={TH_CLASS}>Liên hệ</th>
                <th className={TH_CLASS}>Mã số thuế</th>
                <th className={TH_CLASS}>Tạo lúc</th>
                {(canUpdate || canDelete) && (
                  <th className={`${TH_CLASS} text-right`}>Hành động</th>
                )}
              </tr>
            </thead>

            <tbody>
              {suppliers.map((supplier) => {
                const deleted = isSupplierDeleted(supplier);

                return (
                  <tr key={supplier.id}>
                    <td className={`${TD_CLASS} tabular-nums`}>
                      {supplier.code}
                    </td>
                    <td className={TD_CLASS}>
                      <Link
                        href={detailHref(supplier.id)}
                        className="font-semibold hover:text-accent"
                      >
                        {supplier.name}
                      </Link>
                    </td>
                    <td className={TD_CLASS}>
                      <StateCell supplier={supplier} />
                    </td>
                    <td className={TD_CLASS}>
                      {supplierContact(supplier) ?? (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className={TD_CLASS}>
                      {supplier.taxCode ?? <span className="text-muted">—</span>}
                    </td>
                    <td className={`${TD_CLASS} whitespace-nowrap text-muted`}>
                      {formatSupplierDate(supplier.createdAt)}
                    </td>
                    {(canUpdate || canDelete) && (
                      <td className={`${TD_CLASS} text-right`}>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Link
                            href={detailHref(supplier.id)}
                            className="whitespace-nowrap text-[12px] font-medium text-accent hover:underline"
                          >
                            Chi tiết
                          </Link>

                          {canUpdate && !deleted && (
                            <Link
                              href={`/suppliers/${supplier.id}`}
                              className="whitespace-nowrap text-[12px] font-medium text-accent hover:underline"
                            >
                              Sửa
                            </Link>
                          )}

                          {canDelete && (
                            <form
                              action={deleted ? restoreSupplier : deleteSupplier}
                            >
                              <input
                                type="hidden"
                                name="supplierId"
                                value={supplier.id}
                              />
                              <input
                                type="hidden"
                                name="returnTo"
                                value={listHref}
                              />
                              <button
                                type="submit"
                                aria-label={`${deleted ? 'Khôi phục' : 'Xoá'} nhà cung cấp ${supplier.name}`}
                                className={
                                  deleted
                                    ? 'whitespace-nowrap border border-accent px-2.5 py-1 text-[12px] font-medium text-accent transition-colors hover:bg-accent hover:text-paper'
                                    : 'whitespace-nowrap border border-rule px-2.5 py-1 text-[12px] text-muted transition-colors hover:border-red-600 hover:text-red-700'
                                }
                              >
                                {deleted ? 'Khôi phục' : 'Xoá'}
                              </button>
                            </form>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-6 text-[13px] leading-6 text-muted">
          Không có nhà cung cấp nào phù hợp với bộ lọc.
        </p>
      )}
    </WorkspacePage>
  );
}

export default function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<ListQuery>;
}) {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <SuppliersList searchParams={searchParams} />
    </Suspense>
  );
}
