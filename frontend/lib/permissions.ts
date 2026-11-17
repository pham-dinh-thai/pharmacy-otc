import { authFetch } from './auth';

export type PermissionResource = {
  resource: string;
  actions: string[];
};

const RESOURCE_LABELS: Record<string, string> = {
  accounts: 'Tài khoản',
  users: 'Người dùng',
  customers: 'Khách hàng',
  roles: 'Vai trò',
  orders: 'Đơn hàng',
  products: 'Sản phẩm',
  suppliers: 'Nhà cung cấp',
  goods_receipts: 'Phiếu nhập',
  inventories: 'Tồn kho',
  expenses: 'Chi phí',
  audit_logs: 'Nhật ký',
  reports: 'Báo cáo',
};

const ACTION_LABELS: Record<string, string> = {
  read: 'Xem',
  create: 'Tạo',
  update: 'Sửa',
  delete: 'Xoá',
  process: 'Xử lý',
  cancel: 'Huỷ',
  refund: 'Hoàn tiền',
  confirm: 'Xác nhận',
  issue: 'Xuất kho',
  reconcile: 'Kiểm kê',
  approve: 'Duyệt',
  pay: 'Chi tiền',
  view_sales: 'Xem doanh thu',
  view_inventory: 'Xem tồn kho',
  export: 'Xuất dữ liệu',
  manage: 'Toàn quyền',
};

export function resourceLabel(resource: string): string {
  return RESOURCE_LABELS[resource] ?? resource;
}

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

/** Nhãn tiếng Việt cho một khoá quyền dạng `resource:action`. */
export function permissionLabel(permission: string): string {
  const separator = permission.indexOf(':');

  if (separator === -1) return permission;

  return `${resourceLabel(permission.slice(0, separator))} · ${actionLabel(
    permission.slice(separator + 1),
  )}`;
}

/** Danh mục quyền do backend công bố, null khi không tải được. */
export async function fetchPermissionCatalog(): Promise<
  PermissionResource[] | null
> {
  let res: Response;
  try {
    res = await authFetch('/permissions');
  } catch {
    return null;
  }

  if (!res.ok) return null;

  const body = (await res.json()) as { resources?: PermissionResource[] };

  return body.resources ?? null;
}

/** Mọi khoá quyền trong danh mục, theo đúng thứ tự backend trả về. */
export function permissionOptions(catalog: PermissionResource[]): string[] {
  return catalog.flatMap(({ resource, actions }) =>
    actions.map((action) => `${resource}:${action}`),
  );
}

/** Sắp quyền theo thứ tự danh mục để nhóm cùng resource nằm cạnh nhau. */
export function sortPermissions(
  permissions: string[],
  catalog: PermissionResource[],
): string[] {
  const order = new Map<string, number>();

  permissionOptions(catalog).forEach((permission, index) => {
    order.set(permission, index);
  });

  return [...permissions].sort((left, right) => {
    const leftOrder = order.get(left) ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = order.get(right) ?? Number.MAX_SAFE_INTEGER;

    return leftOrder - rightOrder || left.localeCompare(right);
  });
}
