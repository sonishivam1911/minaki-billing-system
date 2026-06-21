import React from 'react';

export const WriterResultsTable = ({ results }) => {
  const rows = Array.isArray(results) ? results : [];
  if (!rows.length) return null;

  return (
    <div className="agents-results">
      <h3 className="agents-section-title">Results</h3>
      <div className="agents-table-wrap">
        <table className="agents-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Status</th>
              <th>Current title</th>
              <th>Suggested title</th>
              <th>Description preview</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const preview = row.preview || {};
              const title = preview.title || row.product_title || '';
              const desc = String(preview.description ?? '').slice(0, 120);
              return (
                <tr key={row.sku || Math.random()}>
                  <td><code>{row.sku}</code></td>
                  <td>
                    <span className={`agents-status agents-status-${row.success ? 'ok' : 'err'}`}>
                      {row.status}
                    </span>
                  </td>
                  <td>{row.existing_title || '—'}</td>
                  <td>{title || '—'}</td>
                  <td>{desc ? `${desc}…` : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
