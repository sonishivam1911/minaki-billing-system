import React from 'react';
import { Box, Container, Stack, Typography } from '@mui/material';
import { Alert } from '@mui/material';
import { DateRangePicker } from '../components/reports/DateRangePicker';
import { ExportButton } from '../components/reports/ExportButton';
import { ReportCharts } from '../components/reports/ReportCharts';
import { ReportFilters } from '../components/reports/ReportFilters';
import { ReportSkeleton } from '../components/reports/ReportSkeleton';
import { ReportSummaryCards } from '../components/reports/ReportSummaryCards';
import { ReportTable } from '../components/reports/ReportTable';
import { AgentsPagedTable } from '../components/agents/AgentsPagedTable';
import { ErrorMessage } from '../components/ErrorMessage';
import { Pagination } from '../components/Pagination';
import { ScreenFilters } from './ScreenFilters';
import { BILLING_PAGE_MAX_WIDTH } from './billingUiConstants';

/**
 * Single source of UI widgets for the billing app.
 * New screens compose through this class instead of importing MUI tables directly.
 */
export class BillingUiBuilder {
  page({ title, description, actions, children }) {
    return (
      <Container maxWidth={BILLING_PAGE_MAX_WIDTH} sx={{ py: { xs: 2, sm: 3 }, px: { xs: 1.5, sm: 2 } }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ mb: 3, alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#2c2416', fontSize: { xs: '1.5rem', sm: '2rem' } }}>
              {title}
            </Typography>
            {description ? (
              <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.5 }}>
                {description}
              </Typography>
            ) : null}
          </Box>
          {actions ? <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>{actions}</Box> : null}
        </Stack>
        {children}
      </Container>
    );
  }

  filters(props) {
    if (props.fields && props.fields.length > 0) {
      return <ScreenFilters {...props} />;
    }
    return <ReportFilters {...props} />;
  }

  dateRange(props) {
    return <DateRangePicker {...props} />;
  }

  summaryCards(cards) {
    return <ReportSummaryCards cards={cards} />;
  }

  table(props) {
    return <ReportTable {...props} />;
  }

  pagedTable(props) {
    return <AgentsPagedTable {...props} />;
  }

  charts(props) {
    return (
      <Box sx={{ mb: 3 }}>
        <ReportCharts {...props} />
      </Box>
    );
  }

  exportButton(props) {
    return <ExportButton {...props} />;
  }

  skeleton() {
    return <ReportSkeleton />;
  }

  pagination(props) {
    return <Pagination {...props} />;
  }

  error(message, onRetry) {
    return <ErrorMessage message={message} onRetry={onRetry} />;
  }

  info(message) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        {message}
      </Alert>
    );
  }
}

export const billingUiBuilder = new BillingUiBuilder();
