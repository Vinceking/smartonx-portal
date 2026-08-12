import { useState } from 'react';
import { 
  useListAdminLocationRequests,
  useAdminApproveLocationRequest,
  useAdminRejectLocationRequest,
  useGetCrmBillingProfiles
} from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Check, X, Clock, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const approveSchema = z.object({
  billingProfileId: z.string().min(1, 'Billing profile is required'),
  isDefault: z.boolean().default(false),
});

const rejectSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required'),
});

export default function AdminLocationRequests() {
  const [filter, setFilter] = useState('pending');
  const { data: requests, isLoading, refetch } = useListAdminLocationRequests({ status: filter });
  const approveMutation = useAdminApproveLocationRequest();
  const rejectMutation = useAdminRejectLocationRequest();
  const { toast } = useToast();

  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  // We fetch billing profiles when a request is selected to approve
  const { data: billingProfiles } = useGetCrmBillingProfiles();

  const approveForm = useForm<z.infer<typeof approveSchema>>({
    resolver: zodResolver(approveSchema),
    defaultValues: { billingProfileId: '', isDefault: false }
  });

  const rejectForm = useForm<z.infer<typeof rejectSchema>>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { reason: '' }
  });

  const handleApproveClick = (req: any) => {
    setSelectedReq(req);
    setIsApproveOpen(true);
  };

  const handleRejectClick = (req: any) => {
    setSelectedReq(req);
    setIsRejectOpen(true);
  };

  const onApprove = async (values: z.infer<typeof approveSchema>) => {
    if (!selectedReq) return;
    try {
      await approveMutation.mutateAsync({ id: selectedReq.id, data: values });
      toast({ title: 'Request approved', description: 'Location created in HubSpot.' });
      setIsApproveOpen(false);
      refetch();
    } catch (err: any) {
      toast({ title: 'Approval failed', description: err.error, variant: 'destructive' });
    }
  };

  const onReject = async (values: z.infer<typeof rejectSchema>) => {
    if (!selectedReq) return;
    try {
      await rejectMutation.mutateAsync({ id: selectedReq.id, data: values });
      toast({ title: 'Request rejected' });
      setIsRejectOpen(false);
      refetch();
    } catch (err: any) {
      toast({ title: 'Rejection failed', description: err.error, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Location Requests</h1>
          <p className="text-gray-500 mt-1">Review and approve new locations submitted by portal users.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button 
            onClick={() => setFilter('pending')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'pending' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Pending
          </button>
          <button 
            onClick={() => setFilter('resolved')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'resolved' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Resolved
          </button>
        </div>
      </div>

      <Card className="border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Requested Location</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1,2,3].map(i => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : requests?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16 text-gray-500">
                    <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    No {filter} location requests.
                  </TableCell>
                </TableRow>
              ) : (
                requests?.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-semibold text-primary">{r.orgName || 'Unknown Org'}</TableCell>
                    <TableCell>
                      <div className="font-medium">{r.nickname}</div>
                      <div className="text-sm text-gray-600">
                        {r.address1} {r.address2}
                        <br/>
                        {r.city}, {r.state} {r.zip}
                      </div>
                      {r.validated && <Badge variant="outline" className="mt-1 text-[10px] bg-green-50 text-green-700 border-green-200">Address Verified</Badge>}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="font-medium text-gray-900">{r.requestedByUsername}</div>
                      <div className="text-xs text-gray-500">User ID: {r.requestedByUserId}</div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {format(new Date(r.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      {filter === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200" onClick={() => handleApproveClick(r)}>
                            <Check className="w-4 h-4 mr-1" /> Approve
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={() => handleRejectClick(r)}>
                            <X className="w-4 h-4 mr-1" /> Reject
                          </Button>
                        </div>
                      ) : (
                        <Badge variant="outline" className={r.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}>
                          {r.status.toUpperCase()}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Location</DialogTitle>
          </DialogHeader>
          <div className="bg-gray-50 p-4 rounded-lg text-sm mb-4">
            <div className="font-semibold mb-1">{selectedReq?.nickname}</div>
            <div className="text-gray-600">{selectedReq?.address1}, {selectedReq?.city}, {selectedReq?.state} {selectedReq?.zip}</div>
          </div>
          <Form {...approveForm}>
            <form onSubmit={approveForm.handleSubmit(onApprove)} className="space-y-6">
              <FormField
                control={approveForm.control}
                name="billingProfileId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link Billing Profile</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select billing profile" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {billingProfiles?.map((bp: any) => (
                          <SelectItem key={bp.id} value={bp.id}>{bp.name} ({bp.city}, {bp.state})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={approveForm.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Make Default</FormLabel>
                      <p className="text-sm text-gray-500">Set this as the default location for the org.</p>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsApproveOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white" disabled={approveMutation.isPending}>
                  {approveMutation.isPending ? 'Approving...' : 'Approve & Create'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Location</DialogTitle>
          </DialogHeader>
          <Form {...rejectForm}>
            <form onSubmit={rejectForm.handleSubmit(onReject)} className="space-y-6">
              <FormField
                control={rejectForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Rejection</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Explain why this location was rejected..." rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsRejectOpen(false)}>Cancel</Button>
                <Button type="submit" variant="destructive" disabled={rejectMutation.isPending}>
                  {rejectMutation.isPending ? 'Rejecting...' : 'Reject Request'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
