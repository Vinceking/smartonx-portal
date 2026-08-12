import { useState } from 'react';
import { Link, useSearch } from 'wouter';
import { useResetPassword } from '@workspace/api-client-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const schema = z.object({
  newPassword: z.string().min(10, 'Password must be at least 10 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function ResetPassword() {
  const [isSuccess, setIsSuccess] = useState(false);
  const searchString = useSearch();
  const tokenMatch = searchString.match(/token=([^&]+)/);
  const token = tokenMatch ? tokenMatch[1] : null;

  const resetPassword = useResetPassword();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    if (!token) return;
    try {
      await resetPassword.mutateAsync({ 
        data: { token, newPassword: values.newPassword, confirmPassword: values.confirmPassword } 
      });
      setIsSuccess(true);
    } catch (err: any) {
      form.setError('root', { message: err.error || 'Failed to reset password. The link may have expired.' });
    }
  };

  if (!token) {
    return (
      <div className="min-h-[70vh] flex flex-col justify-center items-center py-12 px-4">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Reset Link</h2>
        <p className="text-gray-600 mb-6 text-center max-w-md">
          This password reset link is invalid or missing the required token. Please request a new link.
        </p>
        <Button asChild>
          <Link href="/forgot-password">Request New Link</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-primary">
          Reset Password
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          {isSuccess ? (
            <div className="text-center">
              <CheckCircle2 className="w-12 h-12 text-accent mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Password Reset Successful</h3>
              <p className="text-sm text-gray-600 mb-6">
                Your password has been successfully updated. You can now log in with your new password.
              </p>
              <Button asChild className="w-full">
                <Link href="/login">Go to login</Link>
              </Button>
            </div>
          ) : (
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
                        <Input type="password" placeholder="Re-enter password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Resetting...' : 'Reset Password'}
                </Button>
              </form>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
}
