import { useState } from 'react';
import { useResolveIdentity } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Shield, Building2, MapPin, Contact, Mail, Fingerprint, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export default function AdminIdentity() {
  const [email, setEmail] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const { toast } = useToast();

  const { data: result, isLoading, isError, error } = useResolveIdentity(
    { email: searchEmail },
    { query: { enabled: !!searchEmail, retry: false } }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast({ title: 'Invalid email', variant: 'destructive' });
      return;
    }
    setSearchEmail(email.trim());
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-primary tracking-tight">Identity Resolver</h1>
        <p className="text-gray-500 mt-1">Look up an email to see its complete identity chain across the portal and HubSpot.</p>
      </div>

      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input 
                type="email"
                placeholder="Enter email address (e.g. user@example.com)" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="pl-10 text-lg h-12"
              />
            </div>
            <Button type="submit" size="lg" className="h-12 px-8" disabled={isLoading}>
              {isLoading ? 'Resolving...' : 'Resolve'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="space-y-6">
          <Skeleton className="h-48 rounded-xl" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-xl flex items-start gap-4">
          <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-lg">Error Resolving Identity</h3>
            <p className="mt-1">{(error as any)?.error || 'An unexpected error occurred.'}</p>
          </div>
        </div>
      )}

      {result && !isLoading && !isError && (
        <div className="space-y-6">
          {!result.found ? (
            <div className="bg-amber-50 border border-amber-200 p-8 rounded-xl text-center space-y-4">
              <Fingerprint className="w-12 h-12 text-amber-400 mx-auto" />
              <div>
                <h3 className="text-xl font-bold text-amber-900">No Exact Match Found</h3>
                <p className="text-amber-700 mt-2">The email <strong className="font-semibold">{searchEmail}</strong> is not associated with any portal user or primary HubSpot contact.</p>
              </div>

              {result.nearMatches && result.nearMatches.length > 0 && (
                <div className="mt-8 text-left max-w-2xl mx-auto">
                  <h4 className="font-semibold text-amber-900 mb-4 border-b border-amber-200 pb-2">Near Matches in CRM</h4>
                  <div className="space-y-3">
                    {result.nearMatches.map(c => (
                      <div key={c.id} className="bg-white p-4 rounded-lg border border-amber-200 shadow-sm flex justify-between items-center">
                        <div>
                          <div className="font-medium text-gray-900">{c.firstName} {c.lastName} <span className="text-gray-500 font-normal text-sm ml-2">{c.roleTitle}</span></div>
                          <div className="text-sm text-gray-500 mt-1">{c.emails?.map(e => e.email).join(', ')}</div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => { setEmail(c.emails?.[0]?.email || ''); setSearchEmail(c.emails?.[0]?.email || ''); }}>
                          Use this
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Success overview */}
              <div className="bg-green-50 border border-green-200 p-6 rounded-xl flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-green-900">Identity Resolved</h3>
                    <p className="text-green-700">Found matched record via <strong className="font-mono bg-green-100 px-1 rounded">{result.matchedEmail}</strong></p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Portal User */}
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="bg-gray-50 border-b pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Shield className="w-5 h-5 text-accent" />
                      Portal Account
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {result.portalUser ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">Username</div>
                            <div className="text-xl font-mono font-bold text-primary">{result.portalUser.username}</div>
                          </div>
                          {result.portalUser.isActive ? 
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge> : 
                            <Badge variant="secondary">Inactive</Badge>
                          }
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                          <div>
                            <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Role</div>
                            <Badge variant="outline" className="text-primary border-primary bg-primary/5">{result.portalUser.roleLabel}</Badge>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Last Login</div>
                            <div className="text-sm font-medium">{result.portalUser.lastLoginAt ? new Date(result.portalUser.lastLoginAt).toLocaleDateString() : 'Never'}</div>
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t">
                          <div className="text-xs text-gray-500 uppercase font-semibold mb-2">Location Access</div>
                          {result.portalUser.roleKey === 'org_admin' ? (
                            <span className="text-sm font-medium text-gray-700">All Locations</span>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {result.portalUser.locationAccess?.map((loc, i) => (
                                <Badge key={i} variant="secondary" className="font-normal text-xs">{loc}</Badge>
                              ))}
                              {(!result.portalUser.locationAccess || result.portalUser.locationAccess.length === 0) && (
                                <span className="text-sm text-gray-400 italic">No explicit locations</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h4 className="text-gray-900 font-medium">No Portal Account</h4>
                        <p className="text-sm text-gray-500 mt-1">This contact exists in the CRM but has not been invited to the portal.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* CRM Contact */}
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="bg-gray-50 border-b pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Contact className="w-5 h-5 text-primary" />
                      HubSpot Contact
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {result.contact ? (
                      <>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-xl font-bold text-gray-900">{result.contact.firstName} {result.contact.lastName}</div>
                            <div className="text-gray-500">{result.contact.roleTitle}</div>
                          </div>
                          <div className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded">ID: {result.contact.id}</div>
                        </div>
                        
                        <div className="pt-4 border-t">
                          <div className="text-xs text-gray-500 uppercase font-semibold mb-2">Known Emails</div>
                          <div className="space-y-2">
                            {result.contact.emails?.map(e => (
                              <div key={e.id} className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                                <span className={e.email.toLowerCase() === result.matchedEmail?.toLowerCase() ? "font-bold text-accent" : "text-gray-700"}>{e.email}</span>
                                {e.isPrimary && <Badge variant="outline" className="text-[10px] h-4 py-0 leading-none">Primary</Badge>}
                                {e.email.toLowerCase() === result.matchedEmail?.toLowerCase() && <Badge className="bg-accent/10 text-accent hover:bg-accent/10 border-0 h-4 py-0 text-[10px] leading-none">Matched</Badge>}
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-red-500">Contact data missing.</div>
                    )}
                  </CardContent>
                </Card>

                {/* CRM Company */}
                <Card className="border-gray-200 shadow-sm md:col-span-2">
                  <CardHeader className="bg-gray-50 border-b pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Building2 className="w-5 h-5 text-primary" />
                      Organization Context
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="p-6 border-b">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-2xl font-bold text-primary">{result.company?.name}</h3>
                        <Badge variant="outline" className="capitalize">{result.company?.orgType.replace('_', ' ')}</Badge>
                      </div>
                      <div className="text-sm font-mono text-gray-500">HubSpot Company ID: {result.company?.id}</div>
                    </div>
                    
                    <div className="p-6 bg-gray-50/50">
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Locations</h4>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {result.locations?.map(loc => (
                          <div key={loc.id} className="bg-white border rounded-lg p-3 text-sm relative overflow-hidden">
                            {result.portalUser?.locationAccess?.includes(loc.id) && (
                              <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">Access Granted</div>
                            )}
                            <div className="font-semibold text-gray-900 mb-1">{loc.nickname} {loc.isDefault && <Badge variant="secondary" className="text-[10px] ml-1">Default</Badge>}</div>
                            <div className="text-gray-600 truncate">{loc.address1}</div>
                            <div className="text-gray-600 truncate">{loc.city}, {loc.state} {loc.zip}</div>
                            <div className="mt-2 pt-2 border-t text-xs text-gray-400">
                              Billing: {loc.billingProfile?.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

import { CheckCircle2 } from 'lucide-react';
