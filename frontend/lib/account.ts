import { cache } from 'react';
import { authFetch } from './auth';

export type CurrentUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isSuperAdmin: boolean;
  permissions: string[];
};

/**
 * Đọc hồ sơ + quyền của người đang đăng nhập. Trả null khi chưa xác thực.
 * `cache` gộp các lần gọi trong cùng một request (layout + page).
 */
export const fetchCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  let res: Response;
  try {
    res = await authFetch('/authentication/me');
  } catch {
    return null;
  }

  if (!res.ok) return null;

  return (await res.json()) as CurrentUser;
});

/** Kiểm tra một quyền cụ thể, có xét quyền quản lý dạng `resource:manage`. */
export function hasPermission(user: CurrentUser, key: string): boolean {
  const [resource, action] = key.split(':');

  return user.permissions.some((permission) => {
    const [grantedResource, grantedAction] = permission.split(':');

    return (
      grantedResource === resource &&
      (grantedAction === 'manage' || grantedAction === action)
    );
  });
}

const ADMIN_PERMISSIONS = [
  'roles:read',
  'users:read',
  'audit_logs:read',
  'reports:view_sales',
  'reports:view_inventory',
  'expenses:read',
];

const STAFF_PERMISSIONS = [
  'orders:read',
  'products:read',
  'suppliers:read',
  'customers:read',
  'inventories:read',
  'goods_receipts:read',
];

export function canAccessAdmin(user: CurrentUser): boolean {
  return (
    user.isSuperAdmin ||
    ADMIN_PERMISSIONS.some((key) => hasPermission(user, key))
  );
}

export function canAccessStaff(user: CurrentUser): boolean {
  return (
    user.isSuperAdmin ||
    STAFF_PERMISSIONS.some((key) => hasPermission(user, key))
  );
}

export function displayName(user: CurrentUser): string {
  const name = `${user.firstName} ${user.lastName}`.trim();

  return name || user.email;
}
