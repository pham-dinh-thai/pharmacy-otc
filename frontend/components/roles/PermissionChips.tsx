import { permissionLabel } from '@/lib/permissions';

/** Danh sách quyền dạng chip, có thể giới hạn số chip hiển thị. */
export function PermissionChips({
  permissions,
  limit,
}: {
  permissions: string[];
  limit?: number;
}) {
  const shown = limit ? permissions.slice(0, limit) : permissions;
  const remaining = permissions.length - shown.length;

  return (
    <ul className="flex flex-wrap gap-1.5">
      {shown.map((permission) => (
        <li
          key={permission}
          title={permission}
          className="border border-rule px-2 py-0.5 text-[12px] leading-5 text-ink"
        >
          {permissionLabel(permission)}
        </li>
      ))}

      {remaining > 0 && (
        <li className="px-2 py-0.5 text-[12px] leading-5 text-muted">
          +{remaining} quyền
        </li>
      )}
    </ul>
  );
}
