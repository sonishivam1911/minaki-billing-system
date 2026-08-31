import { useEffect } from 'react';

const DEFAULT_POLL_INTERVAL_MS = 5000;

// Runs fetchFn immediately whenever its identity changes (mount, or a
// dependency the caller's useCallback closes over), then re-runs it every
// intervalMs for as long as `active` stays true. Replaces the load-once-
// effect + poll-while-condition-effect pair that SiteCrawlPage hand-copied
// once per status type (crawl/extraction/schema, soon content/embedding/
// scoring/SERP/technical/CWV) — same behavior, one place.
export function usePolling(fetchFn, { active = false, intervalMs = DEFAULT_POLL_INTERVAL_MS } = {}) {
  useEffect(() => {
    fetchFn();
  }, [fetchFn]);

  useEffect(() => {
    if (!active) return undefined;
    const timer = setInterval(fetchFn, intervalMs);
    return () => clearInterval(timer);
  }, [active, intervalMs, fetchFn]);
}
