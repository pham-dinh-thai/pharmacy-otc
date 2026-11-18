'use client';

import Link from 'next/link';
import {
  SUPPLIER_DELETED_FILTERS,
  type SupplierDeletedFilter,
} from '@/lib/suppliers';

const INPUT_CLASS =
  'w-full border border-rule bg-paper px-3 py-2.5 text-[14px] placeholder:text-muted/60 focus:border-ink';

export function SupplierFilters({
  search,
  deleted,
}: {
  search: string;
  deleted: SupplierDeletedFilter;
}) {
  return (
    <form
      method="get"
      action="/suppliers"
      role="search"
      className="flex flex-wrap items-end gap-3 border-b border-rule pb-4"
    >
      <div className="min-w-[240px] flex-1">
        <label
          htmlFor="supplier-search"
          className="mb-1.5 block text-[13px] font-medium text-muted"
        >
          Tìm kiếm
        </label>
        <input
          id="supplier-search"
          name="search"
          type="search"
          defaultValue={search}
          placeholder="Mã, tên, điện thoại, email hoặc mã số thuế"
          className={INPUT_CLASS}
        />
      </div>

      <div className="w-full sm:w-[200px]">
        <label
          htmlFor="supplier-deleted"
          className="mb-1.5 block text-[13px] font-medium text-muted"
        >
          Trạng thái
        </label>
        <select
          id="supplier-deleted"
          name="deleted"
          value={deleted}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
          className={INPUT_CLASS}
        >
          {SUPPLIER_DELETED_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="bg-accent px-5 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-ink"
      >
        Tìm kiếm
      </button>

      {(search || deleted !== 'false') && (
        <Link
          href="/suppliers"
          className="px-1 py-2.5 text-[13px] font-medium text-accent hover:underline"
        >
          Xoá bộ lọc
        </Link>
      )}
    </form>
  );
}
