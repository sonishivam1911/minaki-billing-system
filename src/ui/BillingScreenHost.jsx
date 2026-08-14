import React from 'react';
import { Box } from '@mui/material';
import { billingUiBuilder } from './BillingUiBuilder';

/**
 * Thin React host for a BillingScreen class instance.
 * Screens stay classes; this file is the only React adapter they need.
 */
export const BillingScreenHost = ({
  screen,
  builder = billingUiBuilder,
  filters,
  onFiltersChange,
  rows = [],
  summary = null,
  loading = false,
  error = null,
  onRetry,
  pagination = null,
  onPageChange,
  extra = null,
  onSort,
  sortBy,
  sortOrder,
}) => {
  const columns = screen.columns();
  const filterFields = typeof screen.filterFields === 'function' ? screen.filterFields() : [];
  const filterKeys = screen.filterKeys();
  const summaryCards = screen.summaryCards(summary);
  const chartConfig = typeof screen.chartConfig === 'function' ? screen.chartConfig(rows) : null;

  if (loading && (!rows || rows.length === 0)) {
    return builder.page({
      title: screen.title,
      description: screen.description,
      children: builder.skeleton(),
    });
  }

  return builder.page({
    title: screen.title,
    description: screen.description,
    actions: (
      builder.exportButton({
        data: rows,
        columns,
        reportType: screen.id,
        reportTitle: screen.title,
        summary,
      })
    ),
    children: (
      <>
        {error ? builder.error(error, onRetry) : null}
        {filterFields.length > 0
          ? builder.filters({
              fields: filterFields,
              filters,
              onFiltersChange,
            })
          : filterKeys.length > 0
            ? builder.filters({
                filters,
                onFiltersChange,
                availableFilters: filterKeys,
                defaultOpen: true,
              })
            : null}
        {summaryCards.length > 0 ? builder.summaryCards(summaryCards) : null}
        {chartConfig ? builder.charts(chartConfig) : null}
        {extra}
        {builder.table({
          columns,
          data: rows,
          loading,
          emptyMessage: screen.emptyMessage(),
          onSort,
          sortBy,
          sortOrder,
        })}
        {pagination && pagination.totalPages > 1 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            {builder.pagination({
              currentPage: pagination.currentPage,
              totalPages: pagination.totalPages,
              onPageChange,
            })}
          </Box>
        ) : null}
      </>
    ),
  });
};
