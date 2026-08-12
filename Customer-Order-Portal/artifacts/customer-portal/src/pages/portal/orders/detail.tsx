import { useRoute, useSearch, Link } from 'wouter';
import { useGetPortalOrder } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ArrowLeft, Printer, CheckCircle2, Clock, Check, Truck, CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function PortalOrderDetail() {
  const [, params] = useRoute('/portal/orders/:id');
  const search = useSearch();
  const isJustPlaced = search.includes('placed=1');
  
  const orderId = Number(params?.id);
  const { data: order, isLoading } = useGetPortalOrder(orderId, {
    query: { enabled: !isNaN(orderId), queryKey: ['portalOrder', orderId] }
  });

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 mb-8" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid md:grid-cols-3 gap-6">
          <Skeleton className="h-64 md:col-span-2 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!order) return <div className="text-center py-12">Order not found.</div>;

  const billingSnap = order.billingSnapshot as Record<string, string>;
  const shipSnap = order.shipSnapshot as Record<string, string>;

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" asChild className="-ml-4 text-gray-500 hover:text-primary">
          <Link href="/portal/orders">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-2" />
          Print Order
        </Button>
      </div>

      {isJustPlaced && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg flex items-start gap-3 shadow-sm print:hidden">
          <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0 text-green-600" />
          <div>
            <h3 className="font-semibold text-green-900">Order submitted successfully!</h3>
            <p className="text-sm mt-1 text-green-700">
              Your order has been placed. Shopify order <strong className="font-mono bg-green-100 px-1 rounded">{order.shopifyOrderNumber || 'pending'}</strong> created 
              and PO logged in HubSpot.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6 print:border-b-2 print:border-black">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight mb-2">Order {order.orderNumber}</h1>
          <div className="text-gray-500 text-sm flex items-center gap-3">
            <span>Placed on {format(new Date(order.orderedAt), 'MMMM d, yyyy ')}</span>
            <span className="text-gray-300">|</span>
            <span>By {order.orderedByUsername || 'Unknown'}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="text-sm capitalize px-3 py-1 bg-primary text-white hover:bg-primary">
            {order.status.replace('_', ' ')}
          </Badge>
          {order.paymentStatus === 'paid' ? (
            <Badge variant="outline" className="text-sm border-green-500 text-green-700 bg-green-50">Paid</Badge>
          ) : order.paymentStatus === 'terms_net' ? (
            <Badge variant="outline" className="text-sm border-blue-300 text-blue-700 bg-blue-50">Net {order.netDaysSnapshot || 30}</Badge>
          ) : (
            <Badge variant="outline" className="text-sm">{order.paymentStatus.replace('_', ' ')}</Badge>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-gray-200 shadow-sm print:shadow-none print:border-black">
            <CardHeader className="bg-gray-50/50 border-b pb-4">
              <CardTitle className="text-lg">Items Ordered</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {order.items.map(item => (
                  <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-semibold text-primary">{item.nameSnapshot}</div>
                      <div className="text-xs text-gray-500 font-mono mt-1">SKU: {item.skuSnapshot}</div>
                    </div>
                    <div className="flex items-center gap-8 sm:w-1/2 sm:justify-end text-sm">
                      <div className="text-gray-500">{formatCurrency(item.unitPriceCents)}</div>
                      <div className="font-medium bg-gray-100 px-3 py-1 rounded w-16 text-center">Qty {item.quantity}</div>
                      <div className="font-bold text-primary w-24 text-right">{formatCurrency(item.lineTotalCents)}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-gray-50/50 p-4 border-t space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotalCents)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>{order.shippingCents === 0 ? 'Free' : formatCurrency(order.shippingCents)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-primary pt-2 border-t mt-2">
                  <span>Total</span>
                  <span>{formatCurrency(order.totalCents)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {(order.orderNotes || order.poNumber) && (
            <Card className="border-gray-200 shadow-sm print:shadow-none print:border-black break-inside-avoid">
              <CardHeader className="bg-gray-50/50 border-b pb-4">
                <CardTitle className="text-lg">Order Details</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-900 block mb-1">PO Number</span>
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">{order.poNumber || '—'}</span>
                </div>
                {order.orderNotes && (
                  <div>
                    <span className="font-semibold text-gray-900 block mb-1">Notes</span>
                    <p className="text-gray-600 whitespace-pre-wrap bg-yellow-50/50 p-3 rounded border border-yellow-100">{order.orderNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-gray-200 shadow-sm print:shadow-none print:border-black">
            <CardHeader className="bg-gray-50/50 border-b pb-4">
              <CardTitle className="text-lg">Shipping Address</CardTitle>
            </CardHeader>
            <CardContent className="p-4 text-sm space-y-1 text-gray-700">
              <div className="font-semibold text-gray-900">{shipSnap?.nickname || order.locationNickname}</div>
              <div>{shipSnap?.address1}</div>
              {shipSnap?.address2 && <div>{shipSnap?.address2}</div>}
              <div>{shipSnap?.city}, {shipSnap?.state} {shipSnap?.zip}</div>
              {shipSnap?.phone && <div className="mt-2 text-gray-500">{shipSnap?.phone}</div>}
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm print:shadow-none print:border-black">
            <CardHeader className="bg-gray-50/50 border-b pb-4">
              <CardTitle className="text-lg">Billing Info</CardTitle>
            </CardHeader>
            <CardContent className="p-4 text-sm space-y-1 text-gray-700">
              <div className="font-semibold text-gray-900">{billingSnap?.name}</div>
              <div>{billingSnap?.address1}</div>
              {billingSnap?.address2 && <div>{billingSnap?.address2}</div>}
              <div>{billingSnap?.city}, {billingSnap?.state} {billingSnap?.zip}</div>
              <div className="mt-3 pt-3 border-t">
                <span className="font-semibold block mb-1">AP Email</span>
                <span className="text-accent">{billingSnap?.apEmail || '—'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Integration Status Panel */}
          <Card className="border-gray-200 shadow-sm bg-gray-50 print:hidden">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">System Sync Status</CardTitle>
            </CardHeader>
            <CardContent className="p-4 text-sm space-y-3 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Shopify Order:</span>
                {order.shopifyOrderNumber ? (
                  <span className="flex items-center gap-1 text-green-700 bg-green-100 px-2 py-0.5 rounded text-xs"><Check className="w-3 h-3" /> {order.shopifyOrderNumber}</span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-xs"><Clock className="w-3 h-3" /> pending</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">HubSpot PO:</span>
                {order.hubspotPoId ? (
                  <span className="flex items-center gap-1 text-green-700 bg-green-100 px-2 py-0.5 rounded text-xs"><Check className="w-3 h-3" /> {order.hubspotPoId}</span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-xs"><Clock className="w-3 h-3" /> pending</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Hidden print styles */}
      <style>{`
        @media print {
          body { background: white; }
          main { padding: 0 !important; margin: 0 !important; }
        }
      `}</style>
    </div>
  );
}
