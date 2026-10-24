export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

interface PaginableDelegate<T, Where, OrderBy, Include> {
  findMany(args: {
    where?: Where;
    orderBy?: OrderBy;
    include?: Include;
    skip: number;
    take: number;
  }): Promise<T[]>;
  count(args: { where?: Where }): Promise<number>;
}

export async function paginate<T, Where, OrderBy, Include = never>(
  delegate: PaginableDelegate<T, Where, OrderBy, Include>,
  options: {
    where?: Where;
    orderBy?: OrderBy;
    include?: Include;
    page?: number;
    limit?: number;
  },
): Promise<PaginatedResult<T>> {
  const page = options.page && options.page > 0 ? options.page : 1;
  const limit = options.limit && options.limit > 0 ? options.limit : 20;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    delegate.findMany({
      where: options.where,
      orderBy: options.orderBy,
      include: options.include,
      skip,
      take: limit,
    }),
    delegate.count({ where: options.where }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) },
  };
}
