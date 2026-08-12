import { ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { useGetCrmCompany, useRefreshCrmCache } from '@workspace/api-client-react';
import { LogOut, RefreshCw, ChevronDown, Package, LayoutDashboard, MapPin, User as UserIcon, Users, Contact, Building2, CreditCard } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

export function PortalLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { data: company, isLoading: isLoadingCompany } = useGetCrmCompany({ query: { enabled: !!user } });
  const refreshCache = useRefreshCrmCache();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  if (!user) {
    setLocation('/login');
    return null;
  }

  if (user.mustChangePassword && !window.location.pathname.includes('/portal/change-password')) {
    setLocation('/portal/change-password');
    return null;
  }

  const handleLogout = async () => {
    await logout();
    setLocation('/login');
  };

  const handleRefresh = async () => {
    await refreshCache.mutateAsync();
    window.location.reload();
  };

  const canManage = user.roleKey === 'org_admin' || user.roleKey === 'regional_admin';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full flex-col lg:flex-row bg-gray-50">
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-900 border-b border-amber-200 flex justify-center items-center gap-2">
          <span>DEMO ENVIRONMENT — mock data, no real orders.</span>
        </div>
        
        <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b mt-10">
          <div className="font-bold text-xl text-primary tracking-tight">Smart On X</div>
          <SidebarTrigger />
        </div>

        <Sidebar className="hidden lg:flex border-r mt-10" variant="sidebar">
          <SidebarHeader className="p-6">
            <div className="flex items-center gap-2 px-2">
              <div className="font-bold text-2xl text-primary tracking-tight">Smart On X</div>
            </div>
            <div className="mt-6 px-2">
              {isLoadingCompany ? <Skeleton className="h-4 w-32" /> : <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{company?.name || 'Loading...'}</div>}
            </div>
          </SidebarHeader>
          
          <SidebarContent className="px-4 gap-6">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2 px-2">Ordering</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Dashboard">
                      <Link href="/portal">
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        <span>Dashboard</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="New Order">
                      <Link href="/portal/order/new">
                        <Package className="w-4 h-4 mr-2" />
                        <span>New Order</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Order History">
                      <Link href="/portal/orders">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        <span>Order History</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="My Locations">
                      <Link href="/portal/locations">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>My Locations</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {canManage && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2 px-2">Manage</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip="Team">
                        <Link href="/portal/manage/team">
                          <Users className="w-4 h-4 mr-2" />
                          <span>Team</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip="Contacts">
                        <Link href="/portal/manage/contacts">
                          <Contact className="w-4 h-4 mr-2" />
                          <span>Contacts</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    {user.roleKey === 'org_admin' && (
                      <>
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild tooltip="Locations">
                            <Link href="/portal/manage/locations">
                              <Building2 className="w-4 h-4 mr-2" />
                              <span>Locations</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild tooltip="Billing">
                            <Link href="/portal/manage/billing">
                              <CreditCard className="w-4 h-4 mr-2" />
                              <span>Billing</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </>
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>

          <SidebarFooter className="p-4 border-t">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="w-full flex items-center justify-between hover:bg-gray-100 rounded-lg p-2 transition-colors">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Avatar className="h-8 w-8 bg-primary/10 text-primary">
                      <AvatarFallback>{user.firstName?.[0]}{user.lastName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start overflow-hidden">
                      <span className="text-sm font-medium truncate w-full">{user.firstName} {user.lastName}</span>
                      <span className="text-xs text-gray-500 truncate w-full">{user.roleLabel}</span>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/portal/account">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleRefresh} disabled={refreshCache.isPending}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${refreshCache.isPending ? 'animate-spin' : ''}`} />
                  <span>Sync CRM Data</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-y-auto mt-10 lg:mt-10 p-6 lg:p-10">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
