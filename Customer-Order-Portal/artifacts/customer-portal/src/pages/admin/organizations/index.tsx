import { useState } from 'react';
import { useListAdminOrganizations } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { Search, Building, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminOrgs() {
  const [query, setQuery] = useState('');
  // debounce query for real app, but simplified here
  const { data, isLoading } = useListAdminOrganizations({ query: query || undefined });

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Organizations</h1>
          <p className="text-gray-500 mt-1">Manage all CRM companies configured for the portal.</p>
        </div>
      </div>

      <Card className="border-gray-200 shadow-sm">
        <div className="p-4 border-b bg-gray-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search organizations..." 
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
        </div>
        
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : data?.orgs.length === 0 ? (
            <div className="text-center py-24 text-gray-500">
              <Building className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No organizations found</h3>
              <p className="mt-1 text-sm">No organizations match your search query.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    <TableHead>Organization Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-center">Locations</TableHead>
                    <TableHead className="text-center">Users</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">LTV</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.orgs.map((org) => (
                    <TableRow key={org.id} className="hover:bg-accent/5 group cursor-pointer">
                      <TableCell className="font-semibold text-primary">
                        <Link href={`/admin/organizations/${org.id}`}>
                          {org.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-gray-600 bg-gray-50">
                          {org.orgType.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{org.locationCount || 0}</TableCell>
                      <TableCell className="text-center">{org.userCount || 0}</TableCell>
                      <TableCell className="text-right">{org.orderCount || 0}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(org.lifetimeRevenueCents || 0)}</TableCell>
                      <TableCell>
                        <Link href={`/admin/organizations/${org.id}`} className="inline-flex items-center justify-center p-2 text-gray-400 group-hover:text-accent transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
