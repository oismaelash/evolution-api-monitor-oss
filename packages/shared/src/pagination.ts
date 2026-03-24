export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedResult<T> = {
  data: T[];
  meta: PaginationMeta;
};

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const safeLimit = limit > 0 ? limit : 50;
  const safePage = page > 0 ? page : 1;
  return {
    page: safePage,
    limit: safeLimit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / safeLimit),
  };
}

export function parsePagination(searchParams: URLSearchParams, defaults?: { page?: number; limit?: number }) {
  const page = Math.max(1, Number(searchParams.get('page') ?? defaults?.page ?? 1) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? defaults?.limit ?? 50) || 50));
  return { page, limit, skip: (page - 1) * limit };
}
