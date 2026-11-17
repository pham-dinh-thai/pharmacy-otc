import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { WorkspacePage } from '@/components/layout/WorkspaceShell';
import { authFetch } from '@/lib/auth';
import { fetchCurrentUser, hasPermission } from '@/lib/account';
import { formatVND } from '@/lib/utils';

type ProductListItem = {
  id: string;
  name: string;
  unitPrice: string;
  quantity: number;
};

const TH_CLASS =
  'border-b border-rule py-2 pr-4 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted';
const TD_CLASS = 'border-b border-rule py-3 pr-4 align-top';

async function fetchProducts(): Promise<ProductListItem[] | null> {
  let res: Response;
  try {
    res = await authFetch('/products');
  } catch {
    return null;
  }

  if (res.status === 401) redirect('/login?next=/products');
  if (!res.ok) return null;

  return (await res.json()) as ProductListItem[];
}

async function ProductsContent() {
  const user = await fetchCurrentUser();

  if (!user) redirect('/login?next=/products');
  if (!user.isSuperAdmin && !hasPermission(user, 'products:read')) {
    redirect('/dashboard');
  }

  const products = await fetchProducts();

  return (
    <WorkspacePage
      eyebrow="Không gian làm việc"
      title="Sản phẩm"
      intro="Danh sách sản phẩm, đơn giá và tồn kho."
    >
      {products === null ? (
        <p className="text-[13px] leading-6 text-muted">
          Không tải được danh sách sản phẩm.
        </p>
      ) : products.length > 0 ? (
        <table className="w-full max-w-[860px] border-collapse text-[13px]">
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
        <p className="text-[13px] leading-6 text-muted">Chưa có sản phẩm.</p>
      )}
    </WorkspacePage>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <ProductsContent />
    </Suspense>
  );
}
