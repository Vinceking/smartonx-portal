import { useState } from 'react';
import { 
  useListManageContacts,
  useCreateManageContact,
  useUpdateManageContact,
  useAddContactEmail
} from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
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
import { Contact as ContactIcon, Plus, Mail, Check, X, Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const createContactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  roleTitle: z.string().min(1, 'Role title is required'),
  email: z.string().email('Invalid email address'),
});

export default function ManageContacts() {
  const { data: contacts, isLoading, refetch } = useListManageContacts();
  const createMutation = useCreateManageContact();
  const updateMutation = useUpdateManageContact();
  
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const form = useForm<z.infer<typeof createContactSchema>>({
    resolver: zodResolver(createContactSchema),
    defaultValues: { firstName: '', lastName: '', roleTitle: '', email: '' }
  });

  const onSubmit = async (values: z.infer<typeof createContactSchema>) => {
    try {
      await createMutation.mutateAsync({ data: values });
      toast({ title: 'Contact created in CRM successfully' });
      setIsCreateOpen(false);
      form.reset();
      refetch();
    } catch (err: any) {
      form.setError('root', { message: err.error || 'Failed to create contact' });
    }
  };

  const handleToggleActive = async (contactId: string, currentActive: boolean) => {
    try {
      await updateMutation.mutateAsync({ id: contactId, data: { isActive: !currentActive } });
      refetch();
    } catch (err: any) {
      toast({ title: 'Failed to update contact', description: err.error, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Contacts</h1>
          <p className="text-gray-500 mt-1">Manage CRM contacts for your organization.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" /> Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add CRM Contact</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {form.formState.errors.root && (
                  <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                    {form.formState.errors.root.message}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="roleTitle"
                  render={({ field }) => (
                    <FormItem><FormLabel>Job Title</FormLabel><FormControl><Input placeholder="e.g. Practice Manager" {...field} /></FormControl><FormMessage/></FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem><FormLabel>Primary Email</FormLabel><FormControl><Input type="email" placeholder="email@example.com" {...field} /></FormControl><FormMessage/></FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? 'Saving...' : 'Save Contact'}</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Emails</TableHead>
                <TableHead>Portal Access</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1,2,3].map(i => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : contacts?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                    <ContactIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    No contacts found.
                  </TableCell>
                </TableRow>
              ) : (
                contacts?.map(c => (
                  <TableRow key={c.id} className={!c.isActive ? 'opacity-50 bg-gray-50' : ''}>
                    <TableCell className="font-medium text-gray-900">
                      {c.firstName} {c.lastName}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {c.roleTitle}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {c.emails?.map((e, idx) => (
                          <div key={idx} className="text-sm flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span>{e.email}</span>
                            {e.isPrimary && <Badge variant="outline" className="text-[10px] py-0 h-4 leading-none">Primary</Badge>}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {c.hasPortalAccount ? (
                        <Badge className="bg-accent/10 text-accent hover:bg-accent/10 font-normal flex items-center w-fit gap-1">
                          <Shield className="w-3 h-3" /> {c.portalUsername}
                        </Badge>
                      ) : (
                        <span className="text-sm text-gray-400">No access</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {c.isActive ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 font-normal">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="font-normal">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleToggleActive(c.id, c.isActive)}
                        title={c.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {c.isActive ? <X className="w-4 h-4 text-red-500" /> : <Check className="w-4 h-4 text-green-500" />}
                      </Button>
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
