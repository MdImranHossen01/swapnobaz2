'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Printer, RefreshCw, ArrowLeft, TrendingUp, TrendingDown, Search } from 'lucide-react';
import Link from 'next/link';

export default function ProductSalesReportPage() {
  const [view, setView] = useState<'top' | 'low'>('top');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/product-sales?view=${view}&limit=50`);
      if (res.ok) {
        const json = await res.json();
        setItems(json.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch product sales report:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [view]);

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
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {view === 'top' ? 'Top Sales Item Report' : 'Low Sales / Slow-Moving Item Report'}
            </h1>
          </div>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">
            {view === 'top' 
              ? 'Ranked list of best-selling products by quantity and revenue generated.' 
              : 'Products with lowest or zero sales to assist inventory clearance decisions.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-muted/50 rounded-lg p-1 border">
            <button
              onClick={() => setView('top')}
              className={`text-xs px-3 py-1.5 rounded-md font-bold transition-colors flex items-center gap-1 ${
                view === 'top' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Top Sales
            </button>
            <button
              onClick={() => setView('low')}
              className={`text-xs px-3 py-1.5 rounded-md font-bold transition-colors flex items-center gap-1 ${
                view === 'low' ? 'bg-rose-600 text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <TrendingDown className="h-3.5 w-3.5" />
              Low Sales
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={fetchProducts} disabled={loading} className="h-9">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>

          <Button variant="default" size="sm" onClick={handlePrint} className="h-9 gap-1 font-semibold">
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </Button>
        </div>
      </div>

      {/* Printable Report Header */}
      <div className="hidden print:block text-center border-b pb-4 mb-6">
        <h2 className="text-2xl font-bold uppercase tracking-wider">Swapnobaz E-Commerce</h2>
        <h3 className="text-lg font-semibold text-slate-700">
          {view === 'top' ? 'Top Sales Item Report' : 'Low Sales Item Report'}
        </h3>
      </div>

      {/* Report Table Card */}
      <Card className="shadow-xs overflow-hidden print:border-none print:shadow-none">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm text-center border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b text-muted-foreground font-semibold">
                  <th className="p-2.5 text-left font-bold text-foreground">Rank</th>
                  <th className="p-2.5 text-left font-bold text-foreground">Item Name</th>
                  <th className="p-2.5 font-bold text-foreground">Barcode / SKU</th>
                  <th className="p-2.5 font-bold text-emerald-600">Qty Sold</th>
                  {view === 'top' && (
                    <th className="p-2.5 font-bold text-primary text-right">Total Revenue</th>
                  )}
                  <th className="p-2.5 font-bold text-muted-foreground text-right">Current Stock</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Loading product sales report...</span>
                      </div>
                    </td>
                  </tr>
                ) : items.length > 0 ? (
                  items.map((item: any, idx: number) => (
                    <tr key={item._id} className="border-b border-muted/30 hover:bg-muted/30 transition-colors">
                      <td className="p-2.5 text-left font-bold text-muted-foreground">{idx + 1}</td>
                      <td className="p-2.5 text-left font-semibold text-foreground">{item.itemName}</td>
                      <td className="p-2.5 font-mono text-xs text-muted-foreground">{item.sku}</td>
                      <td className="p-2.5 font-bold text-foreground">
                        <span className={item.soldQty > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                          {item.soldQty} pcs
                        </span>
                      </td>
                      {view === 'top' && (
                        <td className="p-2.5 font-bold text-right text-primary">
                          ৳{Math.round(item.totalRevenue || 0).toLocaleString()}
                        </td>
                      )}
                      <td className="p-2.5 font-medium text-right text-foreground">
                        {item.stock ?? 'N/A'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground">No items recorded.</td>
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
