const toNumber = (value) => {
  if (value == null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const safeDivide = (numerator, denominator) => {
  const top = toNumber(numerator);
  const bottom = toNumber(denominator);
  if (top == null || bottom == null || bottom === 0) return null;
  return top / bottom;
};

/**
 * Enrich Meta metrics with derived rates/efficiency fields.
 * Passes through any impressions/CTR the API already provides.
 */
export const enrichMetaMetrics = (rawMetrics = {}) => {
  const spend = toNumber(rawMetrics.spend);
  const clicks = toNumber(rawMetrics.clicks);
  const impressions = toNumber(rawMetrics.impressions);
  const addToCart = toNumber(rawMetrics.add_to_cart);
  const purchases = toNumber(rawMetrics.purchases);
  const purchaseValue = toNumber(rawMetrics.purchase_value);
  const roas = toNumber(rawMetrics.roas);

  const ctrFromApi = toNumber(rawMetrics.ctr);
  const cpcFromApi = toNumber(rawMetrics.cpc);
  const cpmFromApi = toNumber(rawMetrics.cpm);
  const clickThroughRatio = safeDivide(clicks, impressions);
  const spendPerImpression = safeDivide(spend, impressions);
  const addToCartRate = safeDivide(addToCart, clicks);
  const purchaseRate = safeDivide(purchases, clicks);

  return {
    spend,
    clicks,
    impressions,
    add_to_cart: addToCart,
    purchases,
    purchase_value: purchaseValue,
    roas,
    ctr: ctrFromApi ?? (clickThroughRatio != null ? clickThroughRatio * 100 : null),
    cpc: cpcFromApi ?? safeDivide(spend, clicks),
    cpm: cpmFromApi ?? (spendPerImpression != null ? spendPerImpression * 1000 : null),
    cost_per_atc: safeDivide(spend, addToCart),
    cost_per_purchase: safeDivide(spend, purchases),
    atc_rate: addToCartRate != null ? addToCartRate * 100 : null,
    purchase_rate: purchaseRate != null ? purchaseRate * 100 : null,
    average_order_value: safeDivide(purchaseValue, purchases),
  };
};

export const META_CHART_METRICS = [
  { key: 'clicks', label: 'Clicks', format: 'number', color: '#0288d1' },
  { key: 'spend', label: 'Spend', format: 'currency', color: '#8b6f47' },
  { key: 'impressions', label: 'Impressions', format: 'number', color: '#6b7280' },
  { key: 'ctr', label: 'CTR %', format: 'percentage', color: '#9c27b0' },
  { key: 'cpc', label: 'CPC', format: 'currency', color: '#ed6c02' },
  { key: 'add_to_cart', label: 'Add to cart', format: 'number', color: '#00bcd4' },
  { key: 'purchases', label: 'Purchases', format: 'number', color: '#2e7d32' },
  { key: 'purchase_value', label: 'Purchase value', format: 'currency', color: '#5e8b47' },
  { key: 'roas', label: 'ROAS', format: 'number', color: '#f44336' },
  { key: 'cost_per_purchase', label: 'Cost / purchase', format: 'currency', color: '#795548' },
  { key: 'atc_rate', label: 'ATC rate %', format: 'percentage', color: '#ff9800' },
];

export const DEFAULT_CHART_METRIC = 'clicks';

export const flattenPeriodMetricRows = (periodBuckets = []) =>
  (periodBuckets || []).map((bucket) => {
    const metrics = enrichMetaMetrics(bucket.metrics || {});
    return {
      id: bucket.period,
      period: bucket.period,
      ...metrics,
    };
  });

export const isActiveMetaStatus = (statusValue) =>
  String(statusValue || '').trim().toUpperCase() === 'ACTIVE';
