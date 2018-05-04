export class SimplePagination {
  constructor({ page = 1, pageCount = null, hasMore = false }) {
    this.page = parseInt(page, 10) || 1;
    this.pageCount = pageCount;
    this.hasMore = hasMore;
    if (hasMore) {
      this.nextPage = this.page + 1;
    } else {
      this.nextPage = null;
    }
    if (page > 1) {
      this.previousPage = page - 1;
    } else {
      this.previousPage = null;
    }
  }
}
