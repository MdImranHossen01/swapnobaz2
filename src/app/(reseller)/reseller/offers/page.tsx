'use client';

import { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, RefreshCcw, Plus, Eye, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function ResellerOffersPage() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchOffers = async () => {
    setLoading(true);
    const res = await fetch('/api/reseller/offers');
    if (res.ok) setOffers((await res.json()).offers || []);
    else toast.error('Failed to fetch offers');
    setLoading(false);
  };

  useEffect(() => { fetchOffers(); }, []);

  const filtered = offers.filter(o => JSON.stringify(o).toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex-1 space-y-4 px-0 py-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Offers / Quotations</h2>
          <p className="text-muted-foreground">Manage special offers and quotation requests from your customers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchOffers} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search offers..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold">#</TableHead>
              <TableHead className="font-bold">Customer</TableHead>
              <TableHead className="font-bold">Items</TableHead>
              <TableHead className="font-bold">Quoted Amount</TableHead>
              <TableHead className="font-bold">Date</TableHead>
              <TableHead className="font-bold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="h-40 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              </TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-40 text-center">
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <p className="text-muted-foreground">No offers / quotations found</p>
                </div>
              </TableCell></TableRow>
            ) : (
              filtered.map((o, i) => (
                <TableRow key={o._id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-sm">{i + 1}</TableCell>
                  <TableCell><div><p className="font-semibold">{o.customer?.name}</p><p className="text-xs text-muted-foreground">{o.customer?.phone}</p></div></TableCell>
                  <TableCell>{o.items?.length || 0}</TableCell>
                  <TableCell className="font-bold">৳{o.totalAmount?.toLocaleString()}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{o.createdAt ? format(new Date(o.createdAt), 'dd MMM yyyy') : '-'}</TableCell>
                  <TableCell><Badge variant={o.status === 'approved' ? 'default' : 'secondary'}>{o.status}</Badge></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
