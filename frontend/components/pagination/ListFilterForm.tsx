'use client';

import Link from 'next/link';
import { listPageHref } from '@/lib/pagination';

const INPUT_CLASS =
  'border border-rule bg-paper px-3 py-2 text-[13px] placeholder:text-muted/60 focus:border-ink';

export type FilterSelect = {
  name: string;
  label: string;
  options: { value: string; label: string }[];
};

/** Form lọc dùng chung: đổi select tự submit, ô tìm kiếm bấm "Lọc". */
export function ListFilterForm({
  action,
  limit,
  search,
  searchPlaceholder,
  selects,
  values,
}: {
  action: string;
  limit: number;
  search: string;
  searchPlaceholder: string;
  selects: FilterSelect[];
  values: Record<string, string>;
}) {
  const hasActiveFilter =
    search !== '' ||
    Object.values(values).some((value) => value !== '' && value !== 'all');

  return (
    <form
      method="get"
      action={action}
      className="mt-5 flex flex-wrap items-end gap-3 border-b border-rule pb-4"
    >
      <label className="min-w-[220px] flex-1 text-[13px] text-muted">
        Tìm kiếm
        <input
          type="search"
          name="search"
          defaultValue={search}
          placeholder={searchPlaceholder}
          className={`mt-1 w-full ${INPUT_CLASS}`}
        />
      </label>

      {selects.map((select) => (
        <label key={select.name} className="text-[13px] text-muted">
          {select.label}
          <select
            name={select.name}
            defaultValue={values[select.name] ?? ''}
            onChange={(event) => event.currentTarget.form?.requestSubmit()}
            className={`mt-1 block ${INPUT_CLASS}`}
          >
            {select.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ))}

      <input type="hidden" name="limit" value={limit} />

      <button
        type="submit"
        className="border border-ink bg-ink px-4 py-2 text-[13px] font-semibold text-paper transition-colors hover:bg-accent"
      >
        Lọc
      </button>

      {hasActiveFilter && (
        <Link
          href={listPageHref(action, 1, limit)}
          className="px-1 py-2 text-[13px] text-muted hover:text-accent hover:underline"
        >
          Xoá lọc
        </Link>
      )}
    </form>
  );
}
