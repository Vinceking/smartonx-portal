import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

import { AuthProvider } from '@/hooks/use-auth';
import { AdminAuthProvider } from '@/hooks/use-admin-auth';

// Layouts
import { PublicLayout } from '@/components/layout/public-layout';
import { PortalLayout } from '@/components/layout/portal-layout';
import { AdminLayout } from '@/components/layout/admin-layout';

// Public Pages
import Home from '@/pages/public/home';
import Login from '@/pages/public/login';
import ForgotUsername from '@/pages/public/forgot-username';
import ForgotPassword from '@/pages/public/forgot-password';
import ResetPassword from '@/pages/public/reset-password';
import Shop from '@/pages/public/shop';
import PlaceholderPage from '@/pages/public/placeholder';

// Portal Pages
import PortalDashboard from '@/pages/portal/dashboard';
import PortalChangePassword from '@/pages/portal/change-password';
import PortalOrders from '@/pages/portal/orders/index';
import PortalOrderDetail from '@/pages/portal/orders/detail';
import PortalOrderNew from '@/pages/portal/orders/new';
import PortalLocations from '@/pages/portal/locations';
import PortalAccount from '@/pages/portal/account';
import ManageTeam from '@/pages/portal/manage/team';
import ManageContacts from '@/pages/portal/manage/contacts';
import ManageLocations from '@/pages/portal/manage/locations';
import ManageBilling from '@/pages/portal/manage/billing';

// Admin Pages
import AdminLogin from '@/pages/admin/login';
import AdminDashboard from '@/pages/admin/dashboard';
import AdminOrgs from '@/pages/admin/organizations/index';
import AdminOrgDetail from '@/pages/admin/organizations/detail';
import AdminOnboard from '@/pages/admin/onboard';
import AdminLocationRequests from '@/pages/admin/location-requests';
import AdminOrders from '@/pages/admin/orders';
import AdminIntegrationLog from '@/pages/admin/integration-log';
import AdminEmailLog from '@/pages/admin/email-log';
import AdminIdentity from '@/pages/admin/identity';
import AdminStaff from '@/pages/admin/staff';

const queryClient = new QueryClient();

function PortalRoutes() {
  return (
    <PortalLayout>
      <Switch>
        <Route path="/portal" component={PortalDashboard} />
        <Route path="/portal/change-password" component={PortalChangePassword} />
        <Route path="/portal/orders" component={PortalOrders} />
        <Route path="/portal/orders/new" component={PortalOrderNew} />
        <Route path="/portal/orders/:id" component={PortalOrderDetail} />
        <Route path="/portal/locations" component={PortalLocations} />
        <Route path="/portal/account" component={PortalAccount} />
        <Route path="/portal/manage/team" component={ManageTeam} />
        <Route path="/portal/manage/contacts" component={ManageContacts} />
        <Route path="/portal/manage/locations" component={ManageLocations} />
        <Route path="/portal/manage/billing" component={ManageBilling} />
        <Route component={NotFound} />
      </Switch>
    </PortalLayout>
  );
}

function AdminRoutes() {
  return (
    <AdminAuthProvider>
      <Switch>
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin*">
          <AdminLayout>
            <Switch>
              <Route path="/admin" component={AdminDashboard} />
              <Route path="/admin/organizations" component={AdminOrgs} />
              <Route path="/admin/organizations/:id" component={AdminOrgDetail} />
              <Route path="/admin/onboard" component={AdminOnboard} />
              <Route path="/admin/location-requests" component={AdminLocationRequests} />
              <Route path="/admin/orders" component={AdminOrders} />
              <Route path="/admin/integration-log" component={AdminIntegrationLog} />
              <Route path="/admin/email-log" component={AdminEmailLog} />
              <Route path="/admin/identity" component={AdminIdentity} />
              <Route path="/admin/staff" component={AdminStaff} />
              <Route component={NotFound} />
            </Switch>
          </AdminLayout>
        </Route>
      </Switch>
    </AdminAuthProvider>
  );
}

/** AuthProvider must wrap both public pages (login uses useAuth) and portal pages */
function PortalAndPublicRoutes() {
  return (
    <AuthProvider>
      <Switch>
        <Route path="/portal*" component={PortalRoutes} />
        <Route path="*">
          <PublicLayout>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/login" component={Login} />
              <Route path="/forgot-username" component={ForgotUsername} />
              <Route path="/forgot-password" component={ForgotPassword} />
              <Route path="/reset-password" component={ResetPassword} />
              <Route path="/shop" component={Shop} />
              <Route path="/about" component={() => <PlaceholderPage title="About Us" />} />
              <Route path="/training" component={() => <PlaceholderPage title="Training" />} />
              <Route path="/contact" component={() => <PlaceholderPage title="Contact" />} />
              <Route path="/events" component={() => <PlaceholderPage title="Events" />} />
              <Route path="/blog" component={() => <PlaceholderPage title="Blog" />} />
              <Route component={NotFound} />
            </Switch>
          </PublicLayout>
        </Route>
      </Switch>
    </AuthProvider>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        {/* Admin context — isolated AdminAuthProvider */}
        <Route path="/admin*" component={AdminRoutes} />
        {/* Portal + Public context — shared AuthProvider */}
        <Route path="*" component={PortalAndPublicRoutes} />
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
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;