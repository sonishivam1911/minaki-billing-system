import React, { useCallback, useEffect, useState } from 'react';
import { agentsApi } from '../../services/agentsApi';
import { AgentsSubnav } from '../../components/agents/AgentsSubnav';
import { AgentsModeSelect } from '../../components/agents/AgentsModeSelect';
import { AgentsHowTo } from '../../components/agents/AgentsHowTo';
import { AGENT_HOW_TO } from '../../components/agents/agentsHowTo';
import { LoadingSpinner, ErrorMessage } from '../../components';

const KEYWORDS_PAGE_SIZE = 40;
const DEFAULT_MAX_PER_SEED = 40;
const SIMILAR_KEYWORD_COUNT = 40;
const SEARCH_DEBOUNCE_MS = 300;

export const KeywordsPage = () => {
  const [tab, setTab] = useState('discover');
  const [seedsText, setSeedsText] = useState('');
  const [maxPerSeed, setMaxPerSeed] = useState(DEFAULT_MAX_PER_SEED);
  const [keywords, setKeywords] = useState([]);
  const [total, setTotal] = useState(0);
  const [keywordPage, setKeywordPage] = useState(0);
  const [filterSeed, setFilterSeed] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [debouncedSearchQ, setDebouncedSearchQ] = useState('');
  const [debouncedFilterSeed, setDebouncedFilterSeed] = useState('');
  const [similarFor, setSimilarFor] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandResult, setExpandResult] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQ(searchQ), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQ]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFilterSeed(filterSeed), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [filterSeed]);

  useEffect(() => {
    setKeywordPage(0);
  }, [tab, debouncedSearchQ, debouncedFilterSeed]);

  const loadKeywords = useCallback(async () => {
    if (tab === 'similar') {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const offset = keywordPage * KEYWORDS_PAGE_SIZE;
      const res = await agentsApi.listKeywords({
        q: debouncedSearchQ || undefined,
        source: tab === 'discover' ? 'dataforseo_expand' : undefined,
        seed: debouncedFilterSeed || undefined,
        limit: KEYWORDS_PAGE_SIZE,
        offset,
      });
      setKeywords(res.items || []);
      setTotal(res.total || 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [tab, debouncedSearchQ, debouncedFilterSeed, keywordPage]);

  useEffect(() => {
    loadKeywords();
  }, [loadKeywords]);

  const runExpand = async () => {
    const seeds = seedsText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!seeds.length) {
      setError('Enter at least one seed keyword');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const perSeed = Math.max(1, Math.min(200, Number(maxPerSeed) || DEFAULT_MAX_PER_SEED));
      const res = await agentsApi.expandKeywordSeeds({
        seeds,
        max_per_seed: perSeed,
        run_embed: true,
      });
      setExpandResult(res);
      setTab('discover');
      setKeywordPage(0);
      await loadKeywords();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const showSimilar = async (row) => {
    setSimilarFor(row);
    setLoading(true);
    try {
      const res = await agentsApi.similarKeywords(row.id, SIMILAR_KEYWORD_COUNT);
      setSimilar(res.similar || []);
      setTab('similar');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const reloadSimilar = async () => {
    if (!similarFor?.id) {
      return;
    }
    await showSimilar(similarFor);
  };

  const refreshTable = () => {
    if (tab === 'similar') {
      reloadSimilar();
      return;
    }
    loadKeywords();
  };

  const tableRows = tab === 'similar' ? similar : keywords;
  const tableTotal = tab === 'similar' ? similar.length : total;
  const rangeStart = tab === 'similar'
    ? (tableRows.length ? 1 : 0)
    : (total === 0 ? 0 : keywordPage * KEYWORDS_PAGE_SIZE + 1);
  const rangeEnd = tab === 'similar'
    ? tableRows.length
    : Math.min(keywordPage * KEYWORDS_PAGE_SIZE + keywords.length, total);

  return (
    <div className="screen-container agents-page">
      <div className="screen-header">
        <div>
          <h1 className="screen-title">Keywords</h1>
          <p className="screen-subtitle">Discover similar keywords via DataForSEO and browse your warehouse</p>
        </div>
      </div>
      <AgentsSubnav />
      <AgentsHowTo {...AGENT_HOW_TO.keywords} />
      {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}

      <section className="agents-card">
        <h2 className="agents-section-title">Seed keywords</h2>
        <textarea
          rows={4}
          placeholder="crystal choker, bridal jhumka, kundan necklace set"
          value={seedsText}
          onChange={(e) => setSeedsText(e.target.value)}
          className="agents-seeds-input"
        />
        <label>
          Top K results per seed
          <input
            type="number"
            min={1}
            max={200}
            value={maxPerSeed}
            onChange={(e) => setMaxPerSeed(e.target.value)}
          />
        </label>
        <div className="agents-actions">
          <button type="button" className="agents-btn primary" onClick={runExpand} disabled={loading}>
            Fetch and save
          </button>
        </div>
        {expandResult && (
          <p className="agents-validation">
            Fetched {expandResult.keywords_fetched} keywords, upserted {expandResult.keywords_upserted} from{' '}
            {expandResult.seeds?.length} seed(s) (top {Math.max(1, Math.min(200, Number(maxPerSeed) || DEFAULT_MAX_PER_SEED))} per seed)
          </p>
        )}
      </section>

      <section className="agents-card">
        <AgentsModeSelect
          label="Keyword view"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'discover', label: 'DataForSEO results' },
            { value: 'bank', label: 'All in warehouse' },
            ...(tab === 'similar'
              ? [{ value: 'similar', label: `Similar to ${similarFor?.keyword || 'keyword'}` }]
              : []),
          ]}
        />

        <div className="agents-search-row">
          <input
            placeholder="Filter keywords…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            disabled={tab === 'similar'}
          />
          <input
            placeholder="Filter by seed…"
            value={filterSeed}
            onChange={(e) => setFilterSeed(e.target.value)}
            disabled={tab === 'similar'}
          />
          <button type="button" className="agents-btn secondary" onClick={refreshTable}>
            Refresh
          </button>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading keywords…" />
        ) : (
          <div className="agents-table-wrap">
            <p className="agents-preview-skus">
              {tab === 'similar'
                ? `${tableTotal} similar keyword(s)`
                : `Showing ${rangeStart}–${rangeEnd} of ${tableTotal}`}
            </p>
            <table className="agents-table">
              <thead>
                <tr>
                  <th>Keyword</th>
                  <th>Seed</th>
                  <th>Volume</th>
                  <th>Competition</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row) => (
                  <tr key={row.id || row.keyword_id || row.keyword}>
                    <td>{row.keyword}</td>
                    <td>{row.seed_keyword || '—'}</td>
                    <td>{row.avg_monthly_searches ?? '—'}</td>
                    <td>{row.competition ?? '—'}</td>
                    <td>
                      {tab !== 'similar' && row.id && (
                        <button
                          type="button"
                          className="agents-link-btn"
                          onClick={() => showSimilar(row)}
                        >
                          Similar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tab !== 'similar' && total > KEYWORDS_PAGE_SIZE && (
              <div className="agents-actions">
                <button
                  type="button"
                  className="agents-btn secondary"
                  disabled={keywordPage === 0}
                  onClick={() => setKeywordPage((page) => page - 1)}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="agents-btn secondary"
                  disabled={(keywordPage + 1) * KEYWORDS_PAGE_SIZE >= total}
                  onClick={() => setKeywordPage((page) => page + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
