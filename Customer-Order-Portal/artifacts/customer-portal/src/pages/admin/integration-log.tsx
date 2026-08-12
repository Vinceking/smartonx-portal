import { useState } from 'react';
import { useListIntegrationLog } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, ChevronDown, ChevronUp, Copy, Check, Terminal } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export default function AdminIntegrationLog() {
  const [systemFilter, setSystemFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // In a real app we'd pass pagination and filters
  const { data, isLoading } = useListIntegrationLog({
    system: systemFilter === 'all' ? undefined : systemFilter
  });

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const copyJson = (obj: any, sectionId: string) => {
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Integration Log</h1>
          <p className="text-gray-500 mt-1">Monitor API payloads between Portal, HubSpot, and Shopify.</p>
        </div>
      </div>

      <Card className="border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50/50 flex gap-4">
          <Select value={systemFilter} onValueChange={setSystemFilter}>
            <SelectTrigger className="w-[200px] bg-white">
              <SelectValue placeholder="Filter by System" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Systems</SelectItem>
              <SelectItem value="hubspot">HubSpot</SelectItem>
              <SelectItem value="shopify">Shopify</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Time</TableHead>
                <TableHead>System</TableHead>
                <TableHead>Operation</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead>Context</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1,2,3,4,5].map(i => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                  </TableRow>
                ))
              ) : data?.entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16 text-gray-500">
                    <Terminal className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    No integration logs found.
                  </TableCell>
                </TableRow>
              ) : (
                data?.entries.map((entry) => (
                  <React.Fragment key={entry.id}>
                    <TableRow 
                      className={`hover:bg-gray-50 cursor-pointer ${expandedId === entry.id ? 'bg-gray-50' : ''}`}
                      onClick={() => toggleExpand(entry.id)}
                    >
                      <TableCell>
                        <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
                          {expandedId === entry.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </TableCell>
                      <TableCell className="text-sm font-mono text-gray-600 whitespace-nowrap">
                        {format(new Date(entry.createdAt), 'MMM d, HH:mm:ss.SSS')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={entry.system === 'hubspot' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-green-50 text-green-700 border-green-200'}>
                          {entry.system}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">{entry.operation}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-[10px]">{entry.direction}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {entry.orderNumber ? (
                          <span>Order <span className="font-mono bg-gray-100 px-1 rounded">{entry.orderNumber}</span></span>
                        ) : entry.orgName ? (
                          <span>Org: <span className="font-medium text-gray-900">{entry.orgName}</span></span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                    
                    {expandedId === entry.id && (
                      <TableRow className="bg-gray-50 border-b">
                        <TableCell colSpan={6} className="p-0">
                          <div className="p-6 grid lg:grid-cols-2 gap-6 border-t shadow-inner">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Payload</h4>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 text-xs" 
                                  onClick={() => copyJson(entry.payloadJson, `payload-${entry.id}`)}
                                >
                                  {copiedSection === `payload-${entry.id}` ? <Check className="w-3 h-3 mr-1 text-green-500" /> : <Copy className="w-3 h-3 mr-1" />} 
                                  Copy JSON
                                </Button>
                              </div>
                              <div className="bg-[#1e1e1e] text-[#d4d4d4] p-4 rounded-md overflow-x-auto text-xs font-mono max-h-[400px] overflow-y-auto">
                                <pre>{JSON.stringify(entry.payloadJson, null, 2)}</pre>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Result</h4>
                                {entry.resultJson && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 text-xs" 
                                    onClick={() => copyJson(entry.resultJson, `result-${entry.id}`)}
                                  >
                                    {copiedSection === `result-${entry.id}` ? <Check className="w-3 h-3 mr-1 text-green-500" /> : <Copy className="w-3 h-3 mr-1" />} 
                                    Copy JSON
                                  </Button>
                                )}
                              </div>
                              <div className="bg-[#1e1e1e] text-[#d4d4d4] p-4 rounded-md overflow-x-auto text-xs font-mono max-h-[400px] overflow-y-auto">
                                {entry.resultJson ? (
                                  <pre>{JSON.stringify(entry.resultJson, null, 2)}</pre>
                                ) : (
                                  <div className="text-gray-500 italic">No result recorded</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

// Needed to import React for Fragments since we're using map
import React from 'react';
