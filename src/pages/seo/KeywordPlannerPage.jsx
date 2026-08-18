import React, { useState } from 'react';
import { agentsApi } from '../../services/agentsApi';
import { SeoSubnav } from '../../components/seo/SeoSubnav';
import { AgentsModeSelect } from '../../components/agents/AgentsModeSelect';
import { AgentsHowTo } from '../../components/agents/AgentsHowTo';
import { AGENT_HOW_TO } from '../../components/agents/agentHowToCopy';
import { LoadingSpinner, ErrorMessage } from '../../components';

const DEFAULT_MAX_RESULTS = 200;

const formatBidMicros = (micros) => (micros == null ? '—' : `₹${(micros / 1_000_000).toFixed(2)}`);

export const KeywordPlannerPage = () => {
  const [mode, setMode] = useState('keywords');
  const [seedsText, setSeedsText] = useState('');
  const [url, setUrl] = useState('');
  const [maxResults, setMaxResults] = useState(DEFAULT_MAX_RESULTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  const runDiscover = async () => {
    setError(null);
    setResult(null);
    const limit = Math.max(1, Math.min(1000, Number(maxResults) || DEFAULT_MAX_RESULTS));

    if (mode === 'keywords') {
      const seeds = seedsText
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (!seeds.length) {
        setError('Enter at least one seed keyword');
        return;
      }
      setLoading(true);
      try {
        const res = await agentsApi.expandKeywordSeedsGoogleAds({
          seeds,
          max_per_seed: limit,
          run_embed: false,
        });
        setResult(res);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    } else {
      if (!url.trim()) {
        setError('Enter a website URL');
        return;
      }
      setLoading(true);
      try {
        const res = await agentsApi.expandUrlGoogleAds({
          url: url.trim(),
          max_results: limit,
          run_embed: false,
        });
        setResult(res);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const rows = result?.sample || [];
  const total = result?.keywords_fetched ?? rows.length;

  return (
    <div className="screen-container agents-page">
      <div className="screen-header">
        <div>
          <h1 className="screen-title">Keyword Planner</h1>
          <p className="screen-subtitle">Discover keyword ideas with real Google Ads search volume and competition</p>
        </div>
      </div>
      <SeoSubnav />
      <AgentsHowTo {...AGENT_HOW_TO.keywordPlanner} />
      {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}

      <section className="agents-card">
        <AgentsModeSelect
          label="Discover by"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'keywords', label: 'Seed keywords' },
            { value: 'url', label: 'Website URL' },
          ]}
        />

        {mode === 'keywords' ? (
          <textarea
            rows={4}
            placeholder="crystal choker, bridal jhumka, kundan necklace set"
            value={seedsText}
            onChange={(e) => setSeedsText(e.target.value)}
            className="agents-seeds-input"
          />
        ) : (
          <input
            placeholder="https://minaki.shop"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        )}

        <label>
          Max results
          <input
            type="number"
            min={1}
            max={1000}
            value={maxResults}
            onChange={(e) => setMaxResults(e.target.value)}
          />
        </label>

        <div className="agents-actions">
          <button type="button" className="agents-btn primary" onClick={runDiscover} disabled={loading}>
            {loading ? 'Fetching…' : 'Get keyword ideas'}
          </button>
        </div>
      </section>

      {loading && <LoadingSpinner message="Calling Google Ads Keyword Planner…" />}

      {result && (
        <section className="agents-card">
          <h2 className="agents-section-title">
            {total} keyword idea{total === 1 ? '' : 's'}
            {mode === 'url' ? ` for ${result.url}` : ''}
          </h2>
          {total >= 1000 && (
            <p className="agents-validation">
              Hit the 1000 max-results ceiling — Google may have more ideas than shown here.
            </p>
          )}
          <div className="agents-table-wrap">
            <table className="agents-table">
              <thead>
                <tr>
                  <th>Keyword</th>
                  <th>Avg monthly searches</th>
                  <th>Competition</th>
                  <th>Comp. index</th>
                  <th>Top-of-page bid (low–high)</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <React.Fragment key={i}>
                    <tr>
                      <td>{row.keyword}</td>
                      <td>{row.avg_monthly_searches ?? '—'}</td>
                      <td>{row.competition ?? '—'}</td>
                      <td>{row.competition_indexed ?? '—'}</td>
                      <td>
                        {formatBidMicros(row.raw?.low_top_of_page_bid_micros)}
                        {' – '}
                        {formatBidMicros(row.raw?.high_top_of_page_bid_micros)}
                      </td>
                      <td>
                        {(row.raw?.monthly_search_volumes || []).length > 0 && (
                          <button
                            type="button"
                            className="agents-link-btn"
                            onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                          >
                            {expandedRow === i ? 'Hide trend' : 'Trend'}
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandedRow === i && (
                      <tr>
                        <td colSpan={6}>
                          <p className="agents-preview-skus">
                            {(row.raw?.monthly_search_volumes || [])
                              .map((m) => `${m.month}/${m.year}: ${m.monthly_searches ?? '—'}`)
                              .join(' · ')}
                          </p>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
