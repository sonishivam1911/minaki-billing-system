// Shared CSV export used across the SEO agent pages (Site Crawl, Rank
// Tracker, Backlinks). Column value is a functional accessor rather than a
// plain `row[key]` lookup — lets callers export computed/joined values
// without pre-shaping their data first. `src/utils/exportUtils.js` has a
// similar `exportToCSV`, but with a `{key, label, format}` shape geared at
// the billing reports; this one matches what the SEO pages already used
// (extracted here, not rewritten) since rewriting every existing call site
// to the other shape isn't worth it for a straight lift-and-share.
export function downloadCsv(filename, rows, columns) {
  const escape = (val) => {
    const s = val == null ? '' : String(val);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map((c) => escape(c.label)).join(',');
  const lines = rows.map((row) => columns.map((c) => escape(c.value(row))).join(','));
  const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
