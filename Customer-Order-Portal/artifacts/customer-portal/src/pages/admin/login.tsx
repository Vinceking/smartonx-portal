import { useLocation } from 'wouter';
import { useAdminLogin } from '@workspace/api-client-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Shield } from 'lucide-react';
import { useAdminAuth } from '@/hooks/use-admin-auth';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { login, refetch } = useAdminAuth();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    try {
      await login({ data: values });
      refetch();
      setLocation('/admin');
    } catch (err: any) {
      form.setError('root', { message: err.error || 'Invalid credentials' });
    }
  };

  const fillDemo = () => {
    form.setValue('email', 'rachelle@smartonx.com');
    form.setValue('password', 'AdminDemo123!');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg border border-white/10">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-center text-3xl font-bold tracking-tight text-white">
          Admin Console
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Smart On X Staff Only
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 border border-gray-100">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {form.formState.errors.root && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">
                  {form.formState.errors.root.message}
                </div>
              )}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Staff Email</FormLabel>
                    <FormControl>
                      <Input placeholder="admin@smartonx.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90" size="lg" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Authenticating...' : 'Sign in'}
              </Button>
            </form>
          </Form>

          <div className="mt-6 border-t pt-6">
            <button 
              type="button" 
              onClick={fillDemo}
              className="w-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 py-3 rounded-lg text-sm font-medium transition-colors"
            >
              Fill Demo Admin Credentials
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
