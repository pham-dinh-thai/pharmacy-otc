export const CATALOG_PAGE_SIZE = 9;

export type CatalogState =
  | { kind: 'all'; page: number }
  | { kind: 'category'; slug: string; page: number }
  | { kind: 'search'; query: string; page: number };

function parsePage(value: string | undefined): number | null {
  if (!value) return 1;
  if (!/^\d+$/.test(value)) return null;

  const page = Number(value);

  return page >= 1 ? page : null;
}

/** Parse path-only catalog URLs such as /catalog/category/otc/page/2. */
export function parseCatalogSegments(
  segments: string[] = [],
): CatalogState | null {
  if (segments.length === 0) return { kind: 'all', page: 1 };

  const [section, first, pageSegment, pageValue] = segments;

  if (section === 'page' && segments.length === 2) {
    const page = parsePage(first);
    return page ? { kind: 'all', page } : null;
  }

  if (
    section === 'category' &&
    (segments.length === 2 || (segments.length === 4 && pageSegment === 'page'))
  ) {
    const page = parsePage(pageValue);
    if (!first || !page) return null;
    return { kind: 'category', slug: first, page };
  }

  if (
    section === 'search' &&
    (segments.length === 2 || (segments.length === 4 && pageSegment === 'page'))
  ) {
    const page = parsePage(pageValue);
    if (!first?.trim() || !page) return null;
    return { kind: 'search', query: first, page };
  }

  return null;
}

/** Build a catalog URL without query parameters. */
export function catalogHref(state: CatalogState, page = state.page): string {
  let path = '/catalog';

  if (state.kind === 'category') {
    path += `/category/${encodeURIComponent(state.slug)}`;
  } else if (state.kind === 'search') {
    path += `/search/${encodeURIComponent(state.query)}`;
  }

  return page > 1 ? `${path}/page/${page}` : path;
}

/** Compact page list with gaps, e.g. [1, 2, 3, 'gap', 12]. */
export function catalogPageNumbers(
  current: number,
  total: number,
): (number | 'gap')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const visible = new Set([1, total, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((page) => visible.add(page));
  if (current >= total - 2) {
    [total - 3, total - 2, total - 1].forEach((page) => visible.add(page));
  }

  const pages = [...visible]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);

  return pages.reduce<(number | 'gap')[]>((result, page, index) => {
    if (index > 0 && page - pages[index - 1] > 1) result.push('gap');
    result.push(page);
    return result;
  }, []);
}
