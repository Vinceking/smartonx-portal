import { useState } from 'react';
import { 
  useListTeamUsers, 
  useGetCrmContacts, 
  useListManageLocations,
  useCreateTeamUser,
  useUpdateTeamUser,
  useResetTeamUserPassword
} from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Users, Plus, Shield, Check, X, Key, Edit2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const createUserSchema = z.object({
  hubspotContactId: z.string().min(1, 'Please select a contact'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  roleKey: z.string().min(1, 'Role is required'),
  locationIds: z.array(z.string()).optional(),
  // For new contacts
  newContactFirst: z.string().optional(),
  newContactLast: z.string().optional(),
  newContactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  newContactRoleTitle: z.string().optional(),
}).refine(data => {
  if (data.hubspotContactId === 'new') {
    return !!data.newContactFirst && !!data.newContactLast && !!data.newContactEmail;
  }
  return true;
}, { message: "First name, last name, and email are required for a new contact", path: ["newContactEmail"] });

export default function ManageTeam() {
  const { data: users, isLoading, refetch } = useListTeamUsers();
  const { data: contacts } = useGetCrmContacts();
  const { data: locations } = useListManageLocations();
  
  const createMutation = useCreateTeamUser();
  const updateMutation = useUpdateTeamUser();
  const resetPassMutation = useResetTeamUserPassword();
  
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const form = useForm<z.infer<typeof createUserSchema>>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      hubspotContactId: '',
      username: '',
      roleKey: 'purchaser',
      locationIds: [],
      newContactFirst: '',
      newContactLast: '',
      newContactEmail: '',
      newContactRoleTitle: '',
    }
  });

  const watchContactId = form.watch('hubspotContactId');

  const onSubmit = async (values: z.infer<typeof createUserSchema>) => {
    try {
      await createMutation.mutateAsync({ data: values });
      toast({ title: 'User created successfully' });
      setIsCreateOpen(false);
      form.reset();
      refetch();
    } catch (err: any) {
      form.setError('root', { message: err.error || 'Failed to create user' });
    }
  };

  const handleResetPassword = async (userId: number) => {
    if (!confirm('Are you sure you want to reset this user\'s password?')) return;
    try {
      const res = await resetPassMutation.mutateAsync({ id: userId });
      setTempPassword(res.tempPassword);
      toast({ title: 'Password reset successful' });
    } catch (err: any) {
      toast({ title: 'Failed to reset password', description: err.error, variant: 'destructive' });
    }
  };

  const handleToggleActive = async (userId: number, currentActive: boolean) => {
    try {
      await updateMutation.mutateAsync({ id: userId, data: { isActive: !currentActive } });
      refetch();
    } catch (err: any) {
      toast({ title: 'Failed to update user', description: err.error, variant: 'destructive' });
    }
  };

  const availableContacts = contacts?.filter(c => !c.hasPortalAccount) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Team Management</h1>
          <p className="text-gray-500 mt-1">Manage users and their access to the portal.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90">
              <Plus className="w-4 h-4 mr-2" /> Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Portal User</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {form.formState.errors.root && (
                  <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                    {form.formState.errors.root.message}
                  </div>
                )}
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold border-b pb-2">Identity</h3>
                    <FormField
                      control={form.control}
                      name="hubspotContactId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Contact</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select existing contact..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="new" className="font-semibold text-accent">+ Create New Contact</SelectItem>
                              {availableContacts.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.emails?.[0]?.email || 'No email'})</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {watchContactId === 'new' && (
                      <div className="space-y-3 bg-gray-50 p-3 rounded-md border">
                        <FormField
                          control={form.control}
                          name="newContactFirst"
                          render={({ field }) => (
                            <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="newContactLast"
                          render={({ field }) => (
                            <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="newContactEmail"
                          render={({ field }) => (
                            <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage/></FormItem>
                          )}
                        />
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. jsmith" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="roleKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Portal Role</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="purchaser">Purchaser (Order only)</SelectItem>
                              <SelectItem value="regional_admin">Regional Admin (Manage team/locations)</SelectItem>
                              <SelectItem value="org_admin">Org Admin (Full access)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold border-b pb-2">Location Access</h3>
                    <p className="text-xs text-gray-500">Org Admins automatically have access to all locations. For others, select explicitly.</p>
                    
                    <FormField
                      control={form.control}
                      name="locationIds"
                      render={() => (
                        <FormItem>
                          <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-3">
                            {locations?.map(loc => (
                              <FormField
                                key={loc.id}
                                control={form.control}
                                name="locationIds"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={loc.id}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(loc.id)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...(field.value || []), loc.id])
                                              : field.onChange(field.value?.filter((value) => value !== loc.id));
                                          }}
                                        />
                                      </FormControl>
                                      <div className="space-y-1 leading-none">
                                        <FormLabel className="font-normal cursor-pointer">
                                          {loc.nickname} <span className="text-gray-400 text-xs ml-1">({loc.city}, {loc.state})</span>
                                        </FormLabel>
                                      </div>
                                    </FormItem>
                                  )
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? 'Creating...' : 'Create User'}</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {tempPassword && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl flex justify-between items-center shadow-sm">
          <div>
            <h3 className="font-bold text-green-900 mb-1">Temporary Password Generated</h3>
            <p className="font-mono bg-green-100 px-3 py-1.5 rounded-md text-lg inline-block border border-green-200">{tempPassword}</p>
            <p className="text-sm mt-2 text-green-700">Please copy this password. It will not be shown again.</p>
          </div>
          <Button variant="outline" onClick={() => setTempPassword(null)} className="bg-white hover:bg-green-50">Dismiss</Button>
        </div>
      )}

      <Card className="border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Locations</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1,2,3].map(i => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : users?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                    <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    No portal users found.
                  </TableCell>
                </TableRow>
              ) : (
                users?.map(u => (
                  <TableRow key={u.id} className={!u.isActive ? 'opacity-50 bg-gray-50' : ''}>
                    <TableCell>
                      <div className="font-semibold text-primary">{u.firstName} {u.lastName}</div>
                      <div className="text-xs text-gray-500 font-mono">{u.username}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={u.roleKey === 'org_admin' ? 'border-primary text-primary bg-primary/5' : ''}>
                        {u.roleLabel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {u.roleKey === 'org_admin' ? (
                        <span className="text-sm font-medium text-gray-600">All ({u.totalLocations})</span>
                      ) : (
                        <span className="text-sm">{u.locationAccessCount || 0}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.isActive ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 font-normal">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="font-normal">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {u.lastLoginAt ? format(new Date(u.lastLoginAt), 'MMM d, yyyy') : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleToggleActive(u.id, u.isActive)}
                          title={u.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {u.isActive ? <X className="w-4 h-4 text-red-500" /> : <Check className="w-4 h-4 text-green-500" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleResetPassword(u.id)}
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
