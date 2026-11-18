export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
export const DEFAULT_PAGE_SIZE = 20;

export function parsePage(value: string | undefined): number {
  const parsed = Number(value);

  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function parseLimit(value: string | undefined): number {
  const parsed = Number(value);

  return (PAGE_SIZE_OPTIONS as readonly number[]).includes(parsed)
    ? parsed
    : DEFAULT_PAGE_SIZE;
}

/** Giữ filter + page/limit trên link điều hướng; bỏ giá trị mặc định cho URL gọn. */
export function listPageHref(
  path: string,
  page: number,
  limit: number,
  filters: Record<string, string> = {},
): string {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  if (page > 1) params.set('page', String(page));
  if (limit !== DEFAULT_PAGE_SIZE) params.set('limit', String(limit));

  const query = params.toString();

  return query ? `${path}?${query}` : path;
}
