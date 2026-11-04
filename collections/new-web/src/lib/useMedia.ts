'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Subscribe to a CSS media query. The server snapshot (and therefore the first client render
 * during hydration) uses `server`, so markup matches; the real value follows right after.
 */
export function useMedia(query: string, server = false): boolean {
  const subscribe = useCallback(
    (cb: () => void) => {
      const m = window.matchMedia(query);
      m.addEventListener('change', cb);
      return () => m.removeEventListener('change', cb);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => server,
  );
}
