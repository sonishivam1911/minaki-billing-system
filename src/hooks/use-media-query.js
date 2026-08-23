import { useEffect, useState } from 'react';

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const listener = (event) => setMatches(event.matches);
    setMatches(mql.matches);
    mql.addEventListener('change', listener);
    return () => mql.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

/** agents-ui-material.mdc: mobile nav/tabs are a dropdown at <=767px. */
export const AGENTS_MOBILE_QUERY = '(max-width: 767px)';

export function useIsMobile() {
  return useMediaQuery(AGENTS_MOBILE_QUERY);
}
