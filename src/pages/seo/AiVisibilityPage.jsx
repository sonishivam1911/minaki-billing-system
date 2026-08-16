import React, { useCallback, useEffect, useState } from 'react';
import { seoApi } from '../../services/seoApi';
import { SeoSubnav } from '../../components/seo/SeoSubnav';
import { AgentsHowTo } from '../../components/agents/AgentsHowTo';
import { AGENT_HOW_TO } from '../../components/agents/agentHowToCopy';
import { LoadingSpinner, ErrorMessage } from '../../components';

export const AiVisibilityPage = () => {
  const [prompt, setPrompt] = useState('');
  const [brandsText, setBrandsText] = useState('Minaki');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await seoApi.getAiVisibilityHistory({ limit: 100 });
      setHistory(res.items || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const runCheck = async () => {
    const brandNames = brandsText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!prompt.trim() || !brandNames.length) {
      setError('Enter a prompt and at least one brand name');
      return;
    }
    setChecking(true);
    setError(null);
    try {
      const res = await seoApi.checkAiVisibility({ prompt: prompt.trim(), brand_names: brandNames });
      setResult(res);
      await loadHistory();
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
          <h1 className="screen-title">AI Visibility</h1>
          <p className="screen-subtitle">Check whether AI models mention your brand (OpenRouter)</p>
        </div>
      </div>
      <SeoSubnav />
      <AgentsHowTo {...AGENT_HOW_TO.aiVisibility} />
      {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}

      <section className="agents-card">
        <h2 className="agents-section-title">New check</h2>
        <textarea
          rows={3}
          placeholder="Best jewellery brands for bridal wear in India"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="agents-seeds-input"
        />
        <input
          placeholder="Brand names, comma separated"
          value={brandsText}
          onChange={(e) => setBrandsText(e.target.value)}
        />
        <div className="agents-actions">
          <button type="button" className="agents-btn primary" onClick={runCheck} disabled={checking}>
            {checking ? 'Checking…' : 'Check'}
          </button>
        </div>

        {result && (
          <div className="agents-table-wrap">
            <p className="agents-preview-skus">
              Mentioned in {result.mentioned_in_models} of {result.models_checked} models (
              {Math.round((result.visibility_rate || 0) * 100)}%)
            </p>
            <table className="agents-table">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Mentioned</th>
                  <th>Matches</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {result.results.map((r) => (
                  <tr key={r.model}>
                    <td>{r.model}</td>
                    <td>{r.mentioned ? 'Yes' : 'No'}</td>
                    <td>{(r.matches || []).map((m) => `${m.brand} (${m.count})`).join(', ') || '—'}</td>
                    <td>{r.error || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="agents-card">
        <h2 className="agents-section-title">History</h2>
        {loading ? (
          <LoadingSpinner message="Loading history…" />
        ) : (
          <table className="agents-table">
            <thead>
              <tr>
                <th>Prompt</th>
                <th>Model</th>
                <th>Mentioned</th>
                <th>Checked at</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id}>
                  <td>{h.prompt}</td>
                  <td>{h.model}</td>
                  <td>{h.mentioned ? 'Yes' : 'No'}</td>
                  <td>{h.checked_at ? new Date(h.checked_at).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};
