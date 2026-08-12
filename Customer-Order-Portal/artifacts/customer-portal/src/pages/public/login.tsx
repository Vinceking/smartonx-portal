import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useLogin, useGetMe } from '@workspace/api-client-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const DEMO_CREDENTIALS = [
  { org: 'Wasatch Implant', users: ['schen (org_admin)', 'mruiz (purchaser)'] },
  { org: 'Precision Dental Lab', users: ['tjohnson (org_admin)', 'kpatel (purchaser)'] },
  { org: 'Summit Smiles DSO', users: ['dwallace (org_admin)', 'rnorth (regional_admin)', 'jbeck (purchaser)'] },
  { org: 'Red Rock Oral Surgery', users: ['alarsen (org_admin)'] },
  { org: 'Cache Valley', users: ['bmiller (org_admin)', 'sfoster (purchaser)'] },
  { org: 'Alpine Prosthetics', users: ['gkim (org_admin)', 'lvasquez (purchaser)'] },
  { org: 'BrightPath Dental', users: ['hcarter (org_admin)', 'pdiaz (regional_admin)', 'wthompson (purchaser)'] },
  { org: 'Dr. Nguyen Implant Center', users: ['nnguyen (org_admin)'] },
  { org: 'Timpanogos Dental Lab', users: ['eflores (org_admin)'] },
  { org: 'Frontier Dental', users: ['omorgan (org_admin)', 'csanders (regional_admin)', 'ryoung (purchaser)'] },
];

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login, refetch } = useAuth();
  const [isDemoOpen, setIsDemoOpen] = useState(true);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { usernameOrEmail: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await login({ data: values });
      refetch();
      setLocation('/portal');
    } catch (err: any) {
      toast({
        title: 'Login failed',
        description: err.error || 'Invalid credentials',
        variant: 'destructive',
      });
    }
  };

  const fillDemo = (username: string) => {
    const cleanUsername = username.split(' ')[0];
    form.setValue('usernameOrEmail', cleanUsername);
    form.setValue('password', 'DemoPass123!');
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-primary">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link href="/contact" className="font-medium text-accent hover:text-accent/80">
            request an account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="usernameOrEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username or Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your username or email" {...field} />
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

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link href="/forgot-username" className="font-medium text-accent hover:text-accent/80">
                    Forgot username?
                  </Link>
                </div>
                <div className="text-sm">
                  <Link href="/forgot-password" className="font-medium text-accent hover:text-accent/80">
                    Forgot password?
                  </Link>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </Form>

          <div className="mt-8 border-t pt-6">
            <Collapsible open={isDemoOpen} onOpenChange={setIsDemoOpen} className="bg-amber-50 rounded-lg border border-amber-200">
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-sm font-medium text-amber-900">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span>Demo Credentials</span>
                </div>
                {isDemoOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4 text-xs text-amber-800 space-y-3">
                <p>Password for all demo users: <strong className="font-mono bg-amber-100 px-1 py-0.5 rounded">DemoPass123!</strong></p>
                <div className="max-h-60 overflow-y-auto pr-2 space-y-3">
                  {DEMO_CREDENTIALS.map((org, i) => (
                    <div key={i} className="border-t border-amber-200/50 pt-2 first:border-0 first:pt-0">
                      <div className="font-semibold text-amber-900 mb-1">{org.org}</div>
                      <div className="flex flex-wrap gap-2">
                        {org.users.map((u, j) => (
                          <button
                            key={j}
                            type="button"
                            onClick={() => fillDemo(u)}
                            className="bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded text-[10px] transition-colors font-mono"
                          >
                            {u}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-amber-200/50 pt-3 mt-3">
                  <Link href="/admin/login" className="font-semibold text-accent hover:underline flex items-center gap-1">
                    Go to Admin Login &rarr;
                  </Link>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </div>
    </div>
  );
}
