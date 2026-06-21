import React, { useState } from 'react';
import { Info, Download } from 'lucide-react';

function buildSampleCsv(template) {
  if (!template?.columns?.length) return 'product_sku\nCE-001\nCE-002';
  const headers = template.columns.map((c) => c.name).join(',');
  const row = template.columns
    .map((c) => template.sample_row?.[c.name] || '')
    .join(',');
  return `${headers}\n${row}`;
}

export const CsvSchemaHelp = ({ template }) => {
  const [open, setOpen] = useState(false);
  if (!template) return null;

  const downloadSample = () => {
    const csv = buildSampleCsv(template);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = template.sample_filename || 'sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="agents-help">
      <button type="button" className="agents-help-trigger" onClick={() => setOpen(!open)}>
        <Info size={18} />
        <span>What columns do I need?</span>
      </button>
      {open && (
        <div className="agents-help-panel">
          <p className="agents-help-desc">{template.description}</p>
          <table className="agents-help-table">
            <thead>
              <tr>
                <th>Column</th>
                <th>Required</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {template.columns.map((col) => (
                <tr key={col.name}>
                  <td>
                    <code>{col.name}</code>
                    {col.aliases?.length > 0 && (
                      <span className="agents-alias"> or {col.aliases.join(', ')}</span>
                    )}
                  </td>
                  <td>{col.required ? 'Yes' : 'Optional'}</td>
                  <td>{col.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" className="agents-btn secondary" onClick={downloadSample}>
            <Download size={16} />
            Download sample CSV
          </button>
        </div>
      )}
    </div>
  );
};
