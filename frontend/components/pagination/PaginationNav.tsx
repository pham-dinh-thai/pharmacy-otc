import Link from 'next/link';
import { listPageHref } from '@/lib/pagination';

export function PaginationNav({
  path,
  page,
  limit,
  totalPages,
  label,
  filters = {},
}: {
  path: string;
  page: number;
  limit: number;
  totalPages: number;
  label: string;
  filters?: Record<string, string>;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label={label}
      className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4"
    >
      {page > 1 ? (
        <Link
          href={listPageHref(path, page - 1, limit, filters)}
          className="text-[13px] font-medium text-accent hover:underline"
        >
          ← Trang trước
        </Link>
      ) : (
        <span className="text-[13px] text-muted/50">← Trang trước</span>
      )}

      <span className="text-[13px] text-muted">
        Trang {page} / {totalPages}
      </span>

      {page < totalPages ? (
        <Link
          href={listPageHref(path, page + 1, limit, filters)}
          className="text-[13px] font-medium text-accent hover:underline"
        >
          Trang sau →
        </Link>
      ) : (
        <span className="text-[13px] text-muted/50">Trang sau →</span>
      )}
    </nav>
  );
}
