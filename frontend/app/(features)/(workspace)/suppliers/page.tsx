import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { WorkspacePage } from '@/components/layout/WorkspaceShell';
import { authFetch } from '@/lib/auth';
import { fetchCurrentUser, hasPermission } from '@/lib/account';

type SupplierListItem = {
  id: string;
  code: string;
  name: string;
  status: 'active' | 'inactive';
  phone: string | null;
  email: string | null;
  address: string | null;
  taxCode: string | null;
};

const TH_CLASS =
  'border-b border-rule py-2 pr-4 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted';
const TD_CLASS = 'border-b border-rule py-3 pr-4 align-top';

async function fetchSuppliers(): Promise<SupplierListItem[] | null> {
  let res: Response;
  try {
    res = await authFetch('/suppliers');
  } catch {
    return null;
  }

  if (res.status === 401) redirect('/login?next=/suppliers');
  if (!res.ok) return null;

  return (await res.json()) as SupplierListItem[];
}

async function SuppliersContent() {
  const user = await fetchCurrentUser();

  if (!user) redirect('/login?next=/suppliers');
  if (!user.isSuperAdmin && !hasPermission(user, 'suppliers:read')) {
    redirect('/dashboard');
  }

  const suppliers = await fetchSuppliers();

  return (
    <WorkspacePage
      eyebrow="Không gian làm việc"
      title="Nhà cung cấp"
      intro="Danh sách nhà cung cấp và thông tin liên hệ."
    >
      {suppliers === null ? (
        <p className="text-[13px] leading-6 text-muted">
          Không tải được danh sách nhà cung cấp.
        </p>
      ) : suppliers.length > 0 ? (
        <table className="w-full max-w-[860px] border-collapse text-[13px]">
          <thead>
            <tr>
              <th className={TH_CLASS}>Mã</th>
              <th className={TH_CLASS}>Tên</th>
              <th className={TH_CLASS}>Trạng thái</th>
              <th className={TH_CLASS}>Liên hệ</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((supplier) => (
              <tr key={supplier.id}>
                <td className={`${TD_CLASS} tabular-nums`}>{supplier.code}</td>
                <td className={TD_CLASS}>{supplier.name}</td>
                <td className={TD_CLASS}>
                  {supplier.status === 'active'
                    ? 'Đang hoạt động'
                    : 'Ngừng hoạt động'}
                </td>
                <td className={TD_CLASS}>
                  {[supplier.phone, supplier.email]
                    .filter(Boolean)
                    .join(' · ') || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-[13px] leading-6 text-muted">
          Chưa có nhà cung cấp.
        </p>
      )}
    </WorkspacePage>
  );
}

export default function SuppliersPage() {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <SuppliersContent />
    </Suspense>
  );
}
