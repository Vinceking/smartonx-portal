import { useState } from 'react';
import { useGetPortalAccount, useAddAccountEmail } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Link } from 'wouter';
import { User, Mail, Shield, Plus, Key } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export default function PortalAccount() {
  const { data: account, isLoading, refetch } = useGetPortalAccount();
  const addEmail = useAddAccountEmail();
  const { toast } = useToast();
  const [isAddingEmail, setIsAddingEmail] = useState(false);

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const onAddEmail = async (values: z.infer<typeof emailSchema>) => {
    try {
      await addEmail.mutateAsync({ data: values });
      toast({ title: 'Email added successfully' });
      setIsAddingEmail(false);
      emailForm.reset();
      refetch();
    } catch (err: any) {
      toast({
        title: 'Failed to add email',
        description: err.error || 'Please try again',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid md:grid-cols-3 gap-6">
          <Skeleton className="h-64 md:col-span-2 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!account) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">My Account</h1>
          <p className="text-gray-500 mt-1">Manage your profile and settings.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/portal/change-password">
            <Key className="w-4 h-4 mr-2" />
            Change Password
          </Link>
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="border-b bg-gray-50/50 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-gray-500" /> Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid sm:grid-cols-2 gap-y-6 gap-x-8">
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">First Name</div>
                  <div className="font-semibold text-gray-900">{account.firstName || '—'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Last Name</div>
                  <div className="font-semibold text-gray-900">{account.lastName || '—'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Job Title</div>
                  <div className="text-gray-900">{account.roleTitle || '—'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Username</div>
                  <div className="text-gray-900 font-mono bg-gray-100 inline-block px-2 py-0.5 rounded">{account.username}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="border-b bg-gray-50/50 pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="w-5 h-5 text-gray-500" /> Email Addresses
              </CardTitle>
              {!isAddingEmail && (
                <Button variant="outline" size="sm" onClick={() => setIsAddingEmail(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Add Email
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {account.contact.emails?.map(email => (
                  <div key={email.id} className="p-4 flex items-center justify-between">
                    <div className="font-medium">{email.email}</div>
                    {email.isPrimary && <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Primary</Badge>}
                  </div>
                ))}
              </div>
              
              {isAddingEmail && (
                <div className="p-4 bg-gray-50 border-t">
                  <Form {...emailForm}>
                    <form onSubmit={emailForm.handleSubmit(onAddEmail)} className="flex items-start gap-3">
                      <FormField
                        control={emailForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem className="flex-1 space-y-0">
                            <FormControl>
                              <Input placeholder="new@example.com" {...field} />
                            </FormControl>
                            <FormMessage className="mt-1 text-xs" />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={addEmail.isPending}>Save</Button>
                      <Button type="button" variant="ghost" onClick={() => setIsAddingEmail(false)}>Cancel</Button>
                    </form>
                  </Form>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="border-b bg-gray-50/50 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-gray-500" /> Organization
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Company</div>
                <div className="font-semibold text-gray-900">{account.orgName}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Your Role</div>
                <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5">{account.roleLabel}</Badge>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500 mb-2">Location Access</div>
                {account.locationAccess.length === 0 ? (
                  <div className="text-sm text-gray-400 italic">No locations assigned</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {account.locationAccess.map((loc, i) => (
                      <Badge key={i} variant="secondary" className="font-normal text-xs">{loc}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
