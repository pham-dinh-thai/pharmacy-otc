'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type WorkspaceNavItem = {
  label: string;
  href: string;
  hint?: string;
};

export type WorkspaceNavGroup = {
  label: string;
  items: WorkspaceNavItem[];
};

/** Menu chức năng của khu vực điều khiển: tab ngang trên mobile, cột trái từ lg. */
export function WorkspaceNav({ groups }: { groups: WorkspaceNavGroup[] }) {
  const pathname = usePathname();
  // Chọn mục khớp dài nhất để /admin không sáng khi đang ở /admin/roles/...
  const activeHref = groups
    .flatMap((group) => group.items.map((item) => item.href))
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((left, right) => right.length - left.length)[0];

  return (
    <nav aria-label="Chức năng" className="lg:space-y-8">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="hidden px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted lg:block">
            {group.label}
          </p>

          <ul className="flex gap-1 overflow-x-auto border-b border-rule lg:mt-3 lg:block lg:gap-0 lg:overflow-visible lg:border-b-0">
            {group.items.map((item) => {
              const active = item.href === activeHref;

              return (
                <li key={item.href} className="shrink-0">
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`-mb-px block whitespace-nowrap border-b-2 px-2 py-2.5 text-[13px] transition-colors lg:mb-0 lg:border-b-0 lg:border-l-2 lg:px-3 ${
                      active
                        ? 'border-accent font-semibold text-ink'
                        : 'border-transparent text-muted hover:text-ink'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
