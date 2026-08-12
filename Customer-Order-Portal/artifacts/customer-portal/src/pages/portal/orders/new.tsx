import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  useGetCrmLocations, 
  useListProducts, 
  useCreateOrder,
  useGetCrmBillingProfiles,
} from '@workspace/api-client-react';
import type { HsLocation, Product } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { ChevronRight, ArrowLeft, Package, MapPin, CreditCard, CheckCircle2, ShieldCheck, AlertCircle, ShoppingCart, Link } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function PortalOrderNew() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: locations, isLoading: loadingLocations } = useGetCrmLocations();
  const { data: products, isLoading: loadingProducts } = useListProducts();
  const { data: billingProfiles } = useGetCrmBillingProfiles();
  const createOrder = useCreateOrder();

  const [step, setStep] = useState(1);
  
  // Form State
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [poNumber, setPoNumber] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [cart, setCart] = useState<Record<number, number>>({}); // productId -> quantity
  const [searchQuery, setSearchQuery] = useState('');
  
  // Payment mock state
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  const selectedLocation = useMemo(() => 
    locations?.find(l => l.id === selectedLocationId),
  [locations, selectedLocationId]);

  const selectedBilling = useMemo(() => {
    if (!selectedLocation) return null;
    return billingProfiles?.find(b => b.id === selectedLocation.billingProfileId) || selectedLocation.billingProfile;
  }, [selectedLocation, billingProfiles]);

  const isNetTerms = selectedBilling?.paymentTerms === 'net_terms';

  const productsByLine = useMemo(() => {
    if (!products) return {};
    return products.reduce((acc, product) => {
      if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase()) && !product.sku.toLowerCase().includes(searchQuery.toLowerCase())) {
        return acc;
      }
      if (!acc[product.productLine]) acc[product.productLine] = [];
      acc[product.productLine].push(product);
      return acc;
    }, {} as Record<string, Product[]>);
  }, [products, searchQuery]);

  const cartTotal = useMemo(() => {
    let subtotal = 0;
    Object.entries(cart).forEach(([id, qty]) => {
      const product = products?.find(p => p.id === Number(id));
      if (product) {
        subtotal += product.unitPriceCents * qty;
      }
    });
    const shipping = subtotal >= 50000 ? 0 : 1500;
    return { subtotal, shipping, total: subtotal + shipping, items: Object.values(cart).reduce((a, b) => a + b, 0) };
  }, [cart, products]);

  // Auto-select if only 1 location
  useEffect(() => {
    if (locations?.length === 1 && !selectedLocationId) {
      setSelectedLocationId(locations[0].id);
    }
  }, [locations, selectedLocationId]);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
  };

  const nextStep = () => {
    if (step === 1 && !selectedLocationId) return;
    if (step === 2 && !poNumber) return;
    if (step === 3 && cartTotal.items === 0) return;
    setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => Math.max(1, s - 1));

  const updateCart = (productId: number, qty: number) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (qty <= 0) {
        delete newCart[productId];
      } else {
        newCart[productId] = qty;
      }
      return newCart;
    });
  };

  const handleSubmit = async () => {
    if (!selectedLocationId || !selectedBilling || !poNumber || cartTotal.items === 0) return;
    
    try {
      const items = Object.entries(cart).map(([productId, quantity]) => ({
        productId: Number(productId),
        quantity
      }));

      const res = await createOrder.mutateAsync({
        data: {
          hubspotLocationId: selectedLocationId,
          billingProfileId: selectedBilling.id,
          poNumber,
          orderNotes: orderNotes || undefined,
          items,
          mockCardName: !isNetTerms ? cardName : undefined,
          mockCardNumber: !isNetTerms ? cardNumber : undefined,
          mockCardExpiry: !isNetTerms ? cardExpiry : undefined,
          mockCardCvc: !isNetTerms ? cardCvc : undefined,
        }
      });
      
      setLocation(`/portal/orders/${res.orderId}?placed=1`);
    } catch (err: any) {
      toast({
        title: 'Order failed',
        description: err.error || 'Failed to submit order',
        variant: 'destructive',
      });
    }
  };

  const canManage = user?.roleKey === 'org_admin' || user?.roleKey === 'regional_admin';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10 rounded-full"></div>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10 rounded-full transition-all duration-300" 
            style={{ width: `${((step - 1) / (isNetTerms ? 3 : 4)) * 100}%` }}
          ></div>
          
          {['Location', 'Billing & PO', 'Products', 'Review', ...(isNetTerms ? [] : ['Payment'])].map((label, i) => {
            const stepNum = i + 1;
            const isActive = step === stepNum;
            const isCompleted = step > stepNum;
            return (
              <div key={label} className="flex flex-col items-center gap-2 bg-gray-50 px-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors border-2 ${
                  isActive ? 'bg-primary text-white border-primary' : 
                  isCompleted ? 'bg-white text-primary border-primary' : 'bg-white text-gray-400 border-gray-300'
                }`}>
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : stepNum}
                </div>
                <span className={`text-xs font-medium ${isActive || isCompleted ? 'text-primary' : 'text-gray-500'}`}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <Card className="border-gray-200 shadow-sm min-h-[500px] flex flex-col">
        <CardHeader className="bg-gray-50/80 border-b flex flex-row items-center justify-between py-4">
          <CardTitle className="text-xl">
            {step === 1 && 'Step 1: Select Shipping Location'}
            {step === 2 && 'Step 2: Billing & PO Details'}
            {step === 3 && 'Step 3: Select Products'}
            {step === 4 && 'Step 4: Review Order'}
            {step === 5 && 'Step 5: Payment Information'}
          </CardTitle>
          {step > 1 && (
            <Button variant="ghost" size="sm" onClick={prevStep} className="text-gray-500 hover:text-primary">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          )}
        </CardHeader>
        
        <CardContent className="flex-1 p-6">
          {/* STEP 1: Location */}
          {step === 1 && (
            <div className="space-y-4">
              {loadingLocations ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
                </div>
              ) : locations?.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No locations available</h3>
                  <p className="text-gray-500 mb-6">You don't have access to any locations.</p>
                  <Button asChild>
                    <Link href={canManage ? '/portal/manage/locations' : '/contact'}>
                      {canManage ? 'Add a location' : 'Request location access'}
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {locations?.map(loc => (
                    <div 
                      key={loc.id} 
                      onClick={() => setSelectedLocationId(loc.id)}
                      className={`border rounded-xl p-4 cursor-pointer transition-all ${
                        selectedLocationId === loc.id 
                          ? 'border-primary ring-2 ring-primary/20 bg-primary/5' 
                          : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-lg text-primary">{loc.nickname}</h4>
                        <div className="flex gap-1">
                          {loc.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
                          {loc.validated && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">Verified</Badge>}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>{loc.address1}</div>
                        {loc.address2 && <div>{loc.address2}</div>}
                        <div>{loc.city}, {loc.state} {loc.zip}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Billing & PO */}
          {step === 2 && selectedLocation && (
            <div className="max-w-2xl mx-auto space-y-8">
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-accent" />
                  Billing Profile
                </h3>
                {selectedBilling ? (
                  <div className="bg-gray-50 border rounded-xl p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div className="font-semibold text-gray-900">{selectedBilling.name}</div>
                      <Badge variant={isNetTerms ? 'default' : 'outline'} className={isNetTerms ? 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200' : ''}>
                        {isNetTerms ? `Net ${selectedBilling.netDays || 30}` : 'Credit Card'}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 grid sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Billing Address</span>
                        {selectedBilling.address1}<br/>
                        {selectedBilling.city}, {selectedBilling.state} {selectedBilling.zip}
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Accounts Payable</span>
                        {selectedBilling.apEmail}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 text-red-800 p-4 rounded-xl flex gap-3 border border-red-200">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <div>
                      <div className="font-medium">No billing profile found</div>
                      <p className="text-sm mt-1">This location is not linked to a valid billing profile. Please contact support or your org admin.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Order Details</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PO Number <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    value={poNumber} 
                    onChange={e => setPoNumber(e.target.value.substring(0, 40))} 
                    placeholder="Enter PO number (max 40 chars)"
                    className="max-w-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Notes <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <Textarea 
                    value={orderNotes} 
                    onChange={e => setOrderNotes(e.target.value.substring(0, 500))} 
                    placeholder="Any special instructions for this order?"
                    rows={4}
                  />
                  <div className="text-xs text-gray-400 mt-1 text-right">{orderNotes.length}/500</div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Products */}
          {step === 3 && (
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1 space-y-6">
                <Input 
                  placeholder="Search products by name or SKU..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="mb-6"
                />
                
                {loadingProducts ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : (
                  <Accordion type="multiple" defaultValue={Object.keys(productsByLine)} className="space-y-4">
                    {Object.entries(productsByLine).map(([line, lineProducts]) => (
                      <AccordionItem key={line} value={line} className="border rounded-xl px-4 bg-white shadow-sm overflow-hidden">
                        <AccordionTrigger className="hover:no-underline py-4">
                          <div className="flex items-center gap-2">
                            <Package className="w-5 h-5 text-accent" />
                            <span className="font-semibold text-lg">{line}</span>
                            <Badge variant="secondary" className="ml-2 bg-gray-100 text-gray-600">{lineProducts.length}</Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4">
                          <div className="space-y-4 divide-y">
                            {lineProducts.map(product => (
                              <div key={product.id} className="pt-4 first:pt-0 flex items-center gap-4">
                                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0 border">
                                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-primary text-base truncate">{product.name}</div>
                                  <div className="text-xs text-gray-500 font-mono mt-1">SKU: {product.sku}</div>
                                  <div className="font-bold mt-1 text-sm">{formatCurrency(product.unitPriceCents)}</div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-full"
                                    onClick={() => updateCart(product.id, (cart[product.id] || 0) - 1)}
                                    disabled={!cart[product.id]}
                                  >
                                    -
                                  </Button>
                                  <span className="w-6 text-center font-medium">{cart[product.id] || 0}</span>
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-full"
                                    onClick={() => updateCart(product.id, (cart[product.id] || 0) + 1)}
                                  >
                                    +
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </div>
              
              <div className="lg:w-80 shrink-0">
                <div className="sticky top-24 bg-gray-50 rounded-xl p-5 border shadow-sm">
                  <h3 className="font-semibold text-lg border-b pb-3 mb-4 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Order Summary
                  </h3>
                  
                  {cartTotal.items === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      Your cart is empty. Add products to continue.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="max-h-60 overflow-y-auto space-y-3 pr-2 text-sm">
                        {Object.entries(cart).map(([id, qty]) => {
                          const product = products?.find(p => p.id === Number(id));
                          if (!product || qty === 0) return null;
                          return (
                            <div key={id} className="flex justify-between gap-2">
                              <div className="flex-1 truncate">
                                <span className="text-gray-500 mr-2">{qty}x</span>
                                <span className="font-medium" title={product.name}>{product.name}</span>
                              </div>
                              <div className="shrink-0 text-right">{formatCurrency(product.unitPriceCents * qty)}</div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="border-t pt-3 space-y-2 text-sm">
                        <div className="flex justify-between text-gray-600">
                          <span>Subtotal ({cartTotal.items} items)</span>
                          <span>{formatCurrency(cartTotal.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>Shipping</span>
                          <span>{cartTotal.shipping === 0 ? 'Free (over $500)' : formatCurrency(cartTotal.shipping)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-primary pt-2 border-t mt-2">
                          <span>Total</span>
                          <span>{formatCurrency(cartTotal.total)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Review */}
          {step === 4 && (
            <div className="space-y-8 max-w-4xl mx-auto">
              <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                  <h3 className="font-semibold text-lg">Order Summary</h3>
                </div>
                <div className="p-6 grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-semibold">Ship To</div>
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{selectedLocation?.nickname}</div>
                        <div>{selectedLocation?.address1}</div>
                        <div>{selectedLocation?.city}, {selectedLocation?.state} {selectedLocation?.zip}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-semibold">Bill To</div>
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{selectedBilling?.name}</div>
                        <div>{selectedBilling?.address1}</div>
                        <div>{selectedBilling?.city}, {selectedBilling?.state} {selectedBilling?.zip}</div>
                        <div className="mt-1">
                          <Badge variant="outline" className="bg-gray-50 text-xs mt-1">
                            {isNetTerms ? `Net ${selectedBilling?.netDays || 30}` : 'Credit Card'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-semibold">PO Number</div>
                      <div className="font-mono bg-gray-100 inline-block px-2 py-1 rounded text-sm">{poNumber}</div>
                    </div>
                    {orderNotes && (
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-semibold">Notes</div>
                        <div className="text-sm bg-yellow-50/50 p-3 rounded border border-yellow-100 italic">{orderNotes}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                <div className="bg-gray-50 p-4 border-b">
                  <h3 className="font-semibold text-lg">Items</h3>
                </div>
                <div className="p-0">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50/50 text-gray-500 border-b">
                      <tr>
                        <th className="py-3 px-4 text-left font-medium">Item</th>
                        <th className="py-3 px-4 text-right font-medium w-24">Price</th>
                        <th className="py-3 px-4 text-center font-medium w-20">Qty</th>
                        <th className="py-3 px-4 text-right font-medium w-28">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {Object.entries(cart).map(([id, qty]) => {
                        const product = products?.find(p => p.id === Number(id));
                        if (!product || qty === 0) return null;
                        return (
                          <tr key={id}>
                            <td className="py-3 px-4">
                              <div className="font-medium text-primary">{product.name}</div>
                              <div className="text-xs text-gray-500 font-mono mt-0.5">{product.sku}</div>
                            </td>
                            <td className="py-3 px-4 text-right text-gray-600">{formatCurrency(product.unitPriceCents)}</td>
                            <td className="py-3 px-4 text-center font-medium">{qty}</td>
                            <td className="py-3 px-4 text-right font-bold">{formatCurrency(product.unitPriceCents * qty)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="bg-gray-50 p-4 border-t space-y-2">
                    <div className="flex justify-end gap-8 text-sm text-gray-600">
                      <span>Subtotal</span>
                      <span className="w-24 text-right">{formatCurrency(cartTotal.subtotal)}</span>
                    </div>
                    <div className="flex justify-end gap-8 text-sm text-gray-600">
                      <span>Shipping</span>
                      <span className="w-24 text-right">{cartTotal.shipping === 0 ? 'Free' : formatCurrency(cartTotal.shipping)}</span>
                    </div>
                    <div className="flex justify-end gap-8 text-lg font-bold text-primary pt-2 border-t mt-2">
                      <span>Total</span>
                      <span className="w-24 text-right">{formatCurrency(cartTotal.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Payment (Card only) */}
          {step === 5 && !isNetTerms && (
            <div className="max-w-md mx-auto space-y-6">
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 mt-0.5 text-amber-600 shrink-0" />
                <div>
                  <h4 className="font-semibold">Demo Environment</h4>
                  <p className="text-sm mt-1 text-amber-700">No real charges will be made. Enter any mock data to complete the flow.</p>
                </div>
              </div>
              
              <div className="space-y-4 bg-white p-6 border rounded-xl shadow-sm">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name on Card</label>
                  <Input value={cardName} onChange={e => setCardName(e.target.value)} placeholder="Jane Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                  <Input value={cardNumber} onChange={e => setCardNumber(e.target.value)} placeholder="4242 4242 4242 4242" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
                    <Input value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} placeholder="MM/YY" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
                    <Input value={cardCvc} onChange={e => setCardCvc(e.target.value)} placeholder="123" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="bg-gray-50/80 border-t p-6 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {step === 1 && 'Select a location to continue.'}
            {step === 2 && 'PO Number is required.'}
            {step === 3 && `Cart Total: ${formatCurrency(cartTotal.total)}`}
          </div>
          
          <div className="flex gap-3">
            {step < (isNetTerms ? 4 : 5) ? (
              <Button 
                onClick={nextStep} 
                disabled={
                  (step === 1 && !selectedLocationId) || 
                  (step === 2 && !poNumber) || 
                  (step === 3 && cartTotal.items === 0)
                }
              >
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                size="lg"
                className="bg-accent hover:bg-accent/90 px-8"
                disabled={createOrder.isPending || (!isNetTerms && (!cardName || !cardNumber))}
              >
                {createOrder.isPending ? 'Processing...' : isNetTerms ? `Submit Order — Net ${selectedBilling?.netDays || 30}` : 'Pay & Submit Order'}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
