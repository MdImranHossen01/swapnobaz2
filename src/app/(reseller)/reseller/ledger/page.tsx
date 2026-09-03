'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Wallet, RefreshCcw } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function ResellerLedgerPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [balance, setBalance] = useState({ available: 0, pending: 0, withdrawn: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reseller/ledger');
      if (res.ok) {
        const d = await res.json();
        setEntries(d.entries || []);
        setBalance(d.balance || { available: 0, pending: 0, withdrawn: 0 });
      } else toast.error('Failed to fetch ledger');
    } catch (error) {
      console.error(error);
      toast.error('An error occurred while fetching ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="flex-1 space-y-4 px-0 py-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Accounts Ledger</h2>
          <p className="text-muted-foreground">Complete financial record of your store account</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Available Balance', value: balance.available, color: 'text-green-600' },
          { label: 'Pending Balance', value: balance.pending, color: 'text-yellow-600' },
          { label: 'Total Withdrawn', value: balance.withdrawn, color: 'text-blue-600' },
        ].map(b => (
          <Card key={b.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className={`h-4 w-4 ${b.color}`} />
                <p className="text-xs text-muted-foreground">{b.label}</p>
              </div>
              <p className={`text-2xl font-black ${b.color}`}>৳{(b.value || 0).toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold">Date</TableHead>
              <TableHead className="font-bold">Description</TableHead>
              <TableHead className="font-bold">Reference</TableHead>
              <TableHead className="font-bold">Type</TableHead>
              <TableHead className="font-bold text-right">Amount</TableHead>
              <TableHead className="font-bold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="h-40 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              </TableCell></TableRow>
            ) : entries.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                No ledger entries found
              </TableCell></TableRow>
            ) : (
              entries.map(e => (
                <TableRow key={e._id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="text-sm">{e.createdAt ? format(new Date(e.createdAt), 'dd MMM yyyy, hh:mm a') : '-'}</TableCell>
                  <TableCell>{e.description}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{e.reference || '-'}</TableCell>
                  <TableCell><Badge variant={e.type === 'credit' ? 'default' : 'secondary'}>{e.type}</Badge></TableCell>
                  <TableCell className={`text-right font-bold ${e.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                    {e.type === 'credit' ? '+' : '-'}৳{Math.abs(e.amount || 0).toLocaleString()}
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{e.status || 'settled'}</Badge></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
