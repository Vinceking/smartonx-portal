import { useGetAdminDashboard } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, Users, Package, DollarSign, MapPin, ArrowRight } from 'lucide-react';
import { Link } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const { data, isLoading } = useGetAdminDashboard();

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary tracking-tight">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Platform overview and recent activity.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Orgs</CardTitle>
            <Building className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{data.totalOrgs}</div>
          </CardContent>
        </Card>
        
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Portal Users</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{data.totalPortalUsers}</div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Orders (This Month)</CardTitle>
            <Package className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{data.ordersThisMonth}</div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Revenue (This Month)</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{formatCurrency(data.revenueThisMonthCents)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Orders</CardTitle>
            <Link href="/admin/orders" className="text-sm font-medium text-accent hover:underline flex items-center">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No recent orders.</div>
            ) : (
              <div className="space-y-4">
                {data.recentOrders.map(order => (
                  <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-gray-50">
                    <div className="flex flex-col gap-1 mb-2 sm:mb-0">
                      <div className="font-semibold text-primary">{order.orderNumber} <span className="text-gray-400 font-normal text-sm ml-2">{order.orgName}</span></div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(order.orderedAt), 'MMM d, yyyy h:mm a')} • {order.locationNickname}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div className="font-bold text-primary">{formatCurrency(order.totalCents)}</div>
                      <Badge variant="outline" className="capitalize w-24 justify-center bg-white">
                        {order.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className={data.pendingLocationRequests > 0 ? "border-amber-200 shadow-md bg-amber-50" : "border-gray-200 shadow-sm"}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className={`w-5 h-5 ${data.pendingLocationRequests > 0 ? 'text-amber-600' : 'text-gray-400'}`} />
                Location Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end mt-2">
                <div>
                  <div className={`text-4xl font-bold ${data.pendingLocationRequests > 0 ? 'text-amber-700' : 'text-gray-900'}`}>
                    {data.pendingLocationRequests}
                  </div>
                  <div className={`text-sm mt-1 ${data.pendingLocationRequests > 0 ? 'text-amber-600' : 'text-gray-500'}`}>
                    Pending approval
                  </div>
                </div>
                <Link href="/admin/location-requests" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${data.pendingLocationRequests > 0 ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  Review
                </Link>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/admin/onboard" className="block w-full text-left px-4 py-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors font-medium text-sm text-gray-700">
                + Onboard New Customer
              </Link>
              <Link href="/admin/organizations" className="block w-full text-left px-4 py-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors font-medium text-sm text-gray-700">
                View All Organizations
              </Link>
              <Link href="/admin/integration-log" className="block w-full text-left px-4 py-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors font-medium text-sm text-gray-700">
                Check Integration Logs
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
