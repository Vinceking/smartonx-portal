import { useState } from 'react';
import { useListEmailLog } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronDown, ChevronUp, Mail } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export default function AdminEmailLog() {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data, isLoading } = useListEmailLog();

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-primary tracking-tight">Email Log</h1>
        <p className="text-gray-500 mt-1">Monitor all emails sent by the portal.</p>
      </div>

      <Card className="border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Subject</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1,2,3,4,5].map(i => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-64" /></TableCell>
                  </TableRow>
                ))
              ) : data?.entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16 text-gray-500">
                    <Mail className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    No emails found.
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
                      <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                        {format(new Date(entry.createdAt), 'MMM d, h:mm a')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-white">{entry.category}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="font-medium">{entry.toAddress}</div>
                        {entry.ccAddress && <div className="text-xs text-gray-400 mt-0.5">CC: {entry.ccAddress}</div>}
                      </TableCell>
                      <TableCell className="font-medium text-gray-900 w-1/3 truncate max-w-xs">
                        {entry.subject}
                      </TableCell>
                    </TableRow>
                    
                    {expandedId === entry.id && (
                      <TableRow className="bg-gray-50 border-b">
                        <TableCell colSpan={5} className="p-0">
                          <div className="p-6 border-t shadow-inner max-w-4xl mx-auto">
                            <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
                              <div className="p-4 border-b bg-gray-50 text-sm">
                                <div className="grid grid-cols-[80px_1fr] gap-2">
                                  <div className="text-gray-500 font-semibold text-right">To:</div>
                                  <div className="font-medium">{entry.toAddress}</div>
                                  {entry.ccAddress && (
                                    <>
                                      <div className="text-gray-500 font-semibold text-right">CC:</div>
                                      <div>{entry.ccAddress}</div>
                                    </>
                                  )}
                                  <div className="text-gray-500 font-semibold text-right">Subject:</div>
                                  <div className="font-bold text-gray-900">{entry.subject}</div>
                                  <div className="text-gray-500 font-semibold text-right">Date:</div>
                                  <div className="text-gray-600">{format(new Date(entry.createdAt), 'MMMM d, yyyy h:mm:ss a')}</div>
                                </div>
                              </div>
                              <div className="p-6 text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                                {entry.bodyText}
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

import React from 'react';
