/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp, ShoppingBag, Wallet, Clock, ArrowUpRight,
  Loader2, Store, ExternalLink, Copy, RefreshCcw,
  Package, Tag, FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';

export default function StorefrontResellerDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    fetch('/api/reseller/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const copyLink = () => {
    if (data?.storeUrl) {
      navigator.clipboard.writeText(data.storeUrl);
      toast.success('Store link copied!');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = [
    { label: 'Total Revenue', value: `৳${(data?.totalRevenue || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'Total Orders', value: data?.totalOrders || 0, icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: 'Wallet Balance', value: `৳${(data?.walletBalance || 0).toLocaleString()}`, icon: Wallet, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-950/30' },
    { label: 'Pending Orders', value: data?.pendingOrders || 0, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/30' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back! Here&apos;s your store overview.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
          <RefreshCcw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Store URL Card */}
      {data?.storeUrl && (
        <Card className="border-dashed">
          <CardContent className="flex items-center gap-3 py-4">
            <Store className="h-5 w-5 text-primary shrink-0" />
            <span className="text-sm text-muted-foreground flex-1 truncate">{data.storeUrl}</span>
            <Button variant="ghost" size="icon" onClick={copyLink} className="h-8 w-8 shrink-0">
              <Copy className="h-4 w-4" />
            </Button>
            <a href={data.storeUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.bg} shrink-0`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{s.label}</p>
                <p className="text-xl font-bold truncate">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/reseller-dashboard/orders">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <span className="font-medium text-sm">Manage Orders</span>
              <ArrowUpRight className="h-4 w-4 ml-auto text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/reseller-dashboard/products">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <Package className="h-5 w-5 text-primary" />
              <span className="font-medium text-sm">My Products</span>
              <ArrowUpRight className="h-4 w-4 ml-auto text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/reseller-dashboard/wallet">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <Wallet className="h-5 w-5 text-primary" />
              <span className="font-medium text-sm">Wallet & Payouts</span>
              <ArrowUpRight className="h-4 w-4 ml-auto text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Orders */}
      {data?.recentOrders?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" /> Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.recentOrders.map((order: any) => (
              <div key={order._id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                <div>
                  <p className="font-medium">#{order.orderId || order._id?.slice(-6).toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground">{order.createdAt ? format(new Date(order.createdAt), 'dd MMM yyyy') : '-'}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">৳{order.totalAmount?.toLocaleString()}</p>
                  <Badge variant="outline" className="text-xs">{order.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
