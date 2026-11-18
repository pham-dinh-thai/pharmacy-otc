export type ListQueryValue = string | string[] | undefined;

export type TriStateValue = 'all' | 'true' | 'false';

export function first(value: ListQueryValue): string {
  if (Array.isArray(value)) return value[0] ?? '';

  return value ?? '';
}

export function parseTriState(value: string): TriStateValue {
  return value === 'true' || value === 'false' ? value : 'all';
}

/** Bỏ filter không có tác dụng để URL và API query gọn hơn. */
export function compactListFilters(
  filters: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value && value !== 'all'),
  );
}

export function listApiQuery(
  filters: Record<string, string>,
  page: number,
  limit: number,
): string {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });

  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  return params.toString();
}
