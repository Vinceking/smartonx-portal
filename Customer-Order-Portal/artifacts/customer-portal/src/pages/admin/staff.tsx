import { useState } from 'react';
import { 
  useListAdminStaff,
  useCreateAdminStaff,
  useUpdateAdminStaff,
  useResetAdminStaffPassword
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
import { Shield, Plus, Key, X, Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const staffSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(10, 'Password must be at least 10 chars'),
});

export default function AdminStaff() {
  const { data: staff, isLoading, refetch } = useListAdminStaff();
  const createMutation = useCreateAdminStaff();
  const updateMutation = useUpdateAdminStaff();
  const resetPassMutation = useResetAdminStaffPassword();
  
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const form = useForm<z.infer<typeof staffSchema>>({
    resolver: zodResolver(staffSchema),
    defaultValues: { name: '', email: '', password: '' }
  });

  const onSubmit = async (values: z.infer<typeof staffSchema>) => {
    try {
      await createMutation.mutateAsync({ data: values });
      toast({ title: 'Staff member created successfully' });
      setIsOpen(false);
      form.reset();
      refetch();
    } catch (err: any) {
      form.setError('root', { message: err.error || 'Failed to create staff' });
    }
  };

  const handleResetPassword = async (id: number) => {
    if (!confirm('Reset password for this staff member?')) return;
    try {
      const res = await resetPassMutation.mutateAsync({ id });
      setTempPassword(res.tempPassword);
      toast({ title: 'Password reset successful' });
    } catch (err: any) {
      toast({ title: 'Failed to reset', description: err.error, variant: 'destructive' });
    }
  };

  const handleToggleActive = async (id: number, currentActive: boolean) => {
    try {
      await updateMutation.mutateAsync({ id, data: { isActive: !currentActive } });
      refetch();
    } catch (err: any) {
      toast({ title: 'Failed to update', description: err.error, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Staff Directory</h1>
          <p className="text-gray-500 mt-1">Manage Smart On X internal admin users.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" /> Add Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Admin User</DialogTitle>
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
                    <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" placeholder="name@smartonx.com" {...field} /></FormControl><FormMessage/></FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem><FormLabel>Initial Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage/></FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? 'Saving...' : 'Create Staff'}</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {tempPassword && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl flex justify-between items-center shadow-sm">
          <div>
            <h3 className="font-bold text-green-900 mb-1">Password Reset Successful</h3>
            <p className="font-mono bg-green-100 px-3 py-1.5 rounded-md text-lg inline-block border border-green-200">{tempPassword}</p>
            <p className="text-sm mt-2 text-green-700">Please provide this password to the staff member securely.</p>
          </div>
          <Button variant="outline" onClick={() => setTempPassword(null)} className="bg-white hover:bg-green-50">Dismiss</Button>
        </div>
      )}

      <Card className="border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1,2,3].map(i => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : staff?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16 text-gray-500">
                    <Shield className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    No staff members found.
                  </TableCell>
                </TableRow>
              ) : (
                staff?.map(s => (
                  <TableRow key={s.id} className={!s.isActive ? 'opacity-50 bg-gray-50' : ''}>
                    <TableCell className="font-semibold text-primary">{s.name}</TableCell>
                    <TableCell className="text-gray-600">{s.email}</TableCell>
                    <TableCell>
                      {s.isActive ? (
                        <Badge className="bg-green-100 text-green-800 font-normal hover:bg-green-100">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="font-normal">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {s.lastLoginAt ? format(new Date(s.lastLoginAt), 'MMM d, yyyy h:mm a') : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleToggleActive(s.id, s.isActive)}
                          title={s.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {s.isActive ? <X className="w-4 h-4 text-red-500" /> : <Check className="w-4 h-4 text-green-500" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleResetPassword(s.id)}
                          title="Reset Password"
                        >
                          <Key className="w-4 h-4 text-gray-400" />
                        </Button>
                      </div>
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
