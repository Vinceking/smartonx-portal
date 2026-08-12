import { useState } from 'react';
import { 
  useListManageLocations,
  useListManageLocationRequests,
  useCreateLocationRequest,
  useGetCrmBillingProfiles
} from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Building2, Plus, MapPin, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const createLocationReqSchema = z.object({
  nickname: z.string().min(1, 'Nickname is required'),
  address1: z.string().min(1, 'Address is required'),
  address2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'State must be a 2-letter code').toUpperCase(),
  zip: z.string().min(5, 'ZIP code is required'),
  phone: z.string().optional(),
});

export default function ManageLocations() {
  const { data: locations, isLoading: loadingLocs } = useListManageLocations();
  const { data: requests, isLoading: loadingReqs, refetch: refetchReqs } = useListManageLocationRequests();
  const createReqMutation = useCreateLocationRequest();
  
  const { toast } = useToast();
  const [isReqOpen, setIsReqOpen] = useState(false);

  const form = useForm<z.infer<typeof createLocationReqSchema>>({
    resolver: zodResolver(createLocationReqSchema),
    defaultValues: { nickname: '', address1: '', address2: '', city: '', state: '', zip: '', phone: '' }
  });

  const onSubmit = async (values: z.infer<typeof createLocationReqSchema>) => {
    try {
      await createReqMutation.mutateAsync({ data: values });
      toast({ title: 'Location request submitted', description: 'Smart On X staff will review it shortly.' });
      setIsReqOpen(false);
      form.reset();
      refetchReqs();
    } catch (err: any) {
      form.setError('root', { message: err.error || 'Failed to submit request' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Manage Locations</h1>
          <p className="text-gray-500 mt-1">View approved locations and track pending requests.</p>
        </div>
        
        <Dialog open={isReqOpen} onOpenChange={setIsReqOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" /> Request Location
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Request New Location</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {form.formState.errors.root && (
                  <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                    {form.formState.errors.root.message}
                  </div>
                )}
                
                <FormField
                  control={form.control}
                  name="nickname"
                  render={({ field }) => (
                    <FormItem><FormLabel>Location Nickname</FormLabel><FormControl><Input placeholder="e.g. Downtown Clinic" {...field} /></FormControl><FormMessage/></FormItem>
                  )}
                />
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-4 md:col-span-2">
                    <FormField
                      control={form.control}
                      name="address1"
                      render={({ field }) => (
                        <FormItem><FormLabel>Address Line 1</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address2"
                      render={({ field }) => (
                        <FormItem><FormLabel>Address Line 2</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem><FormLabel>State (2-letter)</FormLabel><FormControl><Input placeholder="NY" maxLength={2} {...field} /></FormControl><FormMessage/></FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="zip"
                      render={({ field }) => (
                        <FormItem><FormLabel>ZIP Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsReqOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createReqMutation.isPending}>{createReqMutation.isPending ? 'Submitting...' : 'Submit Request'}</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="bg-gray-100/50 p-1">
          <TabsTrigger value="active" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
            Active Locations
          </TabsTrigger>
          <TabsTrigger value="requests" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
            Pending Requests
            {requests && requests.filter(r => r.status === 'pending').length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-800">{requests.filter(r => r.status === 'pending').length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          <Card className="border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    <TableHead>Location</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Billing Profile</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingLocs ? (
                    [1,2,3].map(i => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      </TableRow>
                    ))
                  ) : locations?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-gray-500">
                        <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        No active locations found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    locations?.map(l => (
                      <TableRow key={l.id}>
                        <TableCell>
                          <div className="font-semibold text-primary flex items-center gap-2">
                            {l.nickname}
                            {l.isDefault && <Badge variant="secondary" className="text-[10px]">Default</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          <div>{l.address1} {l.address2}</div>
                          <div>{l.city}, {l.state} {l.zip}</div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-700">
                          {l.billingProfile?.name || '—'}
                        </TableCell>
                        <TableCell>
                          {l.validated ? (
                            <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                              <CheckCircle className="w-3.5 h-3.5" /> Verified
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">Unverified</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          <Card className="border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    <TableHead>Location</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingReqs ? (
                    [1,2].map(i => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      </TableRow>
                    ))
                  ) : requests?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                        <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        No location requests found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    requests?.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium text-gray-900">{r.nickname}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          <div>{r.address1} {r.address2}</div>
                          <div>{r.city}, {r.state} {r.zip}</div>
                        </TableCell>
                        <TableCell className="text-sm">{r.requestedByUsername}</TableCell>
                        <TableCell className="text-sm text-gray-500">{format(new Date(r.createdAt), 'MMM d, yyyy')}</TableCell>
                        <TableCell>
                          {r.status === 'pending' && <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Pending</Badge>}
                          {r.status === 'approved' && <Badge className="bg-green-100 text-green-800 hover:bg-green-100 font-normal">Approved</Badge>}
                          {r.status === 'rejected' && <Badge variant="destructive" className="font-normal flex items-center gap-1 w-fit"><XCircle className="w-3 h-3" /> Rejected</Badge>}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
