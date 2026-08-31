import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { ReportCharts } from '../../components/reports/ReportCharts';
import { seoApi } from '../../services/seoApi';
import { SeoSubnav } from '../../components/seo/SeoSubnav';
import { AgentsHowTo } from '../../components/agents/AgentsHowTo';
import { AGENT_HOW_TO } from '../../components/agents/agentHowToCopy';
import { ErrorMessage } from '../../components';
import { usePolling } from '../../hooks/usePolling';
import { downloadCsv } from '../../utils/csv';

const POLL_INTERVAL_MS = 5000;
const KEYWORD_CHART_TOP_N = 15;
const BRAND_COLOR = '#8b6f47';
const PAGE_SIZE_OPTIONS = [25, 50, 100];

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

  // Overview tab — page-type counts (View 1)
  const [pageTypeSummary, setPageTypeSummary] = useState(null);
  const [pageTypeSummaryLoading, setPageTypeSummaryLoading] = useState(false);

  // Content extraction (structural data) + page embedding — feed the
  // Pages-detail Structural Data panel and are prerequisites for scoring.
  const [contentExtractionStatus, setContentExtractionStatus] = useState(null);
  const [pageEmbeddingStatus, setPageEmbeddingStatus] = useState(null);
  const [pageContent, setPageContent] = useState(null);
  const [pageContentLoading, setPageContentLoading] = useState(false);
  const [pageLinks, setPageLinks] = useState(null);

  // Keyword scoring — replaces the raw keyword list with a scoring
  // breakdown (frequency/relevance/volume/competition -> composite).
  const [scoringAll, setScoringAll] = useState(false);
  const [keywordScoringStatus, setKeywordScoringStatus] = useState(null);
  const [pageKeywordScores, setPageKeywordScores] = useState(null);
  const [pageKeywordScoresLoading, setPageKeywordScoresLoading] = useState(false);

  // SERP & AEO tab
  const [checkingRankings, setCheckingRankings] = useState(false);
  const [serpLookupStatus, setSerpLookupStatus] = useState(null);
  const [pageRankings, setPageRankings] = useState(null);
  const [pageRankingsLoading, setPageRankingsLoading] = useState(false);
  const [aeoKeyword, setAeoKeyword] = useState(null);
  const [aeoSerpSnapshot, setAeoSerpSnapshot] = useState(null);
  const [aeoAutocomplete, setAeoAutocomplete] = useState(null);
  const [aeoTrends, setAeoTrends] = useState(null);
  const [aeoLoading, setAeoLoading] = useState(false);
  const aeoInputRef = useRef(null);

  // Technical SEO tab
  const [checkingTechnical, setCheckingTechnical] = useState(false);
  const [technicalCheckStatus, setTechnicalCheckStatus] = useState(null);
  const [technicalReport, setTechnicalReport] = useState(null);
  const [technicalReportLoading, setTechnicalReportLoading] = useState(false);
  const [technicalPassedFilter, setTechnicalPassedFilter] = useState('');
  const [technicalSearch, setTechnicalSearch] = useState('');

  // CWV tab (manual only)
  const [checkingCwv, setCheckingCwv] = useState(false);
  const [cwvStatus, setCwvStatus] = useState(null);
  const [cwvReport, setCwvReport] = useState(null);
  const [cwvReportLoading, setCwvReportLoading] = useState(false);

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
  usePolling(refreshCrawl, { active: !!selectedId && crawl?.status === 'running' });

  const loadPageTypeSummary = useCallback(async () => {
    if (!selectedId) return;
    setPageTypeSummaryLoading(true);
    try {
      setPageTypeSummary(await seoApi.getSiteCrawlPageTypeSummary(selectedId));
    } catch (e) {
      setError(e.message);
    } finally {
      setPageTypeSummaryLoading(false);
    }
  }, [selectedId]);
  // Counts grow while a crawl is still running, same as the crawl status
  // itself — polled on the same condition as refreshCrawl.
  usePolling(loadPageTypeSummary, { active: !!selectedId && crawl?.status === 'running' });

  const loadExtractionStatus = useCallback(async () => {
    if (!selectedId) return;
    try {
      setExtractionStatus(await seoApi.getSiteCrawlKeywordExtractionStatus(selectedId));
    } catch (e) {
      setError(e.message);
    }
  }, [selectedId]);
  usePolling(loadExtractionStatus, { active: !!selectedId && !!extractionStatus?.in_progress });

  const loadSchemaStatus = useCallback(async () => {
    if (!selectedId) return;
    try {
      setSchemaStatus(await seoApi.getSiteCrawlSchemaCheckStatus(selectedId));
    } catch (e) {
      setError(e.message);
    }
  }, [selectedId]);
  usePolling(loadSchemaStatus, { active: !!selectedId && !!schemaStatus?.in_progress });

  const loadContentExtractionStatus = useCallback(async () => {
    if (!selectedId) return;
    try {
      setContentExtractionStatus(await seoApi.getSiteCrawlContentExtractionStatus(selectedId));
    } catch (e) {
      setError(e.message);
    }
  }, [selectedId]);
  usePolling(loadContentExtractionStatus, { active: !!selectedId && !!contentExtractionStatus?.in_progress });

  const loadPageEmbeddingStatus = useCallback(async () => {
    if (!selectedId) return;
    try {
      setPageEmbeddingStatus(await seoApi.getSiteCrawlPageEmbeddingStatus(selectedId));
    } catch (e) {
      setError(e.message);
    }
  }, [selectedId]);
  usePolling(loadPageEmbeddingStatus, { active: !!selectedId && !!pageEmbeddingStatus?.in_progress });

  const loadKeywordScoringStatus = useCallback(async () => {
    if (!selectedId) return;
    try {
      setKeywordScoringStatus(await seoApi.getSiteCrawlKeywordScoringStatus(selectedId));
    } catch (e) {
      setError(e.message);
    }
  }, [selectedId]);
  usePolling(loadKeywordScoringStatus, { active: !!selectedId && !!keywordScoringStatus?.in_progress });

  const loadSerpLookupStatus = useCallback(async () => {
    if (!selectedId) return;
    try {
      setSerpLookupStatus(await seoApi.getSiteCrawlSerpLookupStatus(selectedId));
    } catch (e) {
      setError(e.message);
    }
  }, [selectedId]);
  usePolling(loadSerpLookupStatus, { active: !!selectedId && !!serpLookupStatus?.in_progress });

  const loadTechnicalCheckStatus = useCallback(async () => {
    if (!selectedId) return;
    try {
      setTechnicalCheckStatus(await seoApi.getSiteCrawlTechnicalCheckStatus(selectedId));
    } catch (e) {
      setError(e.message);
    }
  }, [selectedId]);
  usePolling(loadTechnicalCheckStatus, { active: !!selectedId && !!technicalCheckStatus?.in_progress });

  const loadCwvStatus = useCallback(async () => {
    if (!selectedId) return;
    try {
      setCwvStatus(await seoApi.getSiteCrawlCwvStatus(selectedId));
    } catch (e) {
      setError(e.message);
    }
  }, [selectedId]);
  usePolling(loadCwvStatus, { active: !!selectedId && !!cwvStatus?.in_progress });

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
      setPageContent(null);
      setPageLinks(null);
      setPageKeywordScores(null);
      setPageRankings(null);
      return;
    }
    setSelectedPageUrl(url);
    setPageDetail(null);
    setPageContent(null);
    setPageLinks(null);
    setPageKeywordScores(null);
    setPageRankings(null);
    setPageDetailLoading(true);
    setPageContentLoading(true);
    setPageKeywordScoresLoading(true);
    setPageRankingsLoading(true);
    // Independent panels (Shopify data, structural data, keyword scores,
    // rankings) — one failing (e.g. this page has no scores yet because
    // scoring hasn't run) shouldn't block the others from rendering.
    seoApi.getSiteCrawlPageDetail(selectedId, url)
      .then(setPageDetail)
      .catch((e) => setError(e.message))
      .finally(() => setPageDetailLoading(false));
    seoApi.getSiteCrawlPageContent(selectedId, url)
      .then(setPageContent)
      .catch(() => setPageContent(null))
      .finally(() => setPageContentLoading(false));
    seoApi.getSiteCrawlPageLinks(selectedId, url, { limit: 100 })
      .then(setPageLinks)
      .catch(() => setPageLinks(null));
    seoApi.getSiteCrawlPageKeywordScores(selectedId, url)
      .then(setPageKeywordScores)
      .catch(() => setPageKeywordScores(null))
      .finally(() => setPageKeywordScoresLoading(false));
    seoApi.getSiteCrawlPageRankings(selectedId, url)
      .then(setPageRankings)
      .catch(() => setPageRankings(null))
      .finally(() => setPageRankingsLoading(false));
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

  const scoreAllKeywords = async () => {
    setScoringAll(true);
    setError(null);
    try {
      await seoApi.scoreSiteCrawlKeywords(selectedId, {});
    } catch (e) {
      setError(e.message);
    } finally {
      setScoringAll(false);
      setTimeout(() => {
        loadKeywordScoringStatus();
      }, 1500);
    }
  };

  const checkAllRankings = async () => {
    setCheckingRankings(true);
    setError(null);
    try {
      await seoApi.checkSiteCrawlRankings(selectedId, {});
    } catch (e) {
      setError(e.message);
    } finally {
      setCheckingRankings(false);
      setTimeout(() => {
        loadSerpLookupStatus();
      }, 1500);
    }
  };

  const checkAllTechnical = async () => {
    setCheckingTechnical(true);
    setError(null);
    try {
      await seoApi.checkSiteCrawlTechnical(selectedId, {});
    } catch (e) {
      setError(e.message);
    } finally {
      setCheckingTechnical(false);
      setTimeout(() => {
        loadTechnicalCheckStatus();
        loadPages();
      }, 1500);
    }
  };

  const runCwvCheck = async () => {
    setCheckingCwv(true);
    setError(null);
    try {
      await seoApi.checkSiteCrawlCwv(selectedId, { top_n: 5 });
    } catch (e) {
      setError(e.message);
    } finally {
      setCheckingCwv(false);
      setTimeout(() => {
        loadCwvStatus();
      }, 1500);
    }
  };

  const loadTechnicalReport = async () => {
    setTechnicalReportLoading(true);
    setError(null);
    try {
      setTechnicalReport(await seoApi.getSiteCrawlTechnicalReport(selectedId, { limit: 500 }));
    } catch (e) {
      setError(e.message);
    } finally {
      setTechnicalReportLoading(false);
    }
  };

  const loadCwvReport = async () => {
    setCwvReportLoading(true);
    setError(null);
    try {
      setCwvReport(await seoApi.getSiteCrawlCwvReport(selectedId, { limit: 100 }));
    } catch (e) {
      setError(e.message);
    } finally {
      setCwvReportLoading(false);
    }
  };

  const loadAeoBundle = async (keyword) => {
    if (!keyword || !keyword.trim()) return;
    setAeoKeyword(keyword);
    setAeoSerpSnapshot(null);
    setAeoAutocomplete(null);
    setAeoTrends(null);
    setAeoLoading(true);
    // Independent per-source loads — PAA/Related Searches ride on the SERP
    // snapshot; Autocomplete/Trends are separate free-but-fragile sources.
    // One failing renders as its own "unavailable" state, not a blocked tab.
    Promise.allSettled([
      seoApi.getSerpSnapshot({ keyword }).then(setAeoSerpSnapshot),
      seoApi.getKeywordAutocomplete({ keyword }).then(setAeoAutocomplete),
      seoApi.getKeywordTrends({ keyword }).then(setAeoTrends),
    ]).finally(() => setAeoLoading(false));
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
    // Reset filters/search too — switching crawls with a stale filter
    // silently hiding everything in the new one is a real UX trap.
    setPageTypeFilter('');
    setKeywordStatusFilter('');
    setSchemaStatusFilter('');
    setPagesSearchInput('');
    setPagesSearch('');
    setKeywordsSearch('');
    setSchemaValidFilter('');
    setSchemaSearch('');
    setPageTypeSummary(null);
    setContentExtractionStatus(null);
    setPageEmbeddingStatus(null);
    setPageContent(null);
    setPageLinks(null);
    setKeywordScoringStatus(null);
    setPageKeywordScores(null);
    setSerpLookupStatus(null);
    setPageRankings(null);
    setAeoKeyword(null);
    setAeoSerpSnapshot(null);
    setAeoAutocomplete(null);
    setAeoTrends(null);
    setTechnicalCheckStatus(null);
    setTechnicalReport(null);
    setTechnicalPassedFilter('');
    setTechnicalSearch('');
    setCwvStatus(null);
    setCwvReport(null);
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

  const filteredTechnicalPages = useMemo(() => {
    if (!technicalReport) return [];
    return technicalReport.pages.filter((p) => {
      if (technicalPassedFilter === 'passed' && !p.passed) return false;
      if (technicalPassedFilter === 'failed' && p.passed) return false;
      if (technicalSearch && !p.page_url.toLowerCase().includes(technicalSearch.toLowerCase())) return false;
      return true;
    });
  }, [technicalReport, technicalPassedFilter, technicalSearch]);

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
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              textColor="inherit"
              variant="scrollable"
              scrollButtons="auto"
              TabIndicatorProps={{ style: { backgroundColor: BRAND_COLOR } }}
            >
              <Tab value="overview" label="Overview" />
              <Tab value="pages" label={`Pages (${pages.total || 0})`} />
              <Tab value="keywords" label="Keywords" />
              <Tab value="schema" label="Schema" />
              <Tab value="serp-aeo" label="SERP & AEO" />
              <Tab value="technical" label="Technical SEO" />
              <Tab value="cwv" label="CWV" />
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

                <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 3, mb: 1.5 }}>
                  Page types
                </Typography>
                {pageTypeSummaryLoading && !pageTypeSummary ? (
                  <LinearProgress />
                ) : pageTypeSummary && pageTypeSummary.page_types.length > 0 ? (
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-start">
                    <TableContainer component={Paper} variant="outlined" sx={{ maxWidth: 420 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Page type</TableCell>
                            <TableCell align="right">Count</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {pageTypeSummary.page_types.map((row) => (
                            <TableRow key={row.page_type} hover>
                              <TableCell sx={{ textTransform: 'capitalize' }}>{row.page_type}</TableCell>
                              <TableCell align="right">{row.count.toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                              {pageTypeSummary.total_pages.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <Box sx={{ flex: 1, minWidth: 280, width: '100%' }}>
                      <ReportCharts
                        type="pie"
                        data={pageTypeSummary.page_types.map((row) => ({ name: row.page_type, value: row.count }))}
                        config={{ nameKey: 'name', valueKey: 'value' }}
                      />
                    </Box>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No pages scraped yet.
                  </Typography>
                )}
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
                                      <Stack spacing={0.5} sx={{ mb: 2 }}>
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

                                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                                      Structural data
                                    </Typography>
                                    {pageContentLoading ? (
                                      <LinearProgress sx={{ mb: 2 }} />
                                    ) : pageContent ? (
                                      <Stack spacing={0.5} sx={{ mb: 2 }}>
                                        <Typography variant="body2">
                                          <strong>Canonical:</strong> {pageContent.canonical_url || '—'}
                                        </Typography>
                                        <Typography variant="body2">
                                          <strong>Meta robots:</strong> {pageContent.meta_robots || '—'}
                                        </Typography>
                                        <Typography variant="body2">
                                          <strong>Headings:</strong>{' '}
                                          {(pageContent.headings || []).map((h) => `H${h.level}: ${h.text}`).join(' · ') || '—'}
                                        </Typography>
                                        <Typography variant="body2">
                                          <strong>Image alt coverage:</strong>{' '}
                                          {pageContent.image_alt_coverage_pct != null ? `${pageContent.image_alt_coverage_pct}%` : '—'}
                                          {' '}({pageContent.images_with_alt_count ?? 0}/{pageContent.image_count ?? 0})
                                        </Typography>
                                        <Typography variant="body2">
                                          <strong>Links:</strong> {pageLinks ? `${pageLinks.total} outbound` : '—'}
                                        </Typography>
                                      </Stack>
                                    ) : (
                                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Not extracted yet.
                                      </Typography>
                                    )}

                                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                                      Keyword scores
                                    </Typography>
                                    {pageKeywordScoresLoading ? (
                                      <LinearProgress />
                                    ) : pageKeywordScores && pageKeywordScores.keywords.length > 0 ? (
                                      <TableContainer component={Paper} variant="outlined">
                                        <Table size="small">
                                          <TableHead>
                                            <TableRow>
                                              <TableCell>Keyword</TableCell>
                                              <TableCell align="right">Freq</TableCell>
                                              <TableCell align="right">Rel</TableCell>
                                              <TableCell align="right">Vol</TableCell>
                                              <TableCell align="right">Comp</TableCell>
                                              <TableCell align="right">Composite</TableCell>
                                              <TableCell>Final</TableCell>
                                            </TableRow>
                                          </TableHead>
                                          <TableBody>
                                            {pageKeywordScores.keywords.map((k, i) => (
                                              <TableRow key={i} hover selected={k.is_final_keyword}>
                                                <TableCell>{k.keyword}</TableCell>
                                                <TableCell align="right">{k.frequency_score?.toFixed(2) ?? '—'}</TableCell>
                                                <TableCell align="right">{k.relevance_score?.toFixed(2) ?? '—'}</TableCell>
                                                <TableCell align="right">{k.volume_score?.toFixed(2) ?? '—'}</TableCell>
                                                <TableCell align="right">{k.competition_score?.toFixed(2) ?? '—'}</TableCell>
                                                <TableCell align="right">{k.composite_score?.toFixed(3) ?? '—'}</TableCell>
                                                <TableCell>
                                                  {k.is_final_keyword ? (
                                                    <Chip size="small" color="success" label={`#${k.final_rank}`} />
                                                  ) : '—'}
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      </TableContainer>
                                    ) : (
                                      <Typography variant="body2" color="text.secondary">
                                        Not scored yet.
                                      </Typography>
                                    )}

                                    <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 2, mb: 1 }}>
                                      Rankings
                                    </Typography>
                                    {pageRankingsLoading ? (
                                      <LinearProgress />
                                    ) : pageRankings && pageRankings.rankings.length > 0 ? (
                                      <Stack spacing={0.5}>
                                        {pageRankings.rankings.map((r, i) => (
                                          <Stack key={i} direction="row" spacing={1} alignItems="center">
                                            <Chip
                                              size="small"
                                              color={r.is_page_one ? 'success' : 'default'}
                                              variant={r.matched_scope === 'exact_url' ? 'filled' : 'outlined'}
                                              label={r.rank_position ? `#${r.rank_position}` : 'not found'}
                                            />
                                            <Typography variant="body2">{r.keyword}</Typography>
                                            <Typography variant="caption" color="text.secondary">({r.matched_scope})</Typography>
                                          </Stack>
                                        ))}
                                      </Stack>
                                    ) : (
                                      <Typography variant="body2" color="text.secondary">
                                        Not checked yet — run Check rankings on the SERP &amp; AEO tab.
                                      </Typography>
                                    )}
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

                <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 1, mb: 1 }}>
                  Keyword scoring
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Clusters each page's candidates and scores them (frequency + relevance + search
                  volume + competition) to pick each page's top final keywords — runs automatically
                  once extraction finishes. See the per-page breakdown by expanding a row in Pages.
                </Typography>
                {keywordScoringStatus && (
                  <Stack direction="row" flexWrap="wrap" gap={1.5} sx={{ mb: 2 }}>
                    <StatCard label="Status" value={keywordScoringStatus.in_progress ? 'Scoring…' : 'Idle'} />
                    <StatCard label="Percent complete" value={`${keywordScoringStatus.percent_complete}%`} />
                    <StatCard label="Pending" value={keywordScoringStatus.pending} />
                    <StatCard label="Done" value={keywordScoringStatus.done} tone="success" />
                    <StatCard label="Final keywords" value={keywordScoringStatus.final_keywords_count} />
                    <StatCard label="Pages with final keywords" value={keywordScoringStatus.pages_with_final_keywords} />
                  </Stack>
                )}
                <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                  <Button
                    variant="contained"
                    sx={{ bgcolor: BRAND_COLOR, '&:hover': { bgcolor: BRAND_COLOR } }}
                    onClick={scoreAllKeywords}
                    disabled={scoringAll}
                  >
                    {scoringAll ? 'Starting…' : 'Score keywords'}
                  </Button>
                  <Button variant="outlined" startIcon={<RefreshCw size={16} />} onClick={loadKeywordScoringStatus}>
                    Refresh status
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

            {activeTab === 'serp-aeo' && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Validates whether each page's final keywords actually rank page-1 — auto-runs once
                  keyword scoring finishes. PAA and Related Searches/"People also search for" ride free
                  on the SERP snapshot; Autocomplete and Trends are separate free-but-fragile sources —
                  each renders its own state below, one going down never blocks the others.
                </Typography>
                {serpLookupStatus && (
                  <Stack direction="row" flexWrap="wrap" gap={1.5} sx={{ mb: 2 }}>
                    <StatCard label="Status" value={serpLookupStatus.in_progress ? 'Checking…' : 'Idle'} />
                    <StatCard label="Percent complete" value={`${serpLookupStatus.percent_complete}%`} />
                    <StatCard label="Total final keywords" value={serpLookupStatus.total_final_keywords} />
                    <StatCard label="Checked" value={serpLookupStatus.checked} />
                    <StatCard label="Page-1" value={serpLookupStatus.page_one_count} tone="success" />
                  </Stack>
                )}
                <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                  <Button
                    variant="contained"
                    sx={{ bgcolor: BRAND_COLOR, '&:hover': { bgcolor: BRAND_COLOR } }}
                    onClick={checkAllRankings}
                    disabled={checkingRankings}
                  >
                    {checkingRankings ? 'Starting…' : 'Check rankings'}
                  </Button>
                  <Button variant="outlined" startIcon={<RefreshCw size={16} />} onClick={loadSerpLookupStatus}>
                    Refresh status
                  </Button>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Per-page ranking validation lives in each row's expanded detail on the Pages tab.
                </Typography>

                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                  AEO / GEO lookup
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
                  <TextField
                    size="small"
                    placeholder="Enter a keyword…"
                    defaultValue=""
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') loadAeoBundle(e.target.value);
                    }}
                    sx={{ minWidth: 260 }}
                    inputRef={aeoInputRef}
                  />
                  <Button
                    variant="outlined"
                    onClick={() => loadAeoBundle(aeoInputRef.current?.value)}
                    disabled={aeoLoading}
                  >
                    {aeoLoading ? 'Looking up…' : 'Look up'}
                  </Button>
                </Stack>

                {aeoKeyword && (
                  <Stack spacing={2}>
                    <Typography variant="subtitle2">Results for "{aeoKeyword}"</Typography>

                    <Box>
                      <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
                        People Also Ask
                      </Typography>
                      {aeoSerpSnapshot?.people_also_ask?.length ? (
                        <Stack spacing={0.5}>
                          {aeoSerpSnapshot.people_also_ask.slice(0, 10).map((q, i) => (
                            <Typography key={i} variant="body2" color="text.secondary">• {q.title}</Typography>
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {aeoSerpSnapshot ? 'None found.' : 'Unavailable.'}
                        </Typography>
                      )}
                    </Box>

                    <Box>
                      <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
                        Related searches / "People also search for"
                      </Typography>
                      {aeoSerpSnapshot?.related_searches?.length ? (
                        <Stack direction="row" flexWrap="wrap" gap={0.75}>
                          {aeoSerpSnapshot.related_searches.map((term, i) => (
                            <Chip key={i} size="small" variant="outlined" label={term} />
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {aeoSerpSnapshot ? 'None found.' : 'Unavailable.'}
                        </Typography>
                      )}
                    </Box>

                    <Box>
                      <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
                        Autocomplete <Chip size="small" label="best-effort" sx={{ ml: 0.5 }} />
                      </Typography>
                      {aeoAutocomplete?.suggestions?.length ? (
                        <Stack direction="row" flexWrap="wrap" gap={0.75}>
                          {aeoAutocomplete.suggestions.map((s, i) => (
                            <Chip key={i} size="small" variant="outlined" label={s} />
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">Unavailable.</Typography>
                      )}
                    </Box>

                    <Box>
                      <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
                        Trends <Chip size="small" label="best-effort" sx={{ ml: 0.5 }} />
                      </Typography>
                      {aeoTrends?.top_related_queries?.length || aeoTrends?.rising_related_queries?.length ? (
                        <Stack spacing={0.5}>
                          {aeoTrends.rising_related_queries?.length > 0 && (
                            <Typography variant="body2" color="text.secondary">
                              Rising: {aeoTrends.rising_related_queries.map((q) => q.query).join(', ')}
                            </Typography>
                          )}
                          {aeoTrends.top_related_queries?.length > 0 && (
                            <Typography variant="body2" color="text.secondary">
                              Top: {aeoTrends.top_related_queries.map((q) => q.query).join(', ')}
                            </Typography>
                          )}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">Unavailable.</Typography>
                      )}
                    </Box>
                  </Stack>
                )}
              </Box>
            )}

            {activeTab === 'technical' && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Canonical tags, meta robots, robots.txt, redirect chains — runs automatically once
                  content extraction finishes.
                </Typography>
                {technicalCheckStatus && (
                  <Stack direction="row" flexWrap="wrap" gap={1.5} sx={{ mb: 2 }}>
                    <StatCard label="Status" value={technicalCheckStatus.in_progress ? 'Checking…' : 'Idle'} />
                    <StatCard label="Percent complete" value={`${technicalCheckStatus.percent_complete}%`} />
                    <StatCard label="Pending" value={technicalCheckStatus.pending} />
                    <StatCard label="Pages checked" value={technicalCheckStatus.pages_checked} />
                    <StatCard label="Passed" value={technicalCheckStatus.pages_passed} tone="success" />
                    <StatCard label="With issues" value={technicalCheckStatus.pages_with_issues} tone={technicalCheckStatus.pages_with_issues ? 'warning' : undefined} />
                  </Stack>
                )}
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <Button
                    variant="contained"
                    sx={{ bgcolor: BRAND_COLOR, '&:hover': { bgcolor: BRAND_COLOR } }}
                    onClick={checkAllTechnical}
                    disabled={checkingTechnical}
                  >
                    {checkingTechnical ? 'Starting…' : 'Check all'}
                  </Button>
                  <Button variant="outlined" startIcon={<RefreshCw size={16} />} onClick={loadTechnicalCheckStatus}>
                    Refresh status
                  </Button>
                  <Button variant="outlined" onClick={loadTechnicalReport} disabled={technicalReportLoading}>
                    {technicalReportLoading ? 'Loading…' : 'View report'}
                  </Button>
                </Stack>

                {technicalReport && (
                  <Box>
                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} sx={{ mb: 1.5 }} spacing={1}>
                      <Typography variant="subtitle2">{filteredTechnicalPages.length} of {technicalReport.pages.length} pages</Typography>
                      <Stack direction="row" spacing={1}>
                        <TextField
                          size="small"
                          placeholder="Search URL…"
                          value={technicalSearch}
                          onChange={(e) => setTechnicalSearch(e.target.value)}
                          InputProps={{ startAdornment: <Search size={16} style={{ marginRight: 6, opacity: 0.5 }} /> }}
                        />
                        <FormControl size="small" sx={{ minWidth: 130 }}>
                          <InputLabel>Status</InputLabel>
                          <Select label="Status" value={technicalPassedFilter} onChange={(e) => setTechnicalPassedFilter(e.target.value)}>
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="passed">Passed</MenuItem>
                            <MenuItem value="failed">Has issues</MenuItem>
                          </Select>
                        </FormControl>
                        <Button
                          size="small"
                          startIcon={<Download size={16} />}
                          onClick={() =>
                            downloadCsv(`${crawl.domain}-technical.csv`, filteredTechnicalPages, [
                              { label: 'URL', value: (r) => r.page_url },
                              { label: 'Canonical', value: (r) => r.canonical_url },
                              { label: 'Canonical matches self', value: (r) => (r.canonical_matches_self ? 'yes' : 'no') },
                              { label: 'Robots.txt allowed', value: (r) => (r.robots_txt_allowed ? 'yes' : 'no') },
                              { label: 'Indexable', value: (r) => (r.meta_robots_indexable ? 'yes' : 'no') },
                              { label: 'Redirect hops', value: (r) => r.redirect_chain_length },
                              { label: 'Final status', value: (r) => r.final_status_code },
                              { label: 'Issues', value: (r) => (r.issues || []).join('; ') },
                              { label: 'Passed', value: (r) => (r.passed ? 'yes' : 'no') },
                            ])
                          }
                          disabled={!filteredTechnicalPages.length}
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
                            <TableCell>Canonical OK</TableCell>
                            <TableCell>Robots.txt</TableCell>
                            <TableCell>Indexable</TableCell>
                            <TableCell>Redirects</TableCell>
                            <TableCell>Issues</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredTechnicalPages.map((p, i) => (
                            <TableRow key={i} hover>
                              <TableCell sx={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.page_url}</TableCell>
                              <TableCell>{p.canonical_matches_self ? <Chip size="small" color="success" label="OK" /> : <Chip size="small" variant="outlined" label="—" />}</TableCell>
                              <TableCell>{p.robots_txt_allowed ? <Chip size="small" color="success" label="Allowed" /> : <Chip size="small" color="error" label="Blocked" />}</TableCell>
                              <TableCell>{p.meta_robots_indexable ? <Chip size="small" color="success" label="Yes" /> : <Chip size="small" color="error" label="No" />}</TableCell>
                              <TableCell>{p.redirect_chain_length || 0}</TableCell>
                              <TableCell sx={{ maxWidth: 320 }}>
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

            {activeTab === 'cwv' && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Core Web Vitals / Lighthouse via Google PageSpeed Insights — <strong>manual only</strong>,
                  never runs automatically (PSI's anonymous quota is low). Checks up to 20 pages per run,
                  defaulting to the top 5 by search volume behind their final keywords.
                </Typography>
                {cwvStatus && (
                  <Stack direction="row" flexWrap="wrap" gap={1.5} sx={{ mb: 2 }}>
                    <StatCard label="Pending" value={cwvStatus.pending} />
                    <StatCard label="Running" value={cwvStatus.running} tone={cwvStatus.running ? 'info' : undefined} />
                    <StatCard label="Done" value={cwvStatus.done} tone="success" />
                    <StatCard label="Failed" value={cwvStatus.failed} tone={cwvStatus.failed ? 'error' : undefined} />
                  </Stack>
                )}
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <Button
                    variant="contained"
                    sx={{ bgcolor: BRAND_COLOR, '&:hover': { bgcolor: BRAND_COLOR } }}
                    onClick={runCwvCheck}
                    disabled={checkingCwv}
                  >
                    {checkingCwv ? 'Starting…' : 'Run CWV check (top 5)'}
                  </Button>
                  <Button variant="outlined" startIcon={<RefreshCw size={16} />} onClick={loadCwvStatus}>
                    Refresh status
                  </Button>
                  <Button variant="outlined" onClick={loadCwvReport} disabled={cwvReportLoading}>
                    {cwvReportLoading ? 'Loading…' : 'View report'}
                  </Button>
                </Stack>

                {cwvReport && (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>URL</TableCell>
                          <TableCell align="right">Perf</TableCell>
                          <TableCell align="right">A11y</TableCell>
                          <TableCell align="right">Best practices</TableCell>
                          <TableCell align="right">SEO</TableCell>
                          <TableCell align="right">LCP (ms)</TableCell>
                          <TableCell align="right">CLS</TableCell>
                          <TableCell align="right">INP (ms)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {cwvReport.pages.map((p, i) => (
                          <TableRow key={i} hover>
                            <TableCell sx={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.page_url}</TableCell>
                            <TableCell align="right">{p.performance_score ?? (p.error ? '—' : '…')}</TableCell>
                            <TableCell align="right">{p.accessibility_score ?? '—'}</TableCell>
                            <TableCell align="right">{p.best_practices_score ?? '—'}</TableCell>
                            <TableCell align="right">{p.seo_score ?? '—'}</TableCell>
                            <TableCell align="right">{p.lcp_ms != null ? Math.round(p.lcp_ms) : '—'}</TableCell>
                            <TableCell align="right">{p.cls != null ? p.cls.toFixed(3) : '—'}</TableCell>
                            <TableCell align="right">{p.inp_ms != null ? Math.round(p.inp_ms) : '—'}</TableCell>
                          </TableRow>
                        ))}
                        {cwvReport.pages.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={8} align="center" sx={{ color: 'text.secondary' }}>
                              No CWV data yet — run a check above.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
