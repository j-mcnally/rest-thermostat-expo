/**
 * `useNleClient()` — memoized NleClient bound to the current persisted
 * baseUrl + auth. Returns null while config is still hydrating or no
 * server URL has been picked.
 */

import { useMemo } from 'react';

import { createNleClient, type NleClient } from '@/lib/api/nle-client';
import { headersFor } from '@/lib/auth/config';
import { useConfigStore } from '@/lib/state/config-store';

export function useNleClient(): NleClient | null {
  const serverUrl = useConfigStore((s) => s.serverUrl);
  const auth = useConfigStore((s) => s.auth);
  const hydrated = useConfigStore((s) => s.hydrated);

  return useMemo(() => {
    if (!hydrated || !serverUrl) return null;
    return createNleClient({
      baseUrl: serverUrl,
      authHeaders: headersFor(auth),
    });
  }, [hydrated, serverUrl, auth]);
}
