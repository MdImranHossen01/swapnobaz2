'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Printer, RefreshCw, ArrowLeft, Search, Store } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function ResellerSalesReportPage() {
  const [resellers, setResellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchResellers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      const res = await fetch(`/api/admin/reports/reseller-sales?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setResellers(json.resellers || []);
      }
    } catch (error) {
      console.error('Failed to fetch reseller sales report:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResellers();
  }, [debouncedSearch]);

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
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Reseller Sales & Performance Report</h1>
          </div>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">
            Track individual drop-shipping reseller sales volumes, processed orders and earned commission.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchResellers} disabled={loading} className="h-9">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>

          <Button variant="default" size="sm" onClick={handlePrint} className="h-9 gap-1 font-semibold">
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center justify-between print:hidden">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search store name or subdomain..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Printable Report Header */}
      <div className="hidden print:block text-center border-b pb-4 mb-6">
        <h2 className="text-2xl font-bold uppercase tracking-wider">Swapnobaz E-Commerce</h2>
        <h3 className="text-lg font-semibold text-slate-700">Reseller Sales & Performance Report</h3>
      </div>

      {/* Report Table Card */}
      <Card className="shadow-xs overflow-hidden print:border-none print:shadow-none">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm text-center border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b text-muted-foreground font-semibold">
                  <th className="p-2.5 text-left font-bold text-foreground">Reseller Store</th>
                  <th className="p-2.5 text-left font-bold text-foreground">Owner</th>
                  <th className="p-2.5 font-bold text-foreground">Total Orders</th>
                  <th className="p-2.5 font-bold text-emerald-600">Delivered</th>
                  <th className="p-2.5 font-bold text-primary">Sales Volume</th>
                  <th className="p-2.5 font-bold text-muted-foreground">Comm. Rate</th>
                  <th className="p-2.5 font-bold text-amber-600">Earned Commission</th>
                  <th className="p-2.5 font-bold text-foreground text-right">Wallet Balance</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Loading reseller report...</span>
                      </div>
                    </td>
                  </tr>
                ) : resellers.length > 0 ? (
                  resellers.map((r: any) => (
                    <tr key={r._id} className="border-b border-muted/30 hover:bg-muted/30 transition-colors">
                      <td className="p-2.5 text-left">
                        <div className="font-bold text-foreground flex items-center gap-1.5">
                          <Store className="h-3.5 w-3.5 text-primary" />
                          {r.storeName}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono">{r.subdomain}.swapnobaz.com</div>
                      </td>
                      <td className="p-2.5 text-left">
                        <div className="font-medium text-foreground">{r.ownerName}</div>
                        {r.ownerPhone && <div className="text-[11px] text-muted-foreground">{r.ownerPhone}</div>}
                      </td>
                      <td className="p-2.5 font-bold text-foreground">{r.totalOrders}</td>
                      <td className="p-2.5 font-bold text-emerald-600">{r.deliveredOrders}</td>
                      <td className="p-2.5 font-bold text-primary">৳{Math.round(r.totalSales).toLocaleString()}</td>
                      <td className="p-2.5 font-semibold text-muted-foreground">{r.commissionRate}%</td>
                      <td className="p-2.5 font-bold text-amber-600">৳{Math.round(r.earnedCommission).toLocaleString()}</td>
                      <td className="p-2.5 font-bold text-right text-foreground">৳{Math.round(r.walletBalance).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-muted-foreground">No reseller records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
