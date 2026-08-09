import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { AuthProvider } from '../auth/AuthProvider';
import { UiSettingsProvider } from '../features/settings/model/UiSettingsProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UiSettingsProvider>{children}</UiSettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
