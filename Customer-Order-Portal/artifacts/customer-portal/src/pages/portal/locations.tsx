import { useListPortalLocations } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Plus, ShieldCheck } from 'lucide-react';
import { Link } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';

export default function PortalLocations() {
  const { data: locations, isLoading } = useListPortalLocations();
  const { user } = useAuth();
  
  const canManage = user?.roleKey === 'org_admin' || user?.roleKey === 'regional_admin';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">My Locations</h1>
          <p className="text-gray-500 mt-1">Locations you have access to for placing orders.</p>
        </div>
        {canManage && (
          <Button asChild>
            <Link href="/portal/manage/locations">
              <Plus className="w-4 h-4 mr-2" />
              Manage Locations
            </Link>
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : locations?.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <MapPin className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No locations assigned</h3>
            <p className="mt-1 text-sm text-gray-500 max-w-md">
              You haven't been granted access to any locations yet. Contact your organization administrator to request access.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations?.map(loc => (
            <Card key={loc.id} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors"></div>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl leading-tight">{loc.nickname}</CardTitle>
                  {loc.isDefault && <Badge variant="secondary" className="bg-accent/10 text-accent hover:bg-accent/20">Default</Badge>}
                </div>
                {loc.validated && (
                  <div className="flex items-center gap-1 text-xs text-green-600 font-medium mt-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Address Verified
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600">
                  <div className="flex gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    <div>
                      <div>{loc.address1}</div>
                      {loc.address2 && <div>{loc.address2}</div>}
                      <div>{loc.city}, {loc.state} {loc.zip}</div>
                    </div>
                  </div>
                  {loc.phone && <div className="mt-2 ml-6 text-gray-500">{loc.phone}</div>}
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                  <div className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">Billing Profile</div>
                  <div className="text-sm font-medium text-gray-700 truncate" title={loc.billingProfile?.name}>
                    {loc.billingProfile?.name || 'Unknown'}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
