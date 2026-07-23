import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';

import { ThemeProvider } from '@/components/ThemeProvider';
import { QUERY_STALE_TIME } from '@/constants';
import { PermissionProvider } from '@/features/auth/contexts/PermissionProvider';
import { AppRoutes } from '@/routes/AppRoutes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_STALE_TIME,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <BrowserRouter>
          <PermissionProvider>
            <AppRoutes />
            <Toaster richColors position="top-right" />
          </PermissionProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
