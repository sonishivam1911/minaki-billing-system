import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Tabs,
  Tab,
  Chip,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Collapse,
  Stack,
} from '@mui/material';
import {
  Search,
  Download,
  RefreshCw,
  Play,
  Square,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { seoApi } from '../../services/seoApi';
import { SeoSubnav } from '../../components/seo/SeoSubnav';
import { AgentsHowTo } from '../../components/agents/AgentsHowTo';
import { AGENT_HOW_TO } from '../../components/agents/agentHowToCopy';
import { ErrorMessage } from '../../components';

const POLL_INTERVAL_MS = 5000;
const KEYWORD_CHART_TOP_N = 15;
const BRAND_COLOR = '#8b6f47';
const PAGE_SIZE_OPTIONS = [25, 50, 100];

function downloadCsv(filename, rows, columns) {
  const escape = (val) => {
    const s = val == null ? '' : String(val);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map((c) => escape(c.label)).join(',');
  const lines = rows.map((row) => columns.map((c) => escape(c.value(row))).join(','));
  const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function StatCard({ label, value, tone }) {
  const toneColor =
    tone === 'success' ? 'success.main' : tone === 'error' ? 'error.main' : tone === 'warning' ? 'warning.main' : 'text.primary';
  return (
    <Card variant="outlined" sx={{ minWidth: 130, flex: '1 1 130px' }}>
      <CardContent sx={{ py: 1.25, px: 1.75, '&:last-child': { pb: 1.25 } }}>
        <Typography variant="caption" color="text.secondary" noWrap>
          {label}
        </Typography>
        <Typography variant="h6" fontWeight={700} sx={{ color: toneColor, lineHeight: 1.3 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

const CRAWL_STATUS_COLORS = { completed: 'success', running: 'info', failed: 'error', cancelled: 'default' };

function CrawlStatusChip({ status }) {
  return <Chip size="small" color={CRAWL_STATUS_COLORS[status] || 'default'} label={status} sx={{ textTransform: 'capitalize' }} />;
}

const KEYWORD_STATUS_COLORS = { done: 'success', failed: 'error', pending: 'default', skipped: 'default' };

function KeywordStatusChip({ status }) {
  return <Chip size="small" variant="outlined" color={KEYWORD_STATUS_COLORS[status] || 'default'} label={status} />;
}

function SchemaValidChip({ valid }) {
  return valid ? (
    <Chip size="small" color="success" label="Valid" />
  ) : (
    <Chip size="small" color="error" label="Invalid" />
  );
}

export const SiteCrawlPage = () => {
  const [domain, setDomain] = useState('minaki.shop');
  const [maxPages, setMaxPages] = useState(1000);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  const [crawls, setCrawls] = useState([]);
  const [crawlsLoading, setCrawlsLoading] = useState(false);
  const [crawlsSearch, setCrawlsSearch] = useState('');
  const [crawlsStatusFilter, setCrawlsStatusFilter] = useState('');

  const [selectedId, setSelectedId] = useState(null);
  const [crawl, setCrawl] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [resuming, setResuming] = useState(false);

  const [activeTab, setActiveTab] = useState('overview');

  // Pages tab
  const [pageTypeFilter, setPageTypeFilter] = useState('');
  const [keywordStatusFilter, setKeywordStatusFilter] = useState('');
  const [schemaStatusFilter, setSchemaStatusFilter] = useState('');
  const [pagesSearchInput, setPagesSearchInput] = useState('');
  const [pagesSearch, setPagesSearch] = useState('');
  const [pagesPage, setPagesPage] = useState(0);
  const [pagesPageSize, setPagesPageSize] = useState(50);
  const [pages, setPages] = useState({ items: [], total: 0 });
  const [pagesLoading, setPagesLoading] = useState(false);
  const [pagesSort, setPagesSort] = useState({ key: null, dir: 'asc' });

  const [selectedPageUrl, setSelectedPageUrl] = useState(null);
  const [pageDetail, setPageDetail] = useState(null);
  const [pageDetailLoading, setPageDetailLoading] = useState(false);

  // Keywords tab
  const [extractingAll, setExtractingAll] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState(null);
  const [keywordReport, setKeywordReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [keywordsSearch, setKeywordsSearch] = useState('');

  // Schema tab
  const [checkingSchema, setCheckingSchema] = useState(false);
  const [schemaStatus, setSchemaStatus] = useState(null);
  const [schemaReport, setSchemaReport] = useState(null);
  const [schemaReportLoading, setSchemaReportLoading] = useState(false);
  const [schemaValidFilter, setSchemaValidFilter] = useState('');
  const [schemaSearch, setSchemaSearch] = useState('');

  const loadCrawls = useCallback(async () => {
    setCrawlsLoading(true);
    try {
      const res = await seoApi.listSiteCrawls({ limit: 50 });
      setCrawls(res.items || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setCrawlsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCrawls();
  }, [loadCrawls]);

  const visibleCrawls = useMemo(() => {
    return crawls.filter((c) => {
      if (crawlsStatusFilter && c.status !== crawlsStatusFilter) return false;
      if (crawlsSearch && !c.domain.toLowerCase().includes(crawlsSearch.toLowerCase())) return false;
      return true;
    });
  }, [crawls, crawlsStatusFilter, crawlsSearch]);

  const refreshCrawl = useCallback(async () => {
    if (!selectedId) return;
    try {
      setCrawl(await seoApi.getSiteCrawl(selectedId));
    } catch (e) {
      setError(e.message);
    }
  }, [selectedId]);

  useEffect(() => {
    refreshCrawl();
  }, [refreshCrawl]);

  useEffect(() => {
    if (!selectedId || crawl?.status !== 'running') return undefined;
    const timer = setInterval(refreshCrawl, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [selectedId, crawl?.status, refreshCrawl]);

  const loadExtractionStatus = useCallback(async () => {
    if (!selectedId) return;
    try {
      setExtractionStatus(await seoApi.getSiteCrawlKeywordExtractionStatus(selectedId));
    } catch (e) {
      setError(e.message);
    }
  }, [selectedId]);

  useEffect(() => {
    loadExtractionStatus();
  }, [loadExtractionStatus]);

  useEffect(() => {
    if (!selectedId || !extractionStatus?.in_progress) return undefined;
    const timer = setInterval(loadExtractionStatus, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [selectedId, extractionStatus?.in_progress, loadExtractionStatus]);

  const loadSchemaStatus = useCallback(async () => {
    if (!selectedId) return;
    try {
      setSchemaStatus(await seoApi.getSiteCrawlSchemaCheckStatus(selectedId));
    } catch (e) {
      setError(e.message);
    }
  }, [selectedId]);

  useEffect(() => {
    loadSchemaStatus();
  }, [loadSchemaStatus]);

  useEffect(() => {
    if (!selectedId || !schemaStatus?.in_progress) return undefined;
    const timer = setInterval(loadSchemaStatus, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [selectedId, schemaStatus?.in_progress, loadSchemaStatus]);

  const loadPages = useCallback(async () => {
    if (!selectedId) return;
    setPagesLoading(true);
    try {
      const res = await seoApi.listSiteCrawlPages(selectedId, {
        page_type: pageTypeFilter || undefined,
        keyword_extraction_status: keywordStatusFilter || undefined,
        schema_check_status: schemaStatusFilter || undefined,
        search: pagesSearch || undefined,
        limit: pagesPageSize,
        offset: pagesPage * pagesPageSize,
      });
      setPages(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setPagesLoading(false);
    }
  }, [selectedId, pageTypeFilter, keywordStatusFilter, schemaStatusFilter, pagesSearch, pagesPage, pagesPageSize]);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  const sortedPageItems = useMemo(() => {
    const items = [...pages.items];
    if (!pagesSort.key) return items;
    const dir = pagesSort.dir === 'asc' ? 1 : -1;
    return items.sort((a, b) => {
      const av = a[pagesSort.key] ?? '';
      const bv = b[pagesSort.key] ?? '';
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }, [pages.items, pagesSort]);

  const togglePagesSort = (key) => {
    setPagesSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    );
  };

  const startCrawl = async () => {
    if (!domain.trim()) {
      setError('Enter a domain');
      return;
    }
    setStarting(true);
    setError(null);
    try {
      const res = await seoApi.startSiteCrawl({
        domain: domain.trim(),
        max_pages: Math.max(1, Math.min(50000, Number(maxPages) || 1000)),
      });
      await loadCrawls();
      selectCrawl(res.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setStarting(false);
    }
  };

  const openPageDetail = async (url) => {
    if (selectedPageUrl === url) {
      setSelectedPageUrl(null);
      setPageDetail(null);
      return;
    }
    setSelectedPageUrl(url);
    setPageDetail(null);
    setPageDetailLoading(true);
    try {
      setPageDetail(await seoApi.getSiteCrawlPageDetail(selectedId, url));
    } catch (e) {
      setError(e.message);
    } finally {
      setPageDetailLoading(false);
    }
  };

  const extractAllKeywords = async () => {
    setExtractingAll(true);
    setError(null);
    try {
      await seoApi.extractSiteCrawlKeywords(selectedId, {});
    } catch (e) {
      setError(e.message);
    } finally {
      setExtractingAll(false);
      setTimeout(() => {
        loadExtractionStatus();
        refreshCrawl();
        loadPages();
      }, 1500);
    }
  };

  const checkAllSchema = async () => {
    setCheckingSchema(true);
    setError(null);
    try {
      await seoApi.checkSiteCrawlSchema(selectedId, {});
    } catch (e) {
      setError(e.message);
    } finally {
      setCheckingSchema(false);
      setTimeout(() => {
        loadSchemaStatus();
        loadPages();
      }, 1500);
    }
  };

  const cancelCrawl = async () => {
    setCancelling(true);
    setError(null);
    try {
      await seoApi.cancelSiteCrawl(selectedId);
      await Promise.all([refreshCrawl(), loadCrawls()]);
    } catch (e) {
      setError(e.message);
    } finally {
      setCancelling(false);
    }
  };

  const resumeCrawl = async () => {
    setResuming(true);
    setError(null);
    try {
      await seoApi.resumeSiteCrawl(selectedId);
      await Promise.all([refreshCrawl(), loadCrawls()]);
    } catch (e) {
      setError(e.message);
    } finally {
      setResuming(false);
    }
  };

  const loadKeywordReport = async () => {
    setReportLoading(true);
    setError(null);
    try {
      setKeywordReport(await seoApi.getSiteCrawlKeywordReport(selectedId, { limit: 100 }));
    } catch (e) {
      setError(e.message);
    } finally {
      setReportLoading(false);
    }
  };

  const loadSchemaReport = async () => {
    setSchemaReportLoading(true);
    setError(null);
    try {
      setSchemaReport(await seoApi.getSiteCrawlSchemaReport(selectedId, { limit: 500 }));
    } catch (e) {
      setError(e.message);
    } finally {
      setSchemaReportLoading(false);
    }
  };

  const selectCrawl = (id) => {
    setSelectedId(id);
    setCrawl(null);
    setActiveTab('overview');
    setPages({ items: [], total: 0 });
    setPagesPage(0);
    setSelectedPageUrl(null);
    setPageDetail(null);
    setKeywordReport(null);
    setExtractionStatus(null);
    setSchemaStatus(null);
    setSchemaReport(null);
  };

  const filteredKeywords = useMemo(() => {
    if (!keywordReport) return [];
    if (!keywordsSearch) return keywordReport.keywords;
    return keywordReport.keywords.filter((k) => k.keyword.toLowerCase().includes(keywordsSearch.toLowerCase()));
  }, [keywordReport, keywordsSearch]);

  const filteredSchemaPages = useMemo(() => {
    if (!schemaReport) return [];
    return schemaReport.pages.filter((p) => {
      if (schemaValidFilter === 'valid' && !p.valid) return false;
      if (schemaValidFilter === 'invalid' && p.valid) return false;
      if (schemaSearch && !p.page_url.toLowerCase().includes(schemaSearch.toLowerCase())) return false;
      return true;
    });
  }, [schemaReport, schemaValidFilter, schemaSearch]);

  return (
    <div className="screen-container agents-page">
      <div className="screen-header">
        <div>
          <h1 className="screen-title">Site Crawl</h1>
          <p className="screen-subtitle">
            Scrape a whole Shopify site, extract keywords, validate structured data — one click per domain
          </p>
        </div>
      </div>
      <SeoSubnav />
      <AgentsHowTo {...AGENT_HOW_TO.siteCrawl} />
      {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}

      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
            New crawl
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
            <TextField
              size="small"
              label="Domain"
              placeholder="minaki.shop"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              sx={{ minWidth: 220 }}
            />
            <TextField
              size="small"
              label="Max pages"
              type="number"
              value={maxPages}
              onChange={(e) => setMaxPages(e.target.value)}
              sx={{ width: 140 }}
            />
            <Button
              variant="contained"
              sx={{ bgcolor: BRAND_COLOR, '&:hover': { bgcolor: BRAND_COLOR } }}
              startIcon={<Play size={16} />}
              onClick={startCrawl}
              disabled={starting}
            >
              {starting ? 'Starting…' : 'Start crawl'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ sm: 'center' }} sx={{ mb: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={700}>
              Crawls
            </Typography>
            <Stack direction="row" spacing={1}>
              <TextField
                size="small"
                placeholder="Search domain…"
                value={crawlsSearch}
                onChange={(e) => setCrawlsSearch(e.target.value)}
                InputProps={{ startAdornment: <Search size={16} style={{ marginRight: 6, opacity: 0.5 }} /> }}
              />
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Status</InputLabel>
                <Select label="Status" value={crawlsStatusFilter} onChange={(e) => setCrawlsStatusFilter(e.target.value)}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="running">Running</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
              <IconButton onClick={loadCrawls} title="Refresh">
                <RefreshCw size={18} />
              </IconButton>
            </Stack>
          </Stack>
          {crawlsLoading ? (
            <LinearProgress />
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Domain</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Progress</TableCell>
                    <TableCell>Failed</TableCell>
                    <TableCell>Started</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleCrawls.map((c) => (
                    <TableRow key={c.id} hover selected={selectedId === c.id}>
                      <TableCell>{c.domain}</TableCell>
                      <TableCell><CrawlStatusChip status={c.status} /></TableCell>
                      <TableCell>{c.pages_scraped ?? 0} / {c.total_urls_discovered ?? '?'}</TableCell>
                      <TableCell>{c.pages_failed ?? 0}</TableCell>
                      <TableCell>{c.started_at ? new Date(c.started_at).toLocaleString() : '—'}</TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => selectCrawl(c.id)}>
                          {selectedId === c.id ? 'Selected' : 'View'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {visibleCrawls.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary' }}>
                        No crawls match this filter.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {selectedId && crawl && (
        <Card variant="outlined">
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} sx={{ pt: 1.5 }}>
              <Typography variant="h6" fontWeight={700}>
                {crawl.domain}
              </Typography>
              <CrawlStatusChip status={crawl.status} />
            </Stack>
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} textColor="inherit" TabIndicatorProps={{ style: { backgroundColor: BRAND_COLOR } }}>
              <Tab value="overview" label="Overview" />
              <Tab value="pages" label={`Pages (${pages.total || 0})`} />
              <Tab value="keywords" label="Keywords" />
              <Tab value="schema" label="Schema" />
            </Tabs>
          </Box>

          <CardContent>
            {activeTab === 'overview' && (
              <Box>
                <Stack direction="row" flexWrap="wrap" gap={1.5} sx={{ mb: 2 }}>
                  <StatCard label="URLs discovered" value={crawl.total_urls_discovered ?? '—'} />
                  <StatCard label="Pages scraped" value={crawl.pages_scraped ?? 0} tone="success" />
                  <StatCard label="Pages failed" value={crawl.pages_failed ?? 0} tone={crawl.pages_failed ? 'error' : undefined} />
                  <StatCard label="Keywords extracted" value={extractionStatus?.percent_complete != null ? `${extractionStatus.percent_complete}%` : '—'} />
                  <StatCard label="Schema checked" value={schemaStatus?.percent_complete != null ? `${schemaStatus.percent_complete}%` : '—'} />
                  <StatCard
                    label="Schema valid"
                    value={schemaStatus ? `${schemaStatus.pages_valid}/${schemaStatus.pages_checked}` : '—'}
                    tone={schemaStatus && schemaStatus.pages_invalid > 0 ? 'warning' : 'success'}
                  />
                </Stack>
                {crawl.error_message && (
                  <Typography variant="body2" color="error.main" sx={{ mb: 2 }}>
                    Error: {crawl.error_message}
                  </Typography>
                )}
                <Stack direction="row" spacing={1}>
                  <Button size="small" startIcon={<RefreshCw size={16} />} onClick={refreshCrawl}>
                    Refresh now
                  </Button>
                  {crawl.status === 'running' && (
                    <Button size="small" color="error" startIcon={<Square size={16} />} onClick={cancelCrawl} disabled={cancelling}>
                      {cancelling ? 'Cancelling…' : 'Cancel crawl'}
                    </Button>
                  )}
                  {(crawl.status === 'cancelled' || crawl.status === 'failed') && (
                    <Button
                      size="small"
                      variant="contained"
                      sx={{ bgcolor: BRAND_COLOR, '&:hover': { bgcolor: BRAND_COLOR } }}
                      startIcon={<RotateCcw size={16} />}
                      onClick={resumeCrawl}
                      disabled={resuming}
                    >
                      {resuming ? 'Resuming…' : 'Resume crawl'}
                    </Button>
                  )}
                </Stack>
              </Box>
            )}

            {activeTab === 'pages' && (
              <Box>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }} flexWrap="wrap">
                  <TextField
                    size="small"
                    placeholder="Search URL or title…"
                    value={pagesSearchInput}
                    onChange={(e) => setPagesSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setPagesPage(0);
                        setPagesSearch(pagesSearchInput);
                      }
                    }}
                    InputProps={{ startAdornment: <Search size={16} style={{ marginRight: 6, opacity: 0.5 }} /> }}
                    sx={{ minWidth: 220 }}
                  />
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Type</InputLabel>
                    <Select label="Type" value={pageTypeFilter} onChange={(e) => { setPageTypeFilter(e.target.value); setPagesPage(0); }}>
                      <MenuItem value="">All types</MenuItem>
                      <MenuItem value="product">Product</MenuItem>
                      <MenuItem value="collection">Collection</MenuItem>
                      <MenuItem value="page">Page</MenuItem>
                      <MenuItem value="article">Article</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel>Keyword status</InputLabel>
                    <Select label="Keyword status" value={keywordStatusFilter} onChange={(e) => { setKeywordStatusFilter(e.target.value); setPagesPage(0); }}>
                      <MenuItem value="">Any</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="done">Done</MenuItem>
                      <MenuItem value="failed">Failed</MenuItem>
                      <MenuItem value="skipped">Skipped</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Schema status</InputLabel>
                    <Select label="Schema status" value={schemaStatusFilter} onChange={(e) => { setSchemaStatusFilter(e.target.value); setPagesPage(0); }}>
                      <MenuItem value="">Any</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="done">Done</MenuItem>
                      <MenuItem value="failed">Failed</MenuItem>
                    </Select>
                  </FormControl>
                  <Button
                    size="small"
                    startIcon={<Download size={16} />}
                    onClick={() =>
                      downloadCsv(`${crawl.domain}-pages.csv`, sortedPageItems, [
                        { label: 'URL', value: (r) => r.url },
                        { label: 'Type', value: (r) => r.page_type },
                        { label: 'Status', value: (r) => r.status_code },
                        { label: 'Title', value: (r) => r.title },
                        { label: 'Keyword status', value: (r) => r.keyword_extraction_status },
                        { label: 'Schema status', value: (r) => r.schema_check_status },
                      ])
                    }
                    disabled={!sortedPageItems.length}
                  >
                    Export shown
                  </Button>
                </Stack>

                {pagesLoading ? (
                  <LinearProgress />
                ) : (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          {[
                            ['url', 'URL'], ['page_type', 'Type'], ['status_code', 'Status'],
                            ['title', 'Title'], ['keyword_extraction_status', 'Keyword'], ['schema_check_status', 'Schema'],
                          ].map(([key, label]) => (
                            <TableCell key={key} onClick={() => togglePagesSort(key)} sx={{ cursor: 'pointer', userSelect: 'none' }}>
                              <Stack direction="row" alignItems="center" spacing={0.5}>
                                <span>{label}</span>
                                {pagesSort.key === key && (pagesSort.dir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                              </Stack>
                            </TableCell>
                          ))}
                          <TableCell />
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sortedPageItems.map((p) => (
                          <React.Fragment key={p.id}>
                            <TableRow hover>
                              <TableCell sx={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.url}</TableCell>
                              <TableCell>{p.page_type}</TableCell>
                              <TableCell>{p.status_code ?? '—'}</TableCell>
                              <TableCell sx={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title || '—'}</TableCell>
                              <TableCell><KeywordStatusChip status={p.keyword_extraction_status} /></TableCell>
                              <TableCell><KeywordStatusChip status={p.schema_check_status} /></TableCell>
                              <TableCell align="right">
                                <IconButton size="small" onClick={() => openPageDetail(p.url)}>
                                  {selectedPageUrl === p.url ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </IconButton>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell colSpan={7} sx={{ p: 0, border: 0 }}>
                                <Collapse in={selectedPageUrl === p.url}>
                                  <Box sx={{ p: 2, bgcolor: 'action.hover' }}>
                                    {pageDetailLoading ? (
                                      <LinearProgress />
                                    ) : pageDetail ? (
                                      <Stack spacing={0.5}>
                                        <Typography variant="body2"><strong>Meta description:</strong> {pageDetail.meta_description || '—'}</Typography>
                                        <Typography variant="body2">
                                          <strong>Raw HTML:</strong>{' '}
                                          {pageDetail.raw_html ? `stored (${pageDetail.raw_html.length.toLocaleString()} chars)` : 'not stored'}
                                        </Typography>
                                        <Typography variant="body2"><strong>Text snippet:</strong> {(pageDetail.text_snippet || '').slice(0, 500)}</Typography>
                                        {pageDetail.shopify_json && (
                                          <details>
                                            <summary>Shopify JSON</summary>
                                            <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto' }}>
                                              {JSON.stringify(pageDetail.shopify_json, null, 2).slice(0, 5000)}
                                            </pre>
                                          </details>
                                        )}
                                      </Stack>
                                    ) : null}
                                  </Box>
                                </Collapse>
                              </TableCell>
                            </TableRow>
                          </React.Fragment>
                        ))}
                      </TableBody>
                    </Table>
                    <TablePagination
                      component="div"
                      count={pages.total}
                      page={pagesPage}
                      onPageChange={(_, p) => setPagesPage(p)}
                      rowsPerPage={pagesPageSize}
                      onRowsPerPageChange={(e) => { setPagesPageSize(Number(e.target.value)); setPagesPage(0); }}
                      rowsPerPageOptions={PAGE_SIZE_OPTIONS}
                    />
                  </TableContainer>
                )}
              </Box>
            )}

            {activeTab === 'keywords' && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Runs automatically once the crawl finishes. Use Extract all to (re)start it by hand, or force a retry of anything still pending.
                </Typography>
                {extractionStatus && (
                  <Stack direction="row" flexWrap="wrap" gap={1.5} sx={{ mb: 2 }}>
                    <StatCard label="Status" value={extractionStatus.in_progress ? 'Extracting…' : 'Idle'} />
                    <StatCard label="Percent complete" value={`${extractionStatus.percent_complete}%`} />
                    <StatCard label="Pending" value={extractionStatus.pending} />
                    <StatCard label="Done" value={extractionStatus.done} tone="success" />
                    <StatCard label="Failed" value={extractionStatus.failed} tone={extractionStatus.failed ? 'error' : undefined} />
                    <StatCard label="Keywords stored" value={extractionStatus.keywords_stored} />
                    <StatCard label="Distinct keywords" value={extractionStatus.distinct_keywords} />
                  </Stack>
                )}
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <Button
                    variant="contained"
                    sx={{ bgcolor: BRAND_COLOR, '&:hover': { bgcolor: BRAND_COLOR } }}
                    onClick={extractAllKeywords}
                    disabled={extractingAll}
                  >
                    {extractingAll ? 'Starting…' : 'Extract all'}
                  </Button>
                  <Button variant="outlined" startIcon={<RefreshCw size={16} />} onClick={loadExtractionStatus}>
                    Refresh status
                  </Button>
                  <Button variant="outlined" onClick={loadKeywordReport} disabled={reportLoading}>
                    {reportLoading ? 'Loading…' : 'View keyword report'}
                  </Button>
                </Stack>

                {keywordReport && (
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                      <Typography variant="subtitle2">{filteredKeywords.length} of {keywordReport.keywords.length} keywords</Typography>
                      <Stack direction="row" spacing={1}>
                        <TextField
                          size="small"
                          placeholder="Search keyword…"
                          value={keywordsSearch}
                          onChange={(e) => setKeywordsSearch(e.target.value)}
                          InputProps={{ startAdornment: <Search size={16} style={{ marginRight: 6, opacity: 0.5 }} /> }}
                        />
                        <Button
                          size="small"
                          startIcon={<Download size={16} />}
                          onClick={() =>
                            downloadCsv(`${crawl.domain}-keywords.csv`, filteredKeywords, [
                              { label: 'Keyword', value: (r) => r.keyword },
                              { label: 'Pages', value: (r) => r.page_count },
                              { label: 'Total avg monthly searches', value: (r) => r.total_avg_monthly_searches },
                              { label: 'Competition', value: (r) => r.competition },
                            ])
                          }
                          disabled={!filteredKeywords.length}
                        >
                          Export
                        </Button>
                      </Stack>
                    </Stack>
                    {filteredKeywords.length > 0 && (
                      <Box sx={{ width: '100%', height: 360, mb: 2 }}>
                        <ResponsiveContainer>
                          <BarChart data={filteredKeywords.slice(0, KEYWORD_CHART_TOP_N)} layout="vertical" margin={{ left: 24, right: 24 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis type="number" stroke="#6b7280" style={{ fontSize: 12 }} />
                            <YAxis type="category" dataKey="keyword" width={160} stroke="#6b7280" style={{ fontSize: 12 }} />
                            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 4 }} formatter={(v) => [v, 'Avg monthly searches']} />
                            <Bar dataKey="total_avg_monthly_searches" fill={BRAND_COLOR} name="Avg monthly searches" />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    )}
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Keyword</TableCell>
                            <TableCell>Pages</TableCell>
                            <TableCell>Total avg monthly searches</TableCell>
                            <TableCell>Competition</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredKeywords.map((k, i) => (
                            <TableRow key={i} hover>
                              <TableCell>{k.keyword}</TableCell>
                              <TableCell>{k.page_count}</TableCell>
                              <TableCell>{k.total_avg_monthly_searches ?? '—'}</TableCell>
                              <TableCell>{k.competition ?? '—'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
              </Box>
            )}

            {activeTab === 'schema' && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Checks each page's JSON-LD structured data against what Google actually requires for rich results —
                  runs automatically once the crawl finishes.
                </Typography>
                {schemaStatus && (
                  <Stack direction="row" flexWrap="wrap" gap={1.5} sx={{ mb: 2 }}>
                    <StatCard label="Status" value={schemaStatus.in_progress ? 'Checking…' : 'Idle'} />
                    <StatCard label="Percent complete" value={`${schemaStatus.percent_complete}%`} />
                    <StatCard label="Pending" value={schemaStatus.pending} />
                    <StatCard label="Pages checked" value={schemaStatus.pages_checked} />
                    <StatCard label="Valid" value={schemaStatus.pages_valid} tone="success" />
                    <StatCard label="Invalid" value={schemaStatus.pages_invalid} tone={schemaStatus.pages_invalid ? 'error' : undefined} />
                  </Stack>
                )}
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <Button
                    variant="contained"
                    sx={{ bgcolor: BRAND_COLOR, '&:hover': { bgcolor: BRAND_COLOR } }}
                    onClick={checkAllSchema}
                    disabled={checkingSchema}
                  >
                    {checkingSchema ? 'Starting…' : 'Check all'}
                  </Button>
                  <Button variant="outlined" startIcon={<RefreshCw size={16} />} onClick={loadSchemaStatus}>
                    Refresh status
                  </Button>
                  <Button variant="outlined" onClick={loadSchemaReport} disabled={schemaReportLoading}>
                    {schemaReportLoading ? 'Loading…' : 'View schema report'}
                  </Button>
                </Stack>

                {schemaReport && (
                  <Box>
                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} sx={{ mb: 1.5 }} spacing={1}>
                      <Typography variant="subtitle2">{filteredSchemaPages.length} of {schemaReport.pages.length} pages</Typography>
                      <Stack direction="row" spacing={1}>
                        <TextField
                          size="small"
                          placeholder="Search URL…"
                          value={schemaSearch}
                          onChange={(e) => setSchemaSearch(e.target.value)}
                          InputProps={{ startAdornment: <Search size={16} style={{ marginRight: 6, opacity: 0.5 }} /> }}
                        />
                        <FormControl size="small" sx={{ minWidth: 130 }}>
                          <InputLabel>Validity</InputLabel>
                          <Select label="Validity" value={schemaValidFilter} onChange={(e) => setSchemaValidFilter(e.target.value)}>
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="valid">Valid</MenuItem>
                            <MenuItem value="invalid">Invalid</MenuItem>
                          </Select>
                        </FormControl>
                        <Button
                          size="small"
                          startIcon={<Download size={16} />}
                          onClick={() =>
                            downloadCsv(`${crawl.domain}-schema.csv`, filteredSchemaPages, [
                              { label: 'URL', value: (r) => r.page_url },
                              { label: 'Type', value: (r) => r.page_type },
                              { label: 'Valid', value: (r) => (r.valid ? 'yes' : 'no') },
                              { label: 'Schema types found', value: (r) => (r.schema_types_found || []).join('; ') },
                              { label: 'Missing fields', value: (r) => (r.missing_fields || []).join('; ') },
                              { label: 'Issues', value: (r) => (r.issues || []).join('; ') },
                            ])
                          }
                          disabled={!filteredSchemaPages.length}
                        >
                          Export
                        </Button>
                      </Stack>
                    </Stack>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>URL</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Valid</TableCell>
                            <TableCell>Schema types found</TableCell>
                            <TableCell>Issues</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredSchemaPages.map((p, i) => (
                            <TableRow key={i} hover>
                              <TableCell sx={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.page_url}</TableCell>
                              <TableCell>{p.page_type}</TableCell>
                              <TableCell><SchemaValidChip valid={p.valid} /></TableCell>
                              <TableCell>{(p.schema_types_found || []).join(', ') || '—'}</TableCell>
                              <TableCell sx={{ maxWidth: 360 }}>
                                {(p.issues || []).length ? (
                                  <Stack spacing={0.25}>
                                    {p.issues.map((issue, idx) => (
                                      <Typography key={idx} variant="caption" color="text.secondary">• {issue}</Typography>
                                    ))}
                                  </Stack>
                                ) : '—'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
