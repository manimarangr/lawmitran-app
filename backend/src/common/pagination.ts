/**
 * Shared pagination helpers for admin list endpoints.
 *
 * Controllers receive `page` / `pageSize` as raw query strings; `resolvePagination`
 * coerces + clamps them, and `paginate` wraps a page of rows with its metadata.
 */

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ResolvedPagination {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export function resolvePagination(
  page?: string | number,
  pageSize?: string | number,
  opts?: { defaultSize?: number; maxSize?: number },
): ResolvedPagination {
  const defaultSize = opts?.defaultSize ?? 20;
  const maxSize = opts?.maxSize ?? 100;

  let p = Math.floor(Number(page));
  let s = Math.floor(Number(pageSize));

  if (!Number.isFinite(p) || p < 1) p = 1;
  if (!Number.isFinite(s) || s < 1) s = defaultSize;
  if (s > maxSize) s = maxSize;

  return { page: p, pageSize: s, skip: (p - 1) * s, take: s };
}

export function paginate<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): Paginated<T> {
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
