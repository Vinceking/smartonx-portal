import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useListAdminOrders } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Download, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Link } from 'wouter';

export default function AdminOrders() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Real implementation would debounce query for orgId, etc.
  const { data, isLoading } = useListAdminOrders({ 
    status: statusFilter === 'all' ? undefined : statusFilter 
  }, { query: { placeholderData: keepPreviousData } });

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

  const handleExportCSV = () => {
    // In a real app, this would trigger an API call to download a CSV.
    // We will just alert for now.
    alert('Exporting CSV with current filters...');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">All Orders</h1>
          <p className="text-gray-500 mt-1">Global view of all customer orders.</p>
        </div>
        <Button onClick={handleExportCSV} variant="outline" className="bg-white">
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>

      <Card className="border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex flex-1 gap-4 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Search orders..." className="pl-9 bg-white" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-white">
                <SelectValue placeholder="Status" />
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

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1,2,3,4,5].map(i => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : data?.orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16 text-gray-500">
                    <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    No orders match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                data?.orders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="font-bold text-primary">{order.orderNumber}</div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">PO: {order.poNumber}</div>
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/organizations/${order.hubspotCompanyId}`} className="font-medium text-accent hover:underline">
                        {order.orgName || 'Unknown Org'}
                      </Link>
                      <div className="text-xs text-gray-500 mt-0.5 max-w-[200px] truncate" title={order.locationNickname || ''}>
                        {order.locationNickname}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(order.orderedAt), 'MMM d, yyyy h:mm a')}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(order.totalCents)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={order.paymentStatus === 'paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}>
                        {order.paymentStatus === 'paid' ? 'Paid' : 'Terms'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${getStatusColor(order.status)} capitalize`}>
                        {order.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
