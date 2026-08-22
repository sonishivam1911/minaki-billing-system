import React, { useCallback, useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { seoApi } from '../../services/seoApi';
import { SeoSubnav } from '../../components/seo/SeoSubnav';
import { AgentsHowTo } from '../../components/agents/AgentsHowTo';
import { AGENT_HOW_TO } from '../../components/agents/agentHowToCopy';
import { LoadingSpinner, ErrorMessage } from '../../components';

const KEYWORD_CHART_TOP_N = 15;

const PAGES_PAGE_SIZE = 50;
const POLL_INTERVAL_MS = 5000;

export const SiteCrawlPage = () => {
  const [domain, setDomain] = useState('minaki.shop');
  const [maxPages, setMaxPages] = useState(1000);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  const [crawls, setCrawls] = useState([]);
  const [crawlsLoading, setCrawlsLoading] = useState(false);

  const [selectedId, setSelectedId] = useState(null);
  const [crawl, setCrawl] = useState(null);

  const [pageTypeFilter, setPageTypeFilter] = useState('');
  const [keywordStatusFilter, setKeywordStatusFilter] = useState('');
  const [pagesPage, setPagesPage] = useState(0);
  const [pages, setPages] = useState({ items: [], total: 0 });
  const [pagesLoading, setPagesLoading] = useState(false);

  const [selectedPageUrl, setSelectedPageUrl] = useState(null);
  const [pageDetail, setPageDetail] = useState(null);
  const [pageDetailLoading, setPageDetailLoading] = useState(false);

  const [extractBatchSize, setExtractBatchSize] = useState(25);
  const [extracting, setExtracting] = useState(false);

  const [keywordReport, setKeywordReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  const [cancelling, setCancelling] = useState(false);
  const [resuming, setResuming] = useState(false);

  const loadCrawls = useCallback(async () => {
    setCrawlsLoading(true);
    try {
      const res = await seoApi.listSiteCrawls({ limit: 20 });
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

  // Auto-refresh while a crawl is actively running, so progress updates
  // without the user manually hitting refresh every few seconds.
  useEffect(() => {
    if (!selectedId || crawl?.status !== 'running') return undefined;
    const timer = setInterval(refreshCrawl, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [selectedId, crawl?.status, refreshCrawl]);

  const loadPages = useCallback(async () => {
    if (!selectedId) return;
    setPagesLoading(true);
    try {
      const res = await seoApi.listSiteCrawlPages(selectedId, {
        page_type: pageTypeFilter || undefined,
        keyword_extraction_status: keywordStatusFilter || undefined,
        limit: PAGES_PAGE_SIZE,
        offset: pagesPage * PAGES_PAGE_SIZE,
      });
      setPages(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setPagesLoading(false);
    }
  }, [selectedId, pageTypeFilter, keywordStatusFilter, pagesPage]);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

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
      setSelectedId(res.id);
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

  const runExtraction = async () => {
    setExtracting(true);
    setError(null);
    try {
      await seoApi.extractSiteCrawlKeywords(selectedId, {
        batch_size: Math.max(1, Math.min(200, Number(extractBatchSize) || 25)),
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setExtracting(false);
      setTimeout(() => {
        refreshCrawl();
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

  const selectCrawl = (id) => {
    setSelectedId(id);
    setCrawl(null);
    setPages({ items: [], total: 0 });
    setPagesPage(0);
    setSelectedPageUrl(null);
    setPageDetail(null);
    setKeywordReport(null);
  };

  return (
    <div className="screen-container agents-page">
      <div className="screen-header">
        <div>
          <h1 className="screen-title">Site Crawl</h1>
          <p className="screen-subtitle">
            Scrape a whole Shopify site (sitemap, pages, products, collections) and extract keywords per page
          </p>
        </div>
      </div>
      <SeoSubnav />
      <AgentsHowTo {...AGENT_HOW_TO.siteCrawl} />
      {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}

      <section className="agents-card">
        <h2 className="agents-section-title">New crawl</h2>
        <input placeholder="minaki.shop" value={domain} onChange={(e) => setDomain(e.target.value)} />
        <label>
          Max pages
          <input
            type="number"
            min={1}
            max={50000}
            value={maxPages}
            onChange={(e) => setMaxPages(e.target.value)}
          />
        </label>
        <div className="agents-actions">
          <button type="button" className="agents-btn primary" onClick={startCrawl} disabled={starting}>
            {starting ? 'Starting…' : 'Start crawl'}
          </button>
        </div>
      </section>

      <section className="agents-card">
        <div className="agents-search-row">
          <h2 className="agents-section-title">Crawls</h2>
          <button type="button" className="agents-btn secondary" onClick={loadCrawls}>
            Refresh
          </button>
        </div>
        {crawlsLoading ? (
          <LoadingSpinner message="Loading crawls…" />
        ) : (
          <table className="agents-table">
            <thead>
              <tr>
                <th>Domain</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Failed</th>
                <th>Started</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {crawls.map((c) => (
                <tr key={c.id}>
                  <td>{c.domain}</td>
                  <td>{c.status}</td>
                  <td>
                    {c.pages_scraped ?? 0} / {c.total_urls_discovered ?? '?'}
                  </td>
                  <td>{c.pages_failed ?? 0}</td>
                  <td>{c.started_at ? new Date(c.started_at).toLocaleString() : '—'}</td>
                  <td>
                    <button type="button" className="agents-link-btn" onClick={() => selectCrawl(c.id)}>
                      {selectedId === c.id ? 'Selected' : 'View'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {selectedId && crawl && (
        <>
          <section className="agents-card">
            <h2 className="agents-section-title">{crawl.domain}</h2>
            <table className="agents-table">
              <tbody>
                <tr><td>Status</td><td>{crawl.status}{crawl.status === 'running' && ' (auto-refreshing)'}</td></tr>
                <tr><td>URLs discovered</td><td>{crawl.total_urls_discovered ?? '—'}</td></tr>
                <tr><td>Pages scraped</td><td>{crawl.pages_scraped ?? 0}</td></tr>
                <tr><td>Pages failed</td><td>{crawl.pages_failed ?? 0}</td></tr>
                <tr><td>Keywords extracted (pages)</td><td>{crawl.keywords_extracted_pages ?? 0}</td></tr>
                {crawl.error_message && <tr><td>Error</td><td>{crawl.error_message}</td></tr>}
              </tbody>
            </table>
            <div className="agents-actions">
              <button type="button" className="agents-btn secondary" onClick={refreshCrawl}>
                Refresh now
              </button>
              {crawl.status === 'running' && (
                <button type="button" className="agents-btn secondary" onClick={cancelCrawl} disabled={cancelling}>
                  {cancelling ? 'Cancelling…' : 'Cancel crawl'}
                </button>
              )}
              {(crawl.status === 'cancelled' || crawl.status === 'failed') && (
                <button type="button" className="agents-btn primary" onClick={resumeCrawl} disabled={resuming}>
                  {resuming ? 'Resuming…' : 'Resume crawl'}
                </button>
              )}
            </div>
          </section>

          <section className="agents-card">
            <h2 className="agents-section-title">Extract keywords</h2>
            <p className="agents-preview-skus">
              Processes pending pages (any type) in batches — call repeatedly to work through the whole crawl.
            </p>
            <label>
              Batch size
              <input
                type="number"
                min={1}
                max={200}
                value={extractBatchSize}
                onChange={(e) => setExtractBatchSize(e.target.value)}
              />
            </label>
            <div className="agents-actions">
              <button type="button" className="agents-btn primary" onClick={runExtraction} disabled={extracting}>
                {extracting ? 'Starting…' : 'Extract next batch'}
              </button>
              <button type="button" className="agents-btn secondary" onClick={loadKeywordReport} disabled={reportLoading}>
                {reportLoading ? 'Loading…' : 'View keyword report'}
              </button>
            </div>
          </section>

          {keywordReport && (
            <section className="agents-card">
              <h2 className="agents-section-title">Keyword report ({keywordReport.keywords.length})</h2>
              {keywordReport.keywords.length > 0 && (
                <div style={{ width: '100%', height: 360 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={keywordReport.keywords.slice(0, KEYWORD_CHART_TOP_N)}
                      layout="vertical"
                      margin={{ left: 24, right: 24 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" stroke="#6b7280" style={{ fontSize: 12 }} />
                      <YAxis
                        type="category"
                        dataKey="keyword"
                        width={160}
                        stroke="#6b7280"
                        style={{ fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 4 }}
                        formatter={(value) => [value, 'Avg monthly searches']}
                      />
                      <Bar dataKey="total_avg_monthly_searches" fill="#8b6f47" name="Avg monthly searches" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="agents-table-wrap">
                <table className="agents-table">
                  <thead>
                    <tr>
                      <th>Keyword</th>
                      <th>Pages</th>
                      <th>Total avg monthly searches</th>
                      <th>Competition</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keywordReport.keywords.map((k, i) => (
                      <tr key={i}>
                        <td>{k.keyword}</td>
                        <td>{k.page_count}</td>
                        <td>{k.total_avg_monthly_searches ?? '—'}</td>
                        <td>{k.competition ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <section className="agents-card">
            <h2 className="agents-section-title">Pages</h2>
            <div className="agents-search-row">
              <select value={pageTypeFilter} onChange={(e) => { setPageTypeFilter(e.target.value); setPagesPage(0); }}>
                <option value="">All types</option>
                <option value="product">Product</option>
                <option value="collection">Collection</option>
                <option value="page">Page</option>
                <option value="article">Article</option>
                <option value="other">Other</option>
              </select>
              <select
                value={keywordStatusFilter}
                onChange={(e) => { setKeywordStatusFilter(e.target.value); setPagesPage(0); }}
              >
                <option value="">Any keyword status</option>
                <option value="pending">Pending</option>
                <option value="done">Done</option>
                <option value="failed">Failed</option>
                <option value="skipped">Skipped</option>
              </select>
              <button type="button" className="agents-btn secondary" onClick={loadPages}>
                Refresh
              </button>
            </div>

            {pagesLoading ? (
              <LoadingSpinner message="Loading pages…" />
            ) : (
              <div className="agents-table-wrap">
                <p className="agents-preview-skus">
                  Showing {pages.items.length ? pagesPage * PAGES_PAGE_SIZE + 1 : 0}–
                  {pagesPage * PAGES_PAGE_SIZE + pages.items.length} of {pages.total}
                </p>
                <table className="agents-table">
                  <thead>
                    <tr>
                      <th>URL</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Title</th>
                      <th>Keyword status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {pages.items.map((p) => (
                      <React.Fragment key={p.id}>
                        <tr>
                          <td>{p.url}</td>
                          <td>{p.page_type}</td>
                          <td>{p.status_code ?? '—'}</td>
                          <td>{p.title || '—'}</td>
                          <td>{p.keyword_extraction_status}</td>
                          <td>
                            <button type="button" className="agents-link-btn" onClick={() => openPageDetail(p.url)}>
                              {selectedPageUrl === p.url ? 'Hide' : 'Detail'}
                            </button>
                          </td>
                        </tr>
                        {selectedPageUrl === p.url && (
                          <tr>
                            <td colSpan={6}>
                              {pageDetailLoading ? (
                                <LoadingSpinner message="Loading page detail…" />
                              ) : pageDetail ? (
                                <div>
                                  <p><strong>Meta description:</strong> {pageDetail.meta_description || '—'}</p>
                                  <p>
                                    <strong>Raw HTML:</strong>{' '}
                                    {pageDetail.raw_html
                                      ? `stored (${pageDetail.raw_html.length.toLocaleString()} chars)`
                                      : 'not stored'}
                                  </p>
                                  <p><strong>Text snippet:</strong> {(pageDetail.text_snippet || '').slice(0, 500)}</p>
                                  {pageDetail.shopify_json && (
                                    <details>
                                      <summary>Shopify JSON</summary>
                                      <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto' }}>
                                        {JSON.stringify(pageDetail.shopify_json, null, 2).slice(0, 5000)}
                                      </pre>
                                    </details>
                                  )}
                                </div>
                              ) : null}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
                {pages.total > PAGES_PAGE_SIZE && (
                  <div className="agents-actions">
                    <button
                      type="button"
                      className="agents-btn secondary"
                      disabled={pagesPage === 0}
                      onClick={() => setPagesPage((p) => p - 1)}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      className="agents-btn secondary"
                      disabled={(pagesPage + 1) * PAGES_PAGE_SIZE >= pages.total}
                      onClick={() => setPagesPage((p) => p + 1)}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};
