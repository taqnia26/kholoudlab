import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Home from '@/pages/home';
import About from '@/pages/about';
import StaffResults from '@/pages/staff-results';
import OurServicesContacts from '@/pages/our-services-contacts';
import WhatsApp from '@/pages/whatsapp';
import { WhatsAppFloat } from '@/components/layout/whatsapp-float';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
          <Route path="/about" component={About} />
          <Route path="/staff/results" component={StaffResults} />
          <Route path="/our-services-contacts" component={OurServicesContacts} />
          <Route path="/whatsapp" component={WhatsApp} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <WhatsAppFloat />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
