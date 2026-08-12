import { useState } from 'react';
import { 
  useListManageBilling,
  useCreateManageBilling,
  useUpdateManageBilling,
} from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Plus, MapPin, Building, Lock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const billingSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address1: z.string().min(1, 'Address is required'),
  address2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'State must be a 2-letter code').toUpperCase(),
  zip: z.string().min(5, 'ZIP code is required'),
  apEmail: z.string().email('Invalid email'),
  apPhone: z.string().optional(),
  paymentTerms: z.enum(['credit_card', 'net_terms']),
});

export default function ManageBilling() {
  const { data: pageData, isLoading, refetch } = useListManageBilling();
  const createMutation = useCreateManageBilling();
  
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<z.infer<typeof billingSchema>>({
    resolver: zodResolver(billingSchema),
    defaultValues: { name: '', address1: '', address2: '', city: '', state: '', zip: '', apEmail: '', apPhone: '', paymentTerms: 'credit_card' }
  });

  const onSubmit = async (values: z.infer<typeof billingSchema>) => {
    try {
      await createMutation.mutateAsync({ data: values });
      toast({ title: 'Billing profile created successfully' });
      setIsOpen(false);
      form.reset();
      refetch();
    } catch (err: any) {
      form.setError('root', { message: err.error || 'Failed to create billing profile' });
    }
  };

  const allowEdit = pageData?.allowAdminBillingEdit ?? false;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Billing Profiles</h1>
          <p className="text-gray-500 mt-1">Manage payment methods and billing addresses.</p>
        </div>
        
        {allowEdit ? (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" /> Add Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Add Billing Profile</DialogTitle>
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
                    name="name"
                    render={({ field }) => (
                      <FormItem><FormLabel>Profile Name</FormLabel><FormControl><Input placeholder="e.g. Primary Billing" {...field} /></FormControl><FormMessage/></FormItem>
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
                          <FormItem><FormLabel>State</FormLabel><FormControl><Input placeholder="NY" maxLength={2} {...field} /></FormControl><FormMessage/></FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="zip"
                        render={({ field }) => (
                          <FormItem><FormLabel>ZIP</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 border-t pt-4 mt-4">
                    <FormField
                      control={form.control}
                      name="apEmail"
                      render={({ field }) => (
                        <FormItem><FormLabel>A/P Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage/></FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="apPhone"
                      render={({ field }) => (
                        <FormItem><FormLabel>A/P Phone (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? 'Saving...' : 'Save Profile'}</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        ) : (
          <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 px-4 py-2 rounded-lg">
            <Lock className="w-4 h-4" />
            Billing profile creation disabled by Smart On X.
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [1, 2, 3].map(i => <Skeleton key={i} className="h-56 rounded-xl" />)
        ) : pageData?.profiles.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3 text-center py-16 text-gray-500 border-2 border-dashed rounded-xl">
            <CreditCard className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No billing profiles</h3>
            <p className="mt-1 text-sm">Create a billing profile to start placing orders.</p>
          </div>
        ) : (
          pageData?.profiles.map(profile => (
            <Card key={profile.id} className="border-gray-200 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent"></div>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl leading-tight">{profile.name}</CardTitle>
                  {profile.isDefault && <Badge variant="secondary" className="bg-primary/10 text-primary">Default</Badge>}
                </div>
                <div className="mt-2">
                  <Badge variant="outline" className={profile.paymentTerms === 'net_terms' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-700 border-gray-200'}>
                    {profile.paymentTerms === 'net_terms' ? `Net ${profile.netDays || 30} Terms` : 'Credit Card'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600">
                  <div className="flex gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    <div>
                      <div>{profile.address1}</div>
                      {profile.address2 && <div>{profile.address2}</div>}
                      <div>{profile.city}, {profile.state} {profile.zip}</div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">A/P Contact</div>
                    <div className="text-sm text-gray-700 truncate">{profile.apEmail}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">Locations</div>
                    <div className="text-sm text-gray-700">{profile.usedByLocationCount || 0} linked</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
