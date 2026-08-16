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

  const fetchResults = async () => {
    if (!keyword.trim()) {
      setError('Enter a keyword');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await seoApi.getSerpResults({ keyword: keyword.trim(), device }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
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
          <button type="button" className="agents-btn primary" onClick={fetchResults} disabled={loading}>
            Fetch
          </button>
        </div>
      </section>

      {loading && <LoadingSpinner message="Fetching SERP…" />}

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
