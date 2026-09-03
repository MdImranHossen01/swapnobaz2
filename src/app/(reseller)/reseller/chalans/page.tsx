'use client';

import { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, RefreshCcw, Truck, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function ResellerChalansPage() {
  const [chalans, setChalans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchChalans = async () => {
    setLoading(true);
    const res = await fetch('/api/reseller/chalans');
    if (res.ok) setChalans((await res.json()).chalans || []);
    else toast.error('Failed to fetch chalans');
    setLoading(false);
  };

  useEffect(() => { fetchChalans(); }, []);

  const filtered = chalans.filter(c => JSON.stringify(c).toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex-1 space-y-4 px-0 py-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Delivery Challans</h2>
          <p className="text-muted-foreground">Track delivery challans for your store orders</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchChalans} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
        </Button>
      </div>
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search chalans..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold">Chalan #</TableHead>
              <TableHead className="font-bold">Order</TableHead>
              <TableHead className="font-bold">Customer</TableHead>
              <TableHead className="font-bold">Address</TableHead>
              <TableHead className="font-bold">Date</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="text-right font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="h-40 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              </TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="h-40 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Truck className="h-8 w-8 text-muted-foreground" />
                  <p className="text-muted-foreground">No delivery challans found</p>
                </div>
              </TableCell></TableRow>
            ) : (
              filtered.map(c => (
                <TableRow key={c._id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono font-bold">{c.chalanNumber}</TableCell>
                  <TableCell className="font-mono text-primary">{c.orderId?.shortId || '-'}</TableCell>
                  <TableCell><p className="font-semibold">{c.customer?.name}</p></TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{c.customer?.address}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.createdAt ? format(new Date(c.createdAt), 'dd MMM') : '-'}</TableCell>
                  <TableCell><Badge variant={c.status === 'delivered' ? 'default' : 'secondary'}>{c.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-primary">
                      <Printer className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
