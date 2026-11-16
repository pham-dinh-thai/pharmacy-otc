import type { WorkspaceNavGroup } from '@/components/layout/WorkspaceNav';
import { hasPermission, type CurrentUser } from './account';

/** Menu chức năng của trang điều khiển admin, lọc theo quyền hiện có. */
export function adminNav(user: CurrentUser): WorkspaceNavGroup[] {
  return [
    {
      label: 'Quản trị',
      items: [
        {
          label: 'Tổng quan',
          href: '/admin',
          hint: 'Vai trò và quyền của tài khoản đang đăng nhập.',
        },
        ...(user.isSuperAdmin || hasPermission(user, 'roles:read')
          ? [
              {
                label: 'Vai trò & phân quyền',
                href: '/admin/roles',
                hint: 'Tạo vai trò, gán quyền và đặt cờ Super Admin.',
              },
            ]
          : []),
      ],
    },
  ];
}

/** Menu chức năng của trang điều khiển nhân viên, lọc theo quyền hiện có. */
export function staffNav(user: CurrentUser): WorkspaceNavGroup[] {
  return [
    {
      label: 'Nhân viên',
      items: [
        {
          label: 'Tổng quan',
          href: '/staff',
          hint: 'Quyền và chức năng tài khoản đang đăng nhập.',
        },
        ...(user.isSuperAdmin || hasPermission(user, 'products:read')
          ? [
              {
                label: 'Sản phẩm',
                href: '/staff/products',
                hint: 'Danh sách sản phẩm, đơn giá và tồn kho.',
              },
            ]
          : []),
        ...(user.isSuperAdmin || hasPermission(user, 'suppliers:read')
          ? [
              {
                label: 'Nhà cung cấp',
                href: '/staff/suppliers',
                hint: 'Danh sách nhà cung cấp và thông tin liên hệ.',
              },
            ]
          : []),
      ],
    },
  ];
}

/** Các mục chức năng, bỏ mục tổng quan để dùng cho danh sách trên trang chủ khu vực. */
export function subItems(
  groups: WorkspaceNavGroup[],
  overviewHref: string,
): WorkspaceNavGroup['items'] {
  return groups
    .flatMap((group) => group.items)
    .filter((item) => item.href !== overviewHref);
}
