'use client';

import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/lib/pagination';

const SELECT_CLASS =
  'border border-rule bg-paper px-3 py-2 text-[13px] focus:border-ink';

/** Đổi kích thước trang thì tự submit, quay về trang 1. */
export function PageSizeForm({
  action,
  limit = DEFAULT_PAGE_SIZE,
}: {
  action: string;
  limit?: number;
}) {
  return (
    <form method="get" action={action} className="flex items-center gap-2">
      <label className="flex items-center gap-2 text-[13px] text-muted">
        Mỗi trang
        <select
          name="limit"
          value={limit}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
          className={SELECT_CLASS}
        >
          {PAGE_SIZE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="border border-rule px-3 py-2 text-[13px] font-medium text-muted transition-colors hover:border-ink hover:text-ink"
      >
        Áp dụng
      </button>
    </form>
  );
}
