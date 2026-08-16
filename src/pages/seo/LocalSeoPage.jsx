import React, { useState } from 'react';
import { seoApi } from '../../services/seoApi';
import { SeoSubnav } from '../../components/seo/SeoSubnav';
import { AgentsHowTo } from '../../components/agents/AgentsHowTo';
import { AGENT_HOW_TO } from '../../components/agents/agentHowToCopy';
import { LoadingSpinner, ErrorMessage } from '../../components';

export const LocalSeoPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = async () => {
    if (!query.trim()) {
      setError('Enter a search phrase');
      return;
    }
    setLoading(true);
    setError(null);
    setSelected(null);
    try {
      const res = await seoApi.searchLocalPlaces({ query: query.trim() });
      setResults(res.items || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const openDetails = async (placeId) => {
    setLoading(true);
    setError(null);
    try {
      setSelected(await seoApi.getPlaceDetails(placeId));
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
          <h1 className="screen-title">Local SEO</h1>
          <p className="screen-subtitle">Search local business listings (Google Places)</p>
        </div>
      </div>
      <SeoSubnav />
      <AgentsHowTo {...AGENT_HOW_TO.localSeo} />
      {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}

      <section className="agents-card">
        <div className="agents-search-row">
          <input
            placeholder="jewellery store near Connaught Place Delhi"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="button" className="agents-btn primary" onClick={search} disabled={loading}>
            Search
          </button>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading…" />
        ) : (
          <table className="agents-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Address</th>
                <th>Rating</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.place_id}>
                  <td>{r.name}</td>
                  <td>{r.address || '—'}</td>
                  <td>{r.rating != null ? `${r.rating} (${r.review_count ?? 0})` : '—'}</td>
                  <td>{r.business_status || '—'}</td>
                  <td>
                    <button type="button" className="agents-link-btn" onClick={() => openDetails(r.place_id)}>
                      Details
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
          <h2 className="agents-section-title">{selected.name}</h2>
          <table className="agents-table">
            <tbody>
              <tr><td>Address</td><td>{selected.address || '—'}</td></tr>
              <tr><td>Phone</td><td>{selected.phone || '—'}</td></tr>
              <tr><td>Website</td><td>{selected.website || '—'}</td></tr>
              <tr><td>Rating</td><td>{selected.rating != null ? `${selected.rating} (${selected.review_count ?? 0})` : '—'}</td></tr>
              <tr><td>Status</td><td>{selected.business_status || '—'}</td></tr>
              <tr>
                <td>Opening hours</td>
                <td>{(selected.opening_hours || []).join(' · ') || '—'}</td>
              </tr>
            </tbody>
          </table>
          {(selected.reviews || []).length > 0 && (
            <>
              <h3 className="agents-section-title">Reviews</h3>
              {selected.reviews.map((rev, i) => (
                <p key={i} className="agents-validation">
                  {rev.rating != null ? `★ ${rev.rating} — ` : ''}
                  {rev.text || ''}
                </p>
              ))}
            </>
          )}
        </section>
      )}
    </div>
  );
};
