import React, { useEffect, useState } from 'react';
import { seoApi } from '../../services/seoApi';
import { SeoSubnav } from '../../components/seo/SeoSubnav';
import { AgentsModeSelect } from '../../components/agents/AgentsModeSelect';
import { AgentsHowTo } from '../../components/agents/AgentsHowTo';
import { AGENT_HOW_TO } from '../../components/agents/agentHowToCopy';
import { LoadingSpinner, ErrorMessage } from '../../components';

const PAGE_SIZE = 50;

export const BacklinksPage = () => {
  const [target, setTarget] = useState('minaki.me');
  const [tab, setTab] = useState('summary');
  const [summary, setSummary] = useState(null);
  const [list, setList] = useState({ items: [], total_count: 0 });
  const [domains, setDomains] = useState({ items: [], total_count: 0 });
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [spendStatus, setSpendStatus] = useState(null);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState(null);
  const [snapshots, setSnapshots] = useState(null);
  const [snapshotsLoading, setSnapshotsLoading] = useState(false);
  const [showSnapshots, setShowSnapshots] = useState(false);

  const loadSpendStatus = async () => {
    try {
      setSpendStatus(await seoApi.getDataForSeoSpendStatus());
    } catch (e) {
      setSpendStatus(null);
    }
  };

  // Gated, cache-first, cost-guardrailed — "the real deal where money
  // goes." Deliberately requires an explicit click; nothing on this page
  // (or anywhere else) auto-triggers it.
  const runBacklinkCheck = async () => {
    if (!target.trim()) {
      setError('Enter a domain or URL');
      return;
    }
    setChecking(true);
    setError(null);
    try {
      setCheckResult(await seoApi.checkBacklinks({ target: target.trim() }));
      await loadSpendStatus();
    } catch (e) {
      setError(e.message);
    } finally {
      setChecking(false);
    }
  };

  const toggleSnapshots = async () => {
    if (showSnapshots) {
      setShowSnapshots(false);
      return;
    }
    if (!target.trim()) {
      setError('Enter a domain or URL');
      return;
    }
    setShowSnapshots(true);
    setSnapshotsLoading(true);
    try {
      setSnapshots(await seoApi.getBacklinksSnapshots({ target: target.trim() }));
    } catch (e) {
      setSnapshots(null);
    } finally {
      setSnapshotsLoading(false);
    }
  };

  useEffect(() => {
    loadSpendStatus();
  }, []);

  const run = async (nextTab = tab, nextPage = page) => {
    if (!target.trim()) {
      setError('Enter a domain or URL');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (nextTab === 'summary') {
        setSummary(await seoApi.getBacklinksSummary(target.trim()));
      } else if (nextTab === 'backlinks') {
        setList(await seoApi.listBacklinks(target.trim(), { limit: PAGE_SIZE, offset: nextPage * PAGE_SIZE }));
      } else {
        setDomains(
          await seoApi.listReferringDomains(target.trim(), { limit: PAGE_SIZE, offset: nextPage * PAGE_SIZE })
        );
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const changeTab = (value) => {
    setTab(value);
    setPage(0);
    run(value, 0);
  };

  const changePage = (delta) => {
    const next = Math.max(0, page + delta);
    setPage(next);
    run(tab, next);
  };

  const activeList = tab === 'backlinks' ? list : domains;

  return (
    <div className="screen-container agents-page">
      <div className="screen-header">
        <div>
          <h1 className="screen-title">Backlinks</h1>
          <p className="screen-subtitle">Who links to your domain (DataForSEO)</p>
        </div>
      </div>
      <SeoSubnav />
      <AgentsHowTo {...AGENT_HOW_TO.backlinks} />
      {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}

      <section className="agents-card">
        <h2 className="agents-section-title">Gated check (persisted, cost-guardrailed)</h2>
        <p className="agents-validation">
          The real deal where money goes — never runs automatically. Cache-first: reuses a recent
          snapshot before ever making a paid call.
        </p>
        {spendStatus && (
          <p className="agents-validation">
            DataForSEO spend this month: ${spendStatus.current_month_spend_usd.toFixed(2)} / $
            {spendStatus.monthly_cap_usd.toFixed(2)}
            {!spendStatus.budget_available && ' — cap reached, check will fall back to cache'}
          </p>
        )}
        <div className="agents-actions">
          <button type="button" className="agents-btn primary" onClick={runBacklinkCheck} disabled={checking}>
            {checking ? 'Checking…' : 'Run backlink check'}
          </button>
          <button type="button" className="agents-link-btn" onClick={toggleSnapshots}>
            {showSnapshots ? 'Hide history' : 'View history'}
          </button>
        </div>
        {checkResult && (
          <p className="agents-validation">
            {checkResult.ok === false
              ? `Failed: ${checkResult.error}`
              : `${checkResult.cache_hit ? `Cached${checkResult.stale ? ' (stale)' : ''}` : 'Freshly fetched'} — ${
                  checkResult.summary?.backlinks ?? '—'
                } backlinks, ${checkResult.summary?.referring_domains ?? '—'} referring domains`}
          </p>
        )}
        {showSnapshots && (
          snapshotsLoading ? (
            <LoadingSpinner message="Loading history…" />
          ) : snapshots?.snapshots?.length ? (
            <table className="agents-table">
              <thead>
                <tr>
                  <th>Fetched at</th>
                  <th>Cost</th>
                  <th>Requested by</th>
                </tr>
              </thead>
              <tbody>
                {snapshots.snapshots.map((s, i) => (
                  <tr key={s.id || i}>
                    <td>{s.fetched_at ? new Date(s.fetched_at).toLocaleString() : '—'}</td>
                    <td>{s.cost != null ? `$${Number(s.cost).toFixed(4)}` : '—'}</td>
                    <td>{s.requested_by_email || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="agents-validation">No check history yet for this target.</p>
          )
        )}
      </section>

      <section className="agents-card">
        <h2 className="agents-section-title">Always-live lookup (uncached, no spend cap)</h2>
        <div className="agents-search-row">
          <input placeholder="Domain or URL (minaki.me)" value={target} onChange={(e) => setTarget(e.target.value)} />
          <button type="button" className="agents-btn primary" onClick={() => run()} disabled={loading}>
            Load
          </button>
        </div>

        <AgentsModeSelect
          label="View"
          value={tab}
          onChange={changeTab}
          options={[
            { value: 'summary', label: 'Summary' },
            { value: 'backlinks', label: 'Backlinks' },
            { value: 'domains', label: 'Referring Domains' },
          ]}
        />

        {loading ? (
          <LoadingSpinner message="Loading…" />
        ) : tab === 'summary' ? (
          summary && (
            <table className="agents-table">
              <tbody>
                <tr><td>Domain rank</td><td>{summary.rank ?? '—'}</td></tr>
                <tr><td>Total backlinks</td><td>{summary.backlinks ?? '—'}</td></tr>
                <tr><td>Spam score</td><td>{summary.backlinks_spam_score ?? '—'}</td></tr>
                <tr><td>Referring domains</td><td>{summary.referring_domains ?? '—'}</td></tr>
                <tr><td>Referring main domains</td><td>{summary.referring_main_domains ?? '—'}</td></tr>
                <tr><td>Referring IPs</td><td>{summary.referring_ips ?? '—'}</td></tr>
                <tr><td>Broken backlinks</td><td>{summary.broken_backlinks ?? '—'}</td></tr>
                <tr><td>Broken pages</td><td>{summary.broken_pages ?? '—'}</td></tr>
              </tbody>
            </table>
          )
        ) : tab === 'backlinks' ? (
          <div className="agents-table-wrap">
            <p className="agents-preview-skus">
              Showing {activeList.items.length ? page * PAGE_SIZE + 1 : 0}–{page * PAGE_SIZE + activeList.items.length} of{' '}
              {activeList.total_count ?? 0}
            </p>
            <table className="agents-table">
              <thead>
                <tr>
                  <th>From URL</th>
                  <th>From domain</th>
                  <th>Anchor</th>
                  <th>Dofollow</th>
                  <th>Rank</th>
                  <th>Last seen</th>
                </tr>
              </thead>
              <tbody>
                {activeList.items.map((row, i) => (
                  <tr key={i}>
                    <td>{row.url_from || '—'}</td>
                    <td>{row.domain_from || '—'}</td>
                    <td>{row.anchor || '—'}</td>
                    <td>{row.dofollow == null ? '—' : String(row.dofollow)}</td>
                    <td>{row.rank ?? '—'}</td>
                    <td>{row.last_seen || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="agents-actions">
              <button type="button" className="agents-btn secondary" disabled={page === 0} onClick={() => changePage(-1)}>
                Previous
              </button>
              <button type="button" className="agents-btn secondary" onClick={() => changePage(1)}>
                Next
              </button>
            </div>
          </div>
        ) : (
          <div className="agents-table-wrap">
            <p className="agents-preview-skus">
              Showing {activeList.items.length ? page * PAGE_SIZE + 1 : 0}–{page * PAGE_SIZE + activeList.items.length} of{' '}
              {activeList.total_count ?? 0}
            </p>
            <table className="agents-table">
              <thead>
                <tr>
                  <th>Domain</th>
                  <th>Rank</th>
                  <th>Backlinks</th>
                  <th>Last seen</th>
                </tr>
              </thead>
              <tbody>
                {activeList.items.map((row, i) => (
                  <tr key={i}>
                    <td>{row.domain || '—'}</td>
                    <td>{row.rank ?? '—'}</td>
                    <td>{row.backlinks ?? '—'}</td>
                    <td>{row.last_seen || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="agents-actions">
              <button type="button" className="agents-btn secondary" disabled={page === 0} onClick={() => changePage(-1)}>
                Previous
              </button>
              <button type="button" className="agents-btn secondary" onClick={() => changePage(1)}>
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
