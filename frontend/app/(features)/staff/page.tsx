import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { authFetch } from '@/lib/auth';
import { canAccessStaff, fetchCurrentUser, hasPermission } from '@/lib/account';
import { formatVND } from '@/lib/utils';

type ProductListItem = {
  id: string;
  name: string;
  unitPrice: string;
  quantity: number;
};

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

async function fetchList<T>(path: string): Promise<T[] | null> {
  let res: Response;
  try {
    res = await authFetch(path);
  } catch {
    return null;
  }

  if (!res.ok) return null;

  return (await res.json()) as T[];
}

const TH_CLASS =
  'border-b border-rule py-2 pr-4 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted';
const TD_CLASS = 'border-b border-rule py-3 pr-4 align-top';

function StaffContent({
  products,
  suppliers,
  showProducts,
  showSuppliers,
}: {
  products: ProductListItem[] | null;
  suppliers: SupplierListItem[] | null;
  showProducts: boolean;
  showSuppliers: boolean;
}) {
  return (
    <>
      {showProducts && (
        <section className="max-w-[860px]">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            Sản phẩm
          </h2>

          {products && products.length > 0 ? (
            <table className="mt-3 w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className={TH_CLASS}>Tên</th>
                  <th className={TH_CLASS}>Đơn giá</th>
                  <th className={`${TH_CLASS} text-right`}>Tồn</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className={TD_CLASS}>{product.name}</td>
                    <td className={TD_CLASS}>
                      {formatVND(Number(product.unitPrice))}
                    </td>
                    <td className={`${TD_CLASS} text-right tabular-nums`}>
                      {product.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="mt-3 text-[13px] text-muted">Chưa có sản phẩm.</p>
          )}
        </section>
      )}

      {showSuppliers && (
        <section className="mt-10 max-w-[860px]">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            Nhà cung cấp
          </h2>

          {suppliers && suppliers.length > 0 ? (
            <table className="mt-3 w-full border-collapse text-[13px]">
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
                    <td className={`${TD_CLASS} tabular-nums`}>
                      {supplier.code}
                    </td>
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
            <p className="mt-3 text-[13px] text-muted">Chưa có nhà cung cấp.</p>
          )}
        </section>
      )}

      {!showProducts && !showSuppliers && (
        <p className="max-w-[620px] text-[13px] leading-6 text-muted">
          Tài khoản của bạn chưa được cấp quyền xem sản phẩm hoặc nhà cung cấp.
        </p>
      )}
    </>
  );
}

async function StaffData() {
  const user = await fetchCurrentUser();

  if (!user) redirect('/login?next=/staff');
  if (!canAccessStaff(user)) redirect('/account');

  const showProducts =
    user.isSuperAdmin || hasPermission(user, 'products:read');
  const showSuppliers =
    user.isSuperAdmin || hasPermission(user, 'suppliers:read');

  const [products, suppliers] = await Promise.all([
    showProducts ? fetchList<ProductListItem>('/products') : null,
    showSuppliers ? fetchList<SupplierListItem>('/suppliers') : null,
  ]);

  return (
    <WorkspaceShell
      eyebrow="Nhân viên"
      title="Trang điều khiển nhân viên"
      intro="Tra cứu sản phẩm và nhà cung cấp trong hệ thống."
    >
      <StaffContent
        products={products}
        suppliers={suppliers}
        showProducts={showProducts}
        showSuppliers={showSuppliers}
      />
    </WorkspaceShell>
  );
}

export default function StaffPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <StaffData />
    </Suspense>
  );
}
