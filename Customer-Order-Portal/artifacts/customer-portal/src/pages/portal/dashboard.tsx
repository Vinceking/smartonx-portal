import { useGetPortalDashboard } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, TrendingUp, MapPin, Calendar, ArrowRight, ShoppingCart } from 'lucide-react';
import { Link } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function PortalDashboard() {
  const { data, isLoading } = useGetPortalDashboard();

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of your account and recent activity.</p>
        </div>
        <Button asChild size="lg" className="shrink-0 bg-accent hover:bg-accent/90">
          <Link href="/portal/orders/new">
            <ShoppingCart className="w-4 h-4 mr-2" />
            New Order
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Orders This Year</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{data.ordersThisYear}</div>
          </CardContent>
        </Card>
        
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Last Order</CardTitle>
            <Calendar className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {data.lastOrderDate ? format(new Date(data.lastOrderDate), 'MMM d, yyyy') : 'Never'}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-gray-200 shadow-sm lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Default Location</CardTitle>
            <MapPin className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold text-primary flex items-center gap-2">
              {data.defaultLocationNickname || 'No default location set'}
            </div>
            {!data.defaultLocationNickname && (
              <p className="text-sm text-gray-500 mt-1">Set a default location in your account settings.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Orders</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-accent hover:text-accent/80">
              <Link href="/portal/orders">View All <ArrowRight className="ml-1 w-4 h-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data.recentOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p>No orders placed yet.</p>
                <Button asChild variant="outline" className="mt-4">
                  <Link href="/portal/orders/new">Place your first order</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {data.recentOrders.map(order => (
                  <Link key={order.id} href={`/portal/orders/${order.id}`}>
                    <div className="flex items-center justify-between p-4 rounded-lg border hover:border-accent hover:bg-accent/5 transition-colors cursor-pointer bg-white">
                      <div className="flex flex-col gap-1">
                        <div className="font-semibold text-primary">{order.orderNumber}</div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(order.orderedAt), 'MMM d, yyyy h:mm a')} • {order.locationNickname}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <div className="font-bold">{formatCurrency(order.totalCents)}</div>
                          <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'} className="text-[10px]">
                            {order.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Quick Reorder</CardTitle>
            <p className="text-sm text-gray-500">Frequently ordered products</p>
          </CardHeader>
          <CardContent>
            {data.quickReorderProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No quick reorder products available yet.
              </div>
            ) : (
              <div className="space-y-4">
                {data.quickReorderProducts.map(product => (
                  <div key={product.id} className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50">
                    <div className="w-12 h-12 bg-white rounded flex-shrink-0 overflow-hidden border">
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-primary truncate">{product.name}</div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">{product.sku}</div>
                    </div>
                    <Button asChild size="sm" variant="outline" className="shrink-0">
                      <Link href="/portal/orders/new">Order</Link>
                    </Button>
                    <div className="text-sm font-bold shrink-0">{formatCurrency(product.unitPriceCents)}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
