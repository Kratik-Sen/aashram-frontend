export const PAGE_SIZE = 25;

export const withPagination = (filters = {}, page = 1) => ({
  ...filters,
  page,
  limit: PAGE_SIZE
});

export const unpackPaginatedResponse = (payload) => {
  if (Array.isArray(payload)) {
    return {
      rows: payload,
      pagination: {
        page: 1,
        limit: payload.length,
        total: payload.length,
        totalPages: 1,
        hasMore: false
      }
    };
  }

  return {
    rows: payload?.data || [],
    pagination: payload?.pagination || {
      page: 1,
      limit: PAGE_SIZE,
      total: payload?.data?.length || 0,
      totalPages: 1,
      hasMore: false
    }
  };
};
