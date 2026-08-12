import { ReactNode } from 'react';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { useLocation, Link } from 'wouter';
import { LogOut, LayoutDashboard, Building, MapPin, Package, ClipboardList, Mail, Fingerprint, Shield, ChevronDown } from 'lucide-react';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function AdminLayout({ children }: { children: ReactNode }) {
  const { admin, isLoading, logout } = useAdminAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  if (!admin) {
    setLocation('/admin/login');
    return null;
  }

  const handleLogout = async () => {
    await logout();
    setLocation('/admin/login');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full flex-col lg:flex-row bg-gray-50">
        
        <div className="lg:hidden flex items-center justify-between p-4 bg-primary text-white border-b">
          <div className="font-bold text-xl tracking-tight">Smart On X Admin</div>
          <SidebarTrigger className="text-white" />
        </div>

        <Sidebar className="hidden lg:flex border-r" variant="sidebar">
          <SidebarHeader className="p-6 bg-primary text-white">
            <div className="flex items-center gap-2 px-2">
              <Shield className="w-6 h-6" />
              <div className="font-bold text-lg tracking-tight">Admin Console</div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="px-4 gap-6 py-6">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2 px-2">Core</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Dashboard">
                      <Link href="/admin">
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        <span>Dashboard</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Organizations">
                      <Link href="/admin/organizations">
                        <Building className="w-4 h-4 mr-2" />
                        <span>Organizations</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Orders">
                      <Link href="/admin/orders">
                        <Package className="w-4 h-4 mr-2" />
                        <span>All Orders</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2 px-2">Operations</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Onboard Customer">
                      <Link href="/admin/onboard">
                        <ClipboardList className="w-4 h-4 mr-2" />
                        <span>Onboard Customer</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Location Requests">
                      <Link href="/admin/location-requests">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>Location Requests</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2 px-2">System</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Integration Log">
                      <Link href="/admin/integration-log">
                        <Shield className="w-4 h-4 mr-2" />
                        <span>Integration Log</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Email Log">
                      <Link href="/admin/email-log">
                        <Mail className="w-4 h-4 mr-2" />
                        <span>Email Log</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Identity Resolver">
                      <Link href="/admin/identity">
                        <Fingerprint className="w-4 h-4 mr-2" />
                        <span>Identity Resolver</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Staff">
                      <Link href="/admin/staff">
                        <Shield className="w-4 h-4 mr-2" />
                        <span>Staff Directory</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="w-full flex items-center justify-between hover:bg-gray-100 rounded-lg p-2 transition-colors">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Avatar className="h-8 w-8 bg-primary/10 text-primary">
                      <AvatarFallback>{admin.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start overflow-hidden">
                      <span className="text-sm font-medium truncate w-full">{admin.name}</span>
                      <span className="text-xs text-gray-500 truncate w-full">{admin.email}</span>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
