/**
 * Top-level provider stack. Mirrors the Riverpod `ProviderScope` in
 * the upstream Flutter `lib/main.dart`.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMemo, type ReactNode } from 'react';

interface RootProvidersProps {
  children: ReactNode;
}

export function RootProviders({ children }: RootProvidersProps) {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Polling cadence is driven per-query (devices = 20s,
            // schedule = on demand). Globally cap retries because our
            // NleClient already retries once internally for transient
            // failures on writes; for reads we'd rather surface the
            // error to the UI than silently spin.
            retry: false,
            refetchOnWindowFocus: false,
            staleTime: 0,
            gcTime: 1000 * 60 * 10,
          },
        },
      }),
    [],
  );
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
