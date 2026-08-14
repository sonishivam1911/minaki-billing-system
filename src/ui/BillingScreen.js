/**
 * Base class for every billing screen.
 * Subclasses declare title, filters, and columns.
 * React pages only host an instance via BillingScreenHost.
 */
export class BillingScreen {
  constructor({ id, title, description } = {}) {
    this.id = id;
    this.title = title;
    this.description = description || '';
  }

  filterKeys() {
    return [];
  }

  filterFields() {
    return [];
  }

  defaultFilters() {
    return {};
  }

  columns() {
    return [];
  }

  summaryCards(_summary) {
    return [];
  }

  emptyMessage() {
    return 'No rows for these filters.';
  }
}
