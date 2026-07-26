import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Alert,
  Grid,
  Chip,
} from '@mui/material';
import {
  ShoppingCart,
  Users,
  MousePointerClick,
  CheckCircle,
  IndianRupee,
  PackageCheck,
  XCircle,
  TrendingUp,
} from 'lucide-react';
import { differenceInCalendarDays, isSameDay, subDays } from 'date-fns';
import { commerceAnalyticsApi } from '../../services/commerceAnalyticsApi';
import { DateRangePicker } from '../../components/reports/DateRangePicker';
import { ReportSummaryCards } from '../../components/reports/ReportSummaryCards';
import { ReportTable } from '../../components/reports/ReportTable';
import { ReportSkeleton } from '../../components/reports/ReportSkeleton';

const DEFAULT_RANGE_DAYS = 30;
const MAX_LIVE_WINDOW_DAYS = 365;
const TABLE_ROW_LIMIT = 50;

const REPORT_TABS = [
  { id: 'funnel', label: 'Funnel' },
  { id: 'landing-pages', label: 'Landing Pages' },
  { id: 'products', label: 'Products' },
  { id: 'orders', label: 'Orders' },
];

/** Live Admin endpoints only support a rolling window ending today. */
const deriveLiveWindowDays = (startDate) => {
  if (!startDate) return DEFAULT_RANGE_DAYS;
  const elapsedDays = differenceInCalendarDays(new Date(), startDate) + 1;
  return Math.min(Math.max(elapsedDays, 1), MAX_LIVE_WINDOW_DAYS);
};

const formatRatePercent = (value) => {
  if (value === null || value === undefined) return 'N/A';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return 'N/A';
  const percent = numeric <= 1 ? numeric * 100 : numeric;
  return `${percent.toFixed(2)}%`;
};

const SectionError = ({ title, message }) => (
  <Alert severity="warning" sx={{ mb: 2 }}>
    {title}: {message}
  </Alert>
);

const SectionTitle = ({ children }) => (
  <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c2416', mb: 1.5, mt: 3 }}>
    {children}
  </Typography>
);

