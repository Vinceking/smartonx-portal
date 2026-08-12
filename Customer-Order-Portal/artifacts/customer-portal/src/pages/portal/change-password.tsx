import { useState } from 'react';
import { useLocation } from 'wouter';
import { useChangePassword } from '@workspace/api-client-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AlertCircle, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

const schema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(10, 'Password must be at least 10 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function PortalChangePassword() {
  const [, setLocation] = useLocation();
  const { user, refetch } = useAuth();
  const changePassword = useChangePassword();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      await changePassword.mutateAsync({ data: values });
      await refetch();
      setLocation('/portal');
    } catch (err: any) {
      form.setError('root', { message: err.error || 'Failed to change password' });
    }
  };

  return (
    <div className="max-w-md mx-auto pt-12 pb-24">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-primary tracking-tight">Change Password</h1>
        {user?.mustChangePassword && (
          <p className="mt-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-md inline-block text-sm font-medium">
            You must change your password before continuing.
          </p>
        )}
      </div>

      <div className="bg-white py-8 px-6 shadow-sm sm:rounded-xl sm:px-10 border border-gray-200">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {form.formState.errors.root && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <p>{form.formState.errors.root.message}</p>
              </div>
            )}
            
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Minimum 10 characters" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Re-enter new password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
