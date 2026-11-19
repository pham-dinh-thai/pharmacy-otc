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
        ...(user.isSuperAdmin || hasPermission(user, 'categories:read')
          ? [
              {
                label: 'Danh mục',
                href: '/categories',
                hint: 'Nhóm sản phẩm và liên kết N-N với sản phẩm.',
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
        ...(user.isSuperAdmin || hasPermission(user, 'customers:read')
          ? [
              {
                label: 'Khách hàng',
                href: '/customers',
                hint: 'Hồ sơ khách hàng, số điện thoại và địa chỉ giao hàng.',
              },
            ]
          : []),
        ...(user.isSuperAdmin || hasPermission(user, 'departments:read')
          ? [
              {
                label: 'Phòng ban',
                href: '/departments',
                hint: 'Danh sách phòng ban đang hoạt động và đã vô hiệu hoá.',
              },
            ]
          : []),
        ...(user.isSuperAdmin || hasPermission(user, 'employees:read')
          ? [
              {
                label: 'Nhân viên',
                href: '/employees',
                hint: 'Hồ sơ nhân viên, phòng ban và trạng thái làm việc.',
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