export const ShopifyCommerceReportPage = () => {
  const [startDate, setStartDate] = useState(() => subDays(new Date(), DEFAULT_RANGE_DAYS - 1));
  const [endDate, setEndDate] = useState(() => new Date());
  const [activeTab, setActiveTab] = useState('funnel');
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState({});

  const liveWindowDays = deriveLiveWindowDays(startDate);
  const rangeEndsToday = !endDate || isSameDay(endDate, new Date());

  const loadReport = useCallback(async () => {
    setLoading(true);
    const dateRange = { since: startDate, until: endDate };
    const liveWindow = { days: deriveLiveWindowDays(startDate) };

    const requests = {
      sessionFunnel: commerceAnalyticsApi.getSessionFunnel(dateRange),
      commerceFunnel: commerceAnalyticsApi.getCommerceFunnel(liveWindow),
      ordersSummary: commerceAnalyticsApi.getOrdersSummary(liveWindow),
      topOrderedProducts: commerceAnalyticsApi.getTopOrderedProducts({ ...liveWindow, limit: TABLE_ROW_LIMIT }),
      topCartProducts: commerceAnalyticsApi.getTopCartProducts({ ...liveWindow, limit: TABLE_ROW_LIMIT }),
      landingPages: commerceAnalyticsApi.getTopLandingPages({ ...dateRange, limit: TABLE_ROW_LIMIT }),
      viewedProducts: commerceAnalyticsApi.getTopViewedProducts({ ...dateRange, limit: TABLE_ROW_LIMIT }),
      addToCartByCity: commerceAnalyticsApi.getAddToCartByCity({ ...liveWindow, limit: TABLE_ROW_LIMIT }),
    };

    const keys = Object.keys(requests);
    const settled = await Promise.allSettled(Object.values(requests));
    const nextSections = {};
    keys.forEach((key, index) => {
      const outcome = settled[index];
      nextSections[key] = outcome.status === 'fulfilled'
        ? { data: outcome.value?.data, error: null }
        : { data: null, error: outcome.reason?.message || 'Request failed' };
    });
    setSections(nextSections);
    setLoading(false);
  }, [startDate, endDate]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const sessionFunnel = sections.sessionFunnel?.data;
  const commerceFunnel = sections.commerceFunnel?.data;
  const ordersSummary = sections.ordersSummary?.data;

  const funnelCards = sessionFunnel ? [
    { title: 'Sessions', value: sessionFunnel.sessions || 0, format: 'number', color: 'primary', icon: Users },
    { title: 'Sessions with Cart Adds', value: sessionFunnel.sessions_with_cart_additions || 0, format: 'number', color: 'info', icon: ShoppingCart },
    { title: 'Reached Checkout', value: sessionFunnel.sessions_that_reached_checkout || 0, format: 'number', color: 'warning', icon: MousePointerClick },
    { title: 'Completed Checkout', value: sessionFunnel.sessions_that_completed_checkout || 0, format: 'number', color: 'success', icon: CheckCircle },
  ] : [];

  const funnelRateChips = sessionFunnel ? [
    { label: 'Conversion', value: sessionFunnel.conversion_rate },
    { label: 'Added to Cart', value: sessionFunnel.added_to_cart_rate },
    { label: 'Reached Checkout', value: sessionFunnel.reached_checkout_rate },
    { label: 'Bounce', value: sessionFunnel.bounce_rate },
  ].filter((rate) => rate.value !== null && rate.value !== undefined) : [];

  const abandonedCards = commerceFunnel ? [
    { title: 'Abandoned Checkouts', value: commerceFunnel.unique_abandoned_checkouts || 0, format: 'number', color: 'warning', icon: XCircle },
    { title: 'Abandoned Cart Value', value: commerceFunnel.abandoned_cart_value || 0, format: 'currency', color: 'error', icon: ShoppingCart },
    { title: 'Paid Orders', value: commerceFunnel.paid_orders || 0, format: 'number', color: 'success', icon: PackageCheck },
    { title: 'Order Revenue', value: commerceFunnel.order_revenue || 0, format: 'currency', color: 'success', icon: IndianRupee },
  ] : [];

  const orderCards = ordersSummary ? [
    { title: 'Total Orders', value: ordersSummary.orders_count || 0, format: 'number', color: 'primary', icon: PackageCheck },
    { title: 'Paid Orders', value: ordersSummary.paid_orders_count || 0, format: 'number', color: 'success', icon: CheckCircle },
    { title: 'Gross Revenue', value: ordersSummary.gross_revenue || 0, format: 'currency', color: 'success', icon: IndianRupee },
    { title: 'Average Order Value', value: ordersSummary.average_order_value || 0, format: 'currency', color: 'info', icon: TrendingUp },
  ] : [];

  const landingPageColumns = [
    { key: 'landing_page_path', label: 'Landing Page' },
    { key: 'sessions', label: 'Sessions', format: 'number' },
    { key: 'conversion_rate', label: 'Conversion Rate', render: (value) => formatRatePercent(value) },
  ];

  const viewedProductColumns = [
    { key: 'product_title', label: 'Product' },
    { key: 'views', label: 'Views', format: 'number' },
    { key: 'source', label: 'Source' },
  ];

  const cartProductColumns = [
    { key: 'product_title', label: 'Product' },
    { key: 'product_category', label: 'Category' },
    { key: 'count', label: 'Cart Adds', format: 'number' },
    { key: 'channel_family', label: 'Channel' },
  ];

  const orderedProductColumns = [
    { key: 'product_title', label: 'Product' },
    { key: 'units_sold', label: 'Units Sold', format: 'number' },
    { key: 'revenue', label: 'Revenue', format: 'currency' },
  ];

  const cityColumns = [
    { key: 'city', label: 'City' },
    { key: 'product_title', label: 'Product' },
    { key: 'product_category', label: 'Category' },
    { key: 'add_to_cart_count', label: 'Cart Adds', format: 'number' },
    { key: 'city_total_add_to_cart', label: 'City Total', format: 'number' },
  ];

  const renderFunnelTab = () => (
    <Box>
      <SectionTitle>Storefront Session Funnel (Shopify Analytics)</SectionTitle>
      {sections.sessionFunnel?.error && (
        <SectionError title="Session funnel" message={sections.sessionFunnel.error} />
      )}
      {sessionFunnel?.error && (
        <SectionError title="Session funnel" message={sessionFunnel.error} />
      )}
      {funnelCards.length > 0 && <ReportSummaryCards cards={funnelCards} />}
      {funnelRateChips.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          {funnelRateChips.map((rate) => (
            <Chip
              key={rate.label}
              label={`${rate.label}: ${formatRatePercent(rate.value)}`}
              sx={{ backgroundColor: '#f5f1e8', color: '#5d4e37', fontWeight: 600 }}
            />
          ))}
        </Box>
      )}

      <SectionTitle>Abandoned Checkout → Paid Order (Live Admin)</SectionTitle>
      {sections.commerceFunnel?.error && (
        <SectionError title="Commerce funnel" message={sections.commerceFunnel.error} />
      )}
      {abandonedCards.length > 0 && <ReportSummaryCards cards={abandonedCards} />}
      {commerceFunnel?.checkout_to_order_rate_pct !== null && commerceFunnel?.checkout_to_order_rate_pct !== undefined && (
        <Chip
          label={`Checkout → Order Rate: ${commerceFunnel.checkout_to_order_rate_pct}%`}
          sx={{ backgroundColor: '#e8f5e9', color: '#2e7d32', fontWeight: 600, mb: 2 }}
        />
      )}
      {commerceFunnel?.note && (
        <Typography variant="caption" sx={{ display: 'block', color: '#6b7280', mb: 2 }}>
          {commerceFunnel.note}
        </Typography>
      )}

      <SectionTitle>Add to Cart by City</SectionTitle>
      {sections.addToCartByCity?.error && (
        <SectionError title="Add to cart by city" message={sections.addToCartByCity.error} />
      )}
      <ReportTable
        columns={cityColumns}
        data={sections.addToCartByCity?.data?.rows || []}
        emptyMessage="No cart activity by city in this window."
      />
    </Box>
  );

  const renderLandingPagesTab = () => (
    <Box>
      <SectionTitle>Top Landing Pages by Sessions</SectionTitle>
      {sections.landingPages?.error && (
        <SectionError title="Landing pages" message={sections.landingPages.error} />
      )}
      <ReportTable
        columns={landingPageColumns}
        data={sections.landingPages?.data?.landing_pages || []}
        emptyMessage="No landing page sessions for this date range."
      />
    </Box>
  );

  const renderProductsTab = () => (
    <Box>
      <SectionTitle>Top Viewed Products</SectionTitle>
      {sections.viewedProducts?.error && (
        <SectionError title="Product views" message={sections.viewedProducts.error} />
      )}
      <ReportTable
        columns={viewedProductColumns}
        data={sections.viewedProducts?.data?.products || []}
        emptyMessage="No product view data for this date range."
      />

      <SectionTitle>Top Cart Products (Live)</SectionTitle>
      {sections.topCartProducts?.error && (
        <SectionError title="Cart products" message={sections.topCartProducts.error} />
      )}
      <ReportTable
        columns={cartProductColumns}
        data={sections.topCartProducts?.data?.products || []}
        emptyMessage="No cart additions in this window."
      />
    </Box>
  );

  const renderOrdersTab = () => (
    <Box>
      <SectionTitle>Orders Summary</SectionTitle>
      {sections.ordersSummary?.error && (
        <SectionError title="Orders summary" message={sections.ordersSummary.error} />
      )}
      {orderCards.length > 0 && <ReportSummaryCards cards={orderCards} />}
      {ordersSummary?.orders_by_financial_status && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          {Object.entries(ordersSummary.orders_by_financial_status).map(([financialStatus, count]) => (
            <Chip
              key={financialStatus}
              label={`${financialStatus}: ${count}`}
              size="small"
              sx={{ backgroundColor: '#f5f1e8', color: '#5d4e37' }}
            />
          ))}
        </Box>
      )}

      <SectionTitle>Top Ordered Products</SectionTitle>
      {sections.topOrderedProducts?.error && (
        <SectionError title="Top ordered products" message={sections.topOrderedProducts.error} />
      )}
      <ReportTable
        columns={orderedProductColumns}
        data={sections.topOrderedProducts?.data?.products || []}
        emptyMessage="No paid orders in this window."
      />
    </Box>
  );

  const tabContentById = {
    funnel: renderFunnelTab,
    'landing-pages': renderLandingPagesTab,
    products: renderProductsTab,
    orders: renderOrdersTab,
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }} className="report-content">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#2c2416', mb: 0.5 }}>
          Shopify Commerce Report
        </Typography>
        <Typography variant="body2" sx={{ color: '#6b7280' }}>
          Storefront funnel, landing pages, product demand, and orders — live from Shopify
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: 2, p: 3, mb: 3 }}>
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onRangeChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
          }}
        />
        {!rangeEndsToday && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Live cart and order metrics always use a rolling window ending today
            (currently last {liveWindowDays} days). Landing pages, product views, and the
            session funnel honor the exact date range.
          </Alert>
        )}
      </Paper>

      <Tabs
        value={activeTab}
        onChange={(event, nextTab) => setActiveTab(nextTab)}
        sx={{
          mb: 2,
          '& .MuiTab-root.Mui-selected': { color: '#8b6f47' },
          '& .MuiTabs-indicator': { backgroundColor: '#8b6f47' },
        }}
      >
        {REPORT_TABS.map((tab) => (
          <Tab key={tab.id} value={tab.id} label={tab.label} />
        ))}
      </Tabs>

      {loading ? <ReportSkeleton /> : tabContentById[activeTab]()}
    </Container>
  );
};
