import React, { useCallback, useEffect, useState } from 'react';
import { seoApi } from '../../services/seoApi';
import { SeoSubnav } from '../../components/seo/SeoSubnav';
import { AgentsHowTo } from '../../components/agents/AgentsHowTo';
import { AGENT_HOW_TO } from '../../components/agents/agentHowToCopy';
import { LoadingSpinner, ErrorMessage } from '../../components';

export const RankTrackerPage = () => {
  const [trackers, setTrackers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [name, setName] = useState('');
  const [targetDomain, setTargetDomain] = useState('minaki.me');
  const [keywordsText, setKeywordsText] = useState('');
  const [device, setDevice] = useState('mobile');
  const [creating, setCreating] = useState(false);

  const [selected, setSelected] = useState(null);
  const [results, setResults] = useState([]);
  const [checking, setChecking] = useState(false);

  const loadTrackers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await seoApi.listRankTrackers({ limit: 50 });
      setTrackers(res.items || res || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrackers();
  }, [loadTrackers]);

  const createTracker = async () => {
    const keywords = keywordsText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!name.trim() || !targetDomain.trim() || !keywords.length) {
      setError('Name, target domain, and at least one keyword are required');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      await seoApi.createRankTracker({
        name: name.trim(),
        target_domain: targetDomain.trim(),
        keywords,
        device,
      });
      setName('');
      setKeywordsText('');
      await loadTrackers();
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const openTracker = async (tracker) => {
    setSelected(tracker);
    setResults([]);
    setLoading(true);
    setError(null);
    try {
      const res = await seoApi.getRankTrackerResults(tracker.id, { limit: 200 });
      setResults(res.items || res || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const runCheck = async () => {
    if (!selected) return;
    setChecking(true);
    setError(null);
    try {
      await seoApi.checkRankTracker(selected.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="screen-container agents-page">
      <div className="screen-header">
        <div>
          <h1 className="screen-title">Rank Tracker</h1>
          <p className="screen-subtitle">Track keyword rankings over time (DataForSEO SERP)</p>
        </div>
      </div>
      <SeoSubnav />
      <AgentsHowTo {...AGENT_HOW_TO.rankTracker} />
      {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}

      <section className="agents-card">
        <h2 className="agents-section-title">New tracker</h2>
        <input placeholder="Tracker name" value={name} onChange={(e) => setName(e.target.value)} />
        <input
          placeholder="Target domain (minaki.me)"
          value={targetDomain}
          onChange={(e) => setTargetDomain(e.target.value)}
        />
        <textarea
          rows={3}
          placeholder="One keyword per line"
          value={keywordsText}
          onChange={(e) => setKeywordsText(e.target.value)}
          className="agents-seeds-input"
        />
        <label>
          Device
          <select value={device} onChange={(e) => setDevice(e.target.value)}>
            <option value="mobile">Mobile</option>
            <option value="desktop">Desktop</option>
          </select>
        </label>
        <div className="agents-actions">
          <button type="button" className="agents-btn primary" onClick={createTracker} disabled={creating}>
            {creating ? 'Creating…' : 'Create tracker'}
          </button>
        </div>
      </section>

      <section className="agents-card">
        <h2 className="agents-section-title">Trackers</h2>
        {loading && !selected ? (
          <LoadingSpinner message="Loading trackers…" />
        ) : (
          <table className="agents-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Domain</th>
                <th>Keywords</th>
                <th>Device</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {trackers.map((t) => (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td>{t.target_domain}</td>
                  <td>{(t.keywords || []).length}</td>
                  <td>{t.device}</td>
                  <td>
                    <button type="button" className="agents-link-btn" onClick={() => openTracker(t)}>
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {selected && (
        <section className="agents-card">
          <h2 className="agents-section-title">{selected.name} — results</h2>
          <div className="agents-actions">
            <button type="button" className="agents-btn secondary" onClick={runCheck} disabled={checking}>
              {checking ? 'Checking…' : 'Check now'}
            </button>
          </div>
          {loading ? (
            <LoadingSpinner message="Loading results…" />
          ) : (
            <table className="agents-table">
              <thead>
                <tr>
                  <th>Keyword</th>
                  <th>Rank</th>
                  <th>Checked at</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={r.id || i}>
                    <td>{r.keyword}</td>
                    <td>{r.rank ?? 'Not in top results'}</td>
                    <td>{r.checked_at ? new Date(r.checked_at).toLocaleString() : '—'}</td>
                    <td>{r.error || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </div>
  );
};
