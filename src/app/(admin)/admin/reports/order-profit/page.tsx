'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Printer, RefreshCw, ArrowLeft, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function OrderProfitReportPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '25',
        search: debouncedSearch,
        ...(dateRange.from && { from: dateRange.from }),
        ...(dateRange.to && { to: dateRange.to })
      });
      const res = await fetch(`/api/admin/reports/order-profit?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setOrders(json.orders || []);
        setTotalPages(json.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch order profit report:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, dateRange.from, dateRange.to]);

  useEffect(() => {
    fetchOrders();
  }, [page, debouncedSearch, dateRange]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 space-y-6 px-0 py-4 md:p-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/admin/dashboard" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Invoice Wise Profit Report</h1>
          </div>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">
            Track individual order sales, delivery cost, COGS and net gross profit.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchOrders} disabled={loading} className="h-9">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>

          <Button variant="default" size="sm" onClick={handlePrint} className="h-9 gap-1 font-semibold">
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between print:hidden">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoice or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
            className="h-9 text-xs w-36"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <Input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
            className="h-9 text-xs w-36"
          />
        </div>
      </div>

      {/* Printable Report Header */}
      <div className="hidden print:block text-center border-b pb-4 mb-6">
        <h2 className="text-2xl font-bold uppercase tracking-wider">Swapnobaz E-Commerce</h2>
        <h3 className="text-lg font-semibold text-slate-700">Invoice Wise Profit Report</h3>
      </div>

      {/* Report Table Card */}
      <Card className="shadow-xs overflow-hidden print:border-none print:shadow-none">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm text-center border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b text-muted-foreground font-semibold">
                  <th className="p-2.5 text-left font-bold text-foreground">Date</th>
                  <th className="p-2.5 font-bold text-foreground">Invoice No</th>
                  <th className="p-2.5 text-left font-bold text-foreground">Customer</th>
                  <th className="p-2.5 font-bold text-emerald-600">Net Sales</th>
                  <th className="p-2.5 font-bold text-slate-600">Delivery</th>
                  <th className="p-2.5 font-bold text-foreground">Total</th>
                  <th className="p-2.5 font-bold text-muted-foreground">Purchase/COGS</th>
                  <th className="p-2.5 font-bold text-primary text-right">Profit / Loss</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Loading profit report...</span>
                      </div>
                    </td>
                  </tr>
                ) : orders.length > 0 ? (
                  orders.map((order: any) => (
                    <tr key={order._id} className="border-b border-muted/30 hover:bg-muted/30 transition-colors">
                      <td className="p-2.5 text-left text-muted-foreground">
                        {new Date(order.date).toLocaleDateString()}
                      </td>
                      <td className="p-2.5 font-medium text-foreground">
                        <Link href={`/admin/orders`} className="hover:underline text-primary">
                          {order.invoiceNo}
                        </Link>
                      </td>
                      <td className="p-2.5 text-left">
                        <div className="font-semibold text-foreground">{order.customerName}</div>
                        {order.customerPhone && (
                          <div className="text-[11px] text-muted-foreground">{order.customerPhone}</div>
                        )}
                      </td>
                      <td className="p-2.5 font-medium text-emerald-600">৳{Math.round(order.netSales).toLocaleString()}</td>
                      <td className="p-2.5 text-muted-foreground">৳{Math.round(order.deliveryCost).toLocaleString()}</td>
                      <td className="p-2.5 font-bold text-foreground">৳{Math.round(order.total).toLocaleString()}</td>
                      <td className="p-2.5 text-muted-foreground">৳{Math.round(order.purchasePrice).toLocaleString()}</td>
                      <td className={`p-2.5 font-bold text-right ${order.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        ৳{Math.round(order.profit).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-muted-foreground">No orders found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-4 border-t">
              <div className="text-xs text-muted-foreground">
                Page <span className="font-semibold text-foreground">{page}</span> of <span className="font-semibold text-foreground">{totalPages}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
