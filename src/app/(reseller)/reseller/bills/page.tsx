'use client';

import { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, RefreshCcw, FileText, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { generateBillPDF } from '@/lib/bill-invoice-generator';

export default function ResellerBillsPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchBills = async () => {
    setLoading(true);
    const res = await fetch('/api/reseller/bills');
    if (res.ok) setBills((await res.json()).bills || []);
    else toast.error('Failed to fetch bills');
    setLoading(false);
  };

  useEffect(() => { fetchBills(); }, []);

  const filtered = bills.filter(b => JSON.stringify(b).toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex-1 space-y-4 px-0 py-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Client Bills</h2>
          <p className="text-muted-foreground">View and print invoices for your customers</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchBills} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
        </Button>
      </div>
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search bills..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold">Invoice #</TableHead>
              <TableHead className="font-bold">Order</TableHead>
              <TableHead className="font-bold">Customer</TableHead>
              <TableHead className="font-bold">Amount</TableHead>
              <TableHead className="font-bold">Date</TableHead>
              <TableHead className="font-bold">Payment</TableHead>
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
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <p className="text-muted-foreground">No bills found</p>
                </div>
              </TableCell></TableRow>
            ) : (
              filtered.map(b => (
                <TableRow key={b._id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono font-bold">{b.billNumber}</TableCell>
                  <TableCell className="font-mono text-primary">{b.orderId?.shortId || '-'}</TableCell>
                  <TableCell><p className="font-semibold">{b.customer?.name}</p><p className="text-xs text-muted-foreground">{b.customer?.phone}</p></TableCell>
                  <TableCell className="font-bold">৳{b.amount?.toLocaleString()}</TableCell>
                  <TableCell className="text-sm">{b.createdAt ? format(new Date(b.createdAt), 'dd MMM yyyy') : '-'}</TableCell>
                  <TableCell><Badge variant={b.paymentStatus === 'paid' ? 'default' : 'secondary'}>{b.paymentStatus || 'pending'}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 hover:text-primary"
                      onClick={() => generateBillPDF(b, {}, 'print')}
                    >
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
