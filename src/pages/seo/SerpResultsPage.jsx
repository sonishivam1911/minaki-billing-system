import React, { useState } from 'react';
import { seoApi } from '../../services/seoApi';
import { SeoSubnav } from '../../components/seo/SeoSubnav';
import { AgentsHowTo } from '../../components/agents/AgentsHowTo';
import { AGENT_HOW_TO } from '../../components/agents/agentHowToCopy';
import { LoadingSpinner, ErrorMessage } from '../../components';

export const SerpResultsPage = () => {
  const [keyword, setKeyword] = useState('');
  const [device, setDevice] = useState('mobile');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [spendStatus, setSpendStatus] = useState(null);

  // Persisted, cache-first store (same one the site-crawl SERP-lookup pass
  // writes to) — replaces the always-live call this page used before.
  // force_refresh bypasses the cache for one call only.
  const fetchResults = async (forceRefresh = false) => {
    if (!keyword.trim()) {
      setError('Enter a keyword');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await seoApi.getSerpSnapshot({ keyword: keyword.trim(), device, force_refresh: forceRefresh }));
      seoApi.getDataForSeoSpendStatus().then(setSpendStatus).catch(() => {});
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleHistory = async () => {
    if (showHistory) {
      setShowHistory(false);
      return;
    }
    setShowHistory(true);
    setHistoryLoading(true);
    try {
      setHistory(await seoApi.getSerpHistory({ keyword: keyword.trim(), device }));
    } catch (e) {
      setHistory(null);
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="screen-container agents-page">
      <div className="screen-header">
        <div>
          <h1 className="screen-title">SERP Results</h1>
          <p className="screen-subtitle">Full Google results page breakdown for a keyword (DataForSEO)</p>
        </div>
      </div>
      <SeoSubnav />
      <AgentsHowTo {...AGENT_HOW_TO.serpResults} />
      {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}

      <section className="agents-card">
        <div className="agents-search-row">
          <input placeholder="kundan necklace set" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          <select value={device} onChange={(e) => setDevice(e.target.value)}>
            <option value="mobile">Mobile</option>
            <option value="desktop">Desktop</option>
          </select>
          <button type="button" className="agents-btn primary" onClick={() => fetchResults(false)} disabled={loading}>
            Fetch
          </button>
          <button type="button" className="agents-btn secondary" onClick={() => fetchResults(true)} disabled={loading}>
            Force refresh
          </button>
          <button type="button" className="agents-link-btn" onClick={toggleHistory} disabled={!keyword.trim()}>
            {showHistory ? 'Hide history' : 'View history'}
          </button>
        </div>
        {spendStatus && (
          <p className="agents-validation">
            DataForSEO spend this month: ${spendStatus.current_month_spend_usd.toFixed(2)} / $
            {spendStatus.monthly_cap_usd.toFixed(2)}
            {!spendStatus.budget_available && ' — cap reached, force refresh will fall back to cache'}
          </p>
        )}
      </section>

      {showHistory && (
        <section className="agents-card">
          <h2 className="agents-section-title">Fetch history</h2>
          {historyLoading ? (
            <LoadingSpinner message="Loading history…" />
          ) : history?.snapshots?.length ? (
            <table className="agents-table">
              <thead>
                <tr>
                  <th>Fetched at</th>
                  <th>Cost</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {history.snapshots.map((s, i) => (
                  <tr key={s.id || i}>
                    <td>{s.fetched_at ? new Date(s.fetched_at).toLocaleString() : '—'}</td>
                    <td>{s.cost != null ? `$${Number(s.cost).toFixed(4)}` : '—'}</td>
                    <td>{s.error || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="agents-validation">No fetch history yet for this keyword.</p>
          )}
        </section>
      )}

      {loading && <LoadingSpinner message="Fetching SERP…" />}

      {result && (
        <section className="agents-card">
          <p className="agents-validation">
            {result.cache_hit ? `Cached result${result.stale ? ' (stale — budget cap reached)' : ''}` : 'Freshly fetched'}
            {result.fetched_at && ` — ${new Date(result.fetched_at).toLocaleString()}`}
          </p>
        </section>
      )}

      {result && (
        <>
          <section className="agents-card">
            <h2 className="agents-section-title">Block summary</h2>
            <p className="agents-preview-skus">
              {Object.entries(result.block_summary || {})
                .map(([type, count]) => `${type}: ${count}`)
                .join(' · ') || 'No blocks found'}
            </p>
          </section>

          {result.featured_snippet && (
            <section className="agents-card">
              <h2 className="agents-section-title">Featured snippet</h2>
              <p><strong>{result.featured_snippet.title}</strong></p>
              <p className="agents-validation">{result.featured_snippet.description}</p>
              <p>{result.featured_snippet.url}</p>
            </section>
          )}

          {result.knowledge_graph && (
            <section className="agents-card">
              <h2 className="agents-section-title">Knowledge graph</h2>
              <p><strong>{result.knowledge_graph.title}</strong> — {result.knowledge_graph.subtitle}</p>
              <p className="agents-validation">{result.knowledge_graph.description}</p>
            </section>
          )}

          <section className="agents-card">
            <h2 className="agents-section-title">Organic results ({(result.organic || []).length})</h2>
            <table className="agents-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Domain</th>
                  <th>Title</th>
                  <th>URL</th>
                </tr>
              </thead>
              <tbody>
                {(result.organic || []).map((r, i) => (
                  <tr key={i}>
                    <td>{r.rank_group}</td>
                    <td>{r.domain}</td>
                    <td>{r.title}</td>
                    <td>{r.url}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {(result.paid || []).length > 0 && (
            <section className="agents-card">
              <h2 className="agents-section-title">Paid results ({result.paid.length})</h2>
              <table className="agents-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Domain</th>
                    <th>Title</th>
                  </tr>
                </thead>
                <tbody>
                  {result.paid.map((r, i) => (
                    <tr key={i}>
                      <td>{r.rank_group}</td>
                      <td>{r.domain}</td>
                      <td>{r.title}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {(result.local_pack || []).length > 0 && (
            <section className="agents-card">
              <h2 className="agents-section-title">Local pack ({result.local_pack.length})</h2>
              <table className="agents-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Rating</th>
                    <th>Address</th>
                  </tr>
                </thead>
                <tbody>
                  {result.local_pack.map((r, i) => (
                    <tr key={i}>
                      <td>{r.title}</td>
                      <td>{r.rating != null ? `${r.rating} (${r.rating_count ?? 0})` : '—'}</td>
                      <td>{r.address || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {(result.people_also_ask || []).length > 0 && (
            <section className="agents-card">
              <h2 className="agents-section-title">People Also Ask</h2>
              {result.people_also_ask.map((q, i) => (
                <p key={i} className="agents-validation">{typeof q === 'string' ? q : q.title || JSON.stringify(q)}</p>
              ))}
            </section>
          )}

          {(result.related_searches || []).length > 0 && (
            <section className="agents-card">
              <h2 className="agents-section-title">Related searches</h2>
              <p className="agents-preview-skus">{result.related_searches.join(' · ')}</p>
            </section>
          )}

          {(result.top_stories || []).length > 0 && (
            <section className="agents-card">
              <h2 className="agents-section-title">Top stories</h2>
              <table className="agents-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Domain</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {result.top_stories.map((r, i) => (
                    <tr key={i}>
                      <td>{r.title}</td>
                      <td>{r.domain}</td>
                      <td>{r.date || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </>
      )}
    </div>
  );
};
