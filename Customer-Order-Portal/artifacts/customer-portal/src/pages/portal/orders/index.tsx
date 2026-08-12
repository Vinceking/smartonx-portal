import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useListPortalOrders } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { Search, ChevronRight, PackageOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function PortalOrders() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const ordersQuery = useListPortalOrders(
    { status: statusFilter === 'all' ? undefined : statusFilter, limit: 100 },
    { query: { placeholderData: keepPreviousData } }
  );

  const orders = ordersQuery.data?.orders || [];

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'shipped': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Order History</h1>
          <p className="text-gray-500 mt-1">View and track all your orders.</p>
        </div>
      </div>

      <Card className="border-gray-200 shadow-sm">
        <div className="p-4 border-b bg-gray-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex w-full sm:w-auto items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <CardContent className="p-0">
          {ordersQuery.isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-24 text-gray-500">
              <PackageOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No orders found</h3>
              <p className="mt-1 text-sm">We couldn't find any orders matching your filters.</p>
              {statusFilter !== 'all' && (
                <Button variant="link" onClick={() => setStatusFilter('all')} className="mt-4 text-accent">
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-accent/5 group cursor-pointer">
                      <TableCell className="font-semibold text-primary">
                        <Link href={`/portal/orders/${order.id}`}>
                          {order.orderNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{format(new Date(order.orderedAt), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={order.locationNickname || ''}>
                        {order.locationNickname || '—'}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{order.poNumber}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(order.totalCents)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${getStatusColor(order.status)} capitalize`}>
                          {order.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link href={`/portal/orders/${order.id}`} className="inline-flex items-center justify-center p-2 text-gray-400 group-hover:text-accent transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
