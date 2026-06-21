import React, { useEffect, useState } from 'react';
import { agentsApi } from '../../services/agentsApi';
import { LoadingSpinner } from '../LoadingSpinner';

export const ShopifyProductPicker = ({ selectedSkus, onSelectionChange }) => {
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = async (search = q) => {
    setLoading(true);
    setError(null);
    try {
      const res = await agentsApi.searchShopifyProducts({ q: search || undefined, limit: 25 });
      setItems(res.items || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load('');
  }, []);

  const toggle = (sku) => {
    if (!sku) return;
    const set = new Set(selectedSkus);
    if (set.has(sku)) set.delete(sku);
    else set.add(sku);
    onSelectionChange([...set]);
  };

  return (
    <div className="agents-shopify-picker">
      <div className="agents-search-row">
        <input
          type="search"
          placeholder="Search by title or SKU…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(q)}
        />
        <button type="button" className="agents-btn secondary" onClick={() => load(q)}>
          Search
        </button>
      </div>
      {error && <p className="agents-warn">{error}</p>}
      {loading ? (
        <LoadingSpinner message="Loading products…" />
      ) : (
        <div className="agents-table-wrap">
          <table className="agents-table">
            <thead>
              <tr>
                <th />
                <th>SKU</th>
                <th>Title</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedSkus.includes(p.sku)}
                      onChange={() => toggle(p.sku)}
                      disabled={!p.sku}
                    />
                  </td>
                  <td><code>{p.sku || '—'}</code></td>
                  <td>{p.title}</td>
                  <td>{p.product_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="agents-preview-skus">{selectedSkus.length} selected</p>
    </div>
  );
};
