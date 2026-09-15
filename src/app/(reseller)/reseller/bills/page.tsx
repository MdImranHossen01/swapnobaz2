'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Loader2, Search, RefreshCcw, FileText, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { generateBillPDF } from '@/lib/bill-invoice-generator';

const ITEMS_PER_PAGE = 10;

export default function ResellerBillsPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchBills = async () => {
    setLoading(true);
    const res = await fetch('/api/reseller/bills');
    if (res.ok) setBills((await res.json()).bills || []);
    else toast.error('Failed to fetch bills');
    setLoading(false);
  };

  useEffect(() => { fetchBills(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return bills;
    return bills.filter(b => JSON.stringify(b).toLowerCase().includes(search.toLowerCase()));
  }, [bills, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginatedBills = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="flex-1 space-y-4 px-0 py-2 md:p-8 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 md:px-0">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Client Bills</h2>
          <p className="text-xs md:text-sm text-muted-foreground">View and print invoices for your customers</p>
        </div>
        <Button variant="outline" size="sm" className="h-9 self-start sm:self-auto" onClick={fetchBills} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
        </Button>
      </div>

      <div className="relative flex-1 max-w-sm px-1 md:px-0">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search bills..." className="pl-8 h-9 text-xs md:text-sm" value={search} onChange={handleSearchChange} />
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
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
              ) : paginatedBills.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">{search ? 'No matching bills found' : 'No bills found'}</p>
                  </div>
                </TableCell></TableRow>
              ) : (
                paginatedBills.map(b => (
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

        {/* Mobile Card View */}
        <div className="block md:hidden p-2 space-y-2.5">
          {loading ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
              Loading bills...
            </div>
          ) : paginatedBills.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              {search ? 'No matching bills found' : 'No bills found'}
            </div>
          ) : (
            paginatedBills.map(b => (
              <div key={b._id} className="p-3 bg-card border rounded-lg shadow-sm space-y-2">
                <div className="flex items-start justify-between gap-2 border-b pb-2">
                  <div>
                    <span className="font-mono font-bold text-xs text-foreground block">{b.billNumber}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {b.createdAt ? format(new Date(b.createdAt), 'dd MMM yyyy') : '-'}
                    </span>
                  </div>
                  <Badge variant={b.paymentStatus === 'paid' ? 'default' : 'secondary'} className="text-[9px] px-1.5 py-0">
                    {b.paymentStatus || 'pending'}
                  </Badge>
                </div>

                <div className="flex items-start justify-between text-xs">
                  <div>
                    <p className="font-semibold">{b.customer?.name}</p>
                    <p className="text-[11px] text-muted-foreground">{b.customer?.phone}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground block">Order: {b.orderId?.shortId || '-'}</span>
                    <span className="font-bold text-sm text-foreground">৳{b.amount?.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-1 border-t">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-7 text-xs px-2.5"
                    onClick={() => generateBillPDF(b, {}, 'print')}
                  >
                    <Printer className="h-3 w-3 mr-1" /> Print Bill
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of{' '}
              {filtered.length} bills
            </p>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
