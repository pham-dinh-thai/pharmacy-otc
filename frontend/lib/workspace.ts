import type { WorkspaceNavGroup } from '@/components/layout/WorkspaceNav';
import { hasPermission, type CurrentUser } from './account';

/**
 * Menu của khu vực điều khiển. Mỗi mục chỉ hiện khi tài khoản có quyền tương
 * ứng; riêng quản trị vai trò chỉ dành cho Super Admin.
 */
export function workspaceNav(user: CurrentUser): WorkspaceNavGroup[] {
  return [
    {
      label: 'Không gian làm việc',
      items: [
        {
          label: 'Tổng quan',
          href: '/dashboard',
          hint: 'Quyền và chức năng của tài khoản đang đăng nhập.',
        },
        ...(user.isSuperAdmin || hasPermission(user, 'products:read')
          ? [
              {
                label: 'Sản phẩm',
                href: '/products',
                hint: 'Danh sách sản phẩm, đơn giá và tồn kho.',
              },
            ]
          : []),
        ...(user.isSuperAdmin || hasPermission(user, 'suppliers:read')
          ? [
              {
                label: 'Nhà cung cấp',
                href: '/suppliers',
                hint: 'Danh sách nhà cung cấp và thông tin liên hệ.',
              },
            ]
          : []),
      ],
    },
    ...(user.isSuperAdmin
      ? [
          {
            label: 'Quản trị',
            items: [
              {
                label: 'Vai trò & phân quyền',
                href: '/roles',
                hint: 'Tạo vai trò, gán quyền và đặt cờ Super Admin.',
              },
            ],
          },
        ]
      : []),
  ];
}

/** Bỏ mục tổng quan để dùng cho danh sách trên trang chủ khu vực. */
export function subItems(
  groups: WorkspaceNavGroup[],
  overviewHref: string,
): WorkspaceNavGroup['items'] {
  return groups
    .flatMap((group) => group.items)
    .filter((item) => item.href !== overviewHref);
}
