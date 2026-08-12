import { useState } from 'react';
import { useRoute, Link } from 'wouter';
import { 
  useGetAdminOrganization,
  useListAdminOrgLocations,
  useListAdminOrgBillingProfiles,
  useListAdminOrgUsers,
  useListAdminOrgContacts,
  useListAdminOrgOrders,
  useUpdateAdminOrganization
} from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch as SwitchControl } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Building2, MapPin, CreditCard, Users, Contact, Package, Settings, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function AdminOrgDetail() {
  const [, params] = useRoute('/admin/organizations/:id');
  const orgId = params?.id;
  const { toast } = useToast();

  const { data: org, isLoading: orgLoading, refetch: refetchOrg } = useGetAdminOrganization(orgId as string, { query: { enabled: !!orgId } });
  
  const updateOrg = useUpdateAdminOrganization();

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
  };

  const handleUpdateType = async (newType: string) => {
    if (!orgId) return;
    try {
      await updateOrg.mutateAsync({ id: orgId, data: { orgType: newType } });
      refetchOrg();
      toast({ title: 'Organization type updated' });
    } catch (err: any) {
      toast({ title: 'Failed to update', description: err.error, variant: 'destructive' });
    }
  };

  const handleToggleBillingEdit = async (checked: boolean) => {
    if (!orgId) return;
    try {
      await updateOrg.mutateAsync({ id: orgId, data: { allowAdminBillingEdit: checked } });
      refetchOrg();
      toast({ title: 'Billing edit permissions updated' });
    } catch (err: any) {
      toast({ title: 'Failed to update', description: err.error, variant: 'destructive' });
    }
  };

  if (!orgId) return null;

  if (orgLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  if (!org) return <div>Organization not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" asChild className="-ml-4 text-gray-500 hover:text-primary">
          <Link href="/admin/organizations">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Organizations
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-primary tracking-tight">{org.company.name}</h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500 ml-15">
            <span className="font-mono">HubSpot ID: {org.company.id}</span>
            <span>•</span>
            <span>Created {org.company.createdAt ? format(new Date(org.company.createdAt), 'MMM yyyy') : 'Unknown'}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" asChild>
            <a href={`https://app.hubspot.com/contacts/YOUR_PORTAL_ID/company/${org.company.id}`} target="_blank" rel="noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" /> View in HubSpot
            </a>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-gray-100 p-1 mb-6 w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="locations">Locations ({org.locationCount})</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="users">Portal Users ({org.userCount})</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="orders">Orders ({org.orderCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="border-gray-200 shadow-sm md:col-span-3">
              <CardHeader>
                <CardTitle className="text-lg">Key Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-8">
                  <div>
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Lifetime Revenue</div>
                    <div className="text-3xl font-bold text-primary">{formatCurrency(org.lifetimeRevenueCents)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Total Orders</div>
                    <div className="text-3xl font-bold text-primary">{org.orderCount}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Orders This Month</div>
                    <div className="text-3xl font-bold text-primary">{org.ordersThisMonth || 0}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm bg-gray-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Settings className="w-4 h-4" /> Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Organization Type</label>
                  <Select value={org.company.orgType} onValueChange={handleUpdateType}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dental_practice">Dental Practice</SelectItem>
                      <SelectItem value="lab">Dental Lab</SelectItem>
                      <SelectItem value="dso">DSO (Multiple Locations)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Allow Billing Edit</label>
                    <div className="text-xs text-gray-400 mt-1">Let org admins add/edit billing profiles</div>
                  </div>
                  <SwitchControl 
                    checked={org.company.allowAdminBillingEdit} 
                    onCheckedChange={handleToggleBillingEdit} 
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="locations">
          <OrgLocationsTab orgId={orgId} />
        </TabsContent>

        <TabsContent value="billing">
          <OrgBillingTab orgId={orgId} />
        </TabsContent>

        <TabsContent value="users">
          <OrgUsersTab orgId={orgId} />
        </TabsContent>

        <TabsContent value="contacts">
          <OrgContactsTab orgId={orgId} />
        </TabsContent>

        <TabsContent value="orders">
          <OrgOrdersTab orgId={orgId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Sub-components for tabs to encapsulate their own queries and state
function OrgLocationsTab({ orgId }: { orgId: string }) {
  const { data: locations, isLoading } = useListAdminOrgLocations(orgId);

  if (isLoading) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;

  return (
    <Card className="border-gray-200 shadow-sm">
      <Table>
        <TableHeader className="bg-gray-50/50">
          <TableRow>
            <TableHead>Nickname</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Billing Profile</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {locations?.map(l => (
            <TableRow key={l.id}>
              <TableCell>
                <div className="font-semibold">{l.nickname}</div>
                <div className="text-xs text-gray-400 font-mono mt-0.5">{l.id}</div>
              </TableCell>
              <TableCell className="text-sm">
                <div>{l.address1} {l.address2}</div>
                <div>{l.city}, {l.state} {l.zip}</div>
                {l.phone && <div className="text-gray-500 mt-1">{l.phone}</div>}
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {l.billingProfile?.name || '—'}
              </TableCell>
              <TableCell>
                <Badge variant={l.validated ? "outline" : "secondary"} className={l.validated ? "text-green-700 bg-green-50 border-green-200" : ""}>
                  {l.validated ? 'Verified' : 'Unverified'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
          {locations?.length === 0 && (
            <TableRow><TableCell colSpan={4} className="text-center py-8 text-gray-500">No locations found</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}

function OrgBillingTab({ orgId }: { orgId: string }) {
  const { data: billing, isLoading } = useListAdminOrgBillingProfiles(orgId);

  if (isLoading) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;

  return (
    <Card className="border-gray-200 shadow-sm">
      <Table>
        <TableHeader className="bg-gray-50/50">
          <TableRow>
            <TableHead>Profile Name</TableHead>
            <TableHead>Payment Terms</TableHead>
            <TableHead>Billing Address</TableHead>
            <TableHead>A/P Contact</TableHead>
            <TableHead>Used By</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {billing?.map(b => (
            <TableRow key={b.id}>
              <TableCell>
                <div className="font-semibold">{b.name}</div>
                {b.isDefault && <Badge variant="secondary" className="mt-1 text-[10px]">Default</Badge>}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={b.paymentTerms === 'net_terms' ? 'bg-blue-50 text-blue-700' : ''}>
                  {b.paymentTerms === 'net_terms' ? `Net ${b.netDays || 30}` : 'Credit Card'}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">
                <div>{b.address1} {b.address2}</div>
                <div>{b.city}, {b.state} {b.zip}</div>
              </TableCell>
              <TableCell className="text-sm">
                <div>{b.apEmail}</div>
                {b.apPhone && <div className="text-gray-500">{b.apPhone}</div>}
              </TableCell>
              <TableCell className="text-sm">
                {b.usedByLocationCount || 0} locations
              </TableCell>
            </TableRow>
          ))}
          {billing?.length === 0 && (
            <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">No billing profiles found</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}

function OrgUsersTab({ orgId }: { orgId: string }) {
  const { data: users, isLoading } = useListAdminOrgUsers(orgId);

  if (isLoading) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;

  return (
    <Card className="border-gray-200 shadow-sm">
      <Table>
        <TableHeader className="bg-gray-50/50">
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Locations</TableHead>
            <TableHead>Last Login</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users?.map(u => (
            <TableRow key={u.id} className={!u.isActive ? "opacity-60 bg-gray-50" : ""}>
              <TableCell>
                <div className="font-semibold text-primary">{u.firstName} {u.lastName}</div>
                <div className="text-xs text-gray-500 font-mono">{u.username}</div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={u.roleKey === 'org_admin' ? "bg-primary/5 text-primary border-primary/30" : ""}>
                  {u.roleLabel}
                </Badge>
              </TableCell>
              <TableCell>
                {u.isActive ? <Badge className="bg-green-100 text-green-800 font-normal hover:bg-green-100">Active</Badge> : <Badge variant="secondary" className="font-normal">Inactive</Badge>}
              </TableCell>
              <TableCell className="text-sm">
                {u.roleKey === 'org_admin' ? `All (${u.totalLocations})` : u.locationAccessCount}
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {u.lastLoginAt ? format(new Date(u.lastLoginAt), 'MMM d, yyyy') : 'Never'}
              </TableCell>
            </TableRow>
          ))}
          {users?.length === 0 && (
            <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">No portal users found</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}

function OrgContactsTab({ orgId }: { orgId: string }) {
  const { data: contacts, isLoading } = useListAdminOrgContacts(orgId);

  if (isLoading) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;

  return (
    <Card className="border-gray-200 shadow-sm">
      <Table>
        <TableHeader className="bg-gray-50/50">
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Emails</TableHead>
            <TableHead>Portal Access</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts?.map(c => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.firstName} {c.lastName}</TableCell>
              <TableCell className="text-sm text-gray-600">{c.roleTitle}</TableCell>
              <TableCell className="text-sm">
                {c.emails?.map(e => <div key={e.id}>{e.email}</div>)}
              </TableCell>
              <TableCell>
                {c.hasPortalAccount ? (
                  <Badge variant="outline" className="bg-accent/10 text-accent font-normal border-accent/20">
                    User: {c.portalUsername}
                  </Badge>
                ) : (
                  <span className="text-sm text-gray-400">None</span>
                )}
              </TableCell>
            </TableRow>
          ))}
          {contacts?.length === 0 && (
            <TableRow><TableCell colSpan={4} className="text-center py-8 text-gray-500">No contacts found</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}

function OrgOrdersTab({ orgId }: { orgId: string }) {
  const { data, isLoading } = useListAdminOrgOrders(orgId);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
  };

  if (isLoading) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;

  return (
    <Card className="border-gray-200 shadow-sm">
      <Table>
        <TableHeader className="bg-gray-50/50">
          <TableRow>
            <TableHead>Order #</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.orders.map(order => (
            <TableRow key={order.id}>
              <TableCell className="font-medium text-primary">
                {order.orderNumber}
                <div className="text-xs text-gray-500 font-mono mt-0.5">PO: {order.poNumber}</div>
              </TableCell>
              <TableCell className="text-sm">{format(new Date(order.orderedAt), 'MMM d, yyyy')}</TableCell>
              <TableCell className="text-sm max-w-[200px] truncate">{order.locationNickname}</TableCell>
              <TableCell className="font-semibold">{formatCurrency(order.totalCents)}</TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {order.status.replace('_', ' ')}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
          {data?.orders.length === 0 && (
            <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">No orders found</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
