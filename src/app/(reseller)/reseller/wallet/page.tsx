'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Wallet, Loader2, ArrowDownCircle, Clock, TrendingUp, RefreshCcw
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function ResellerWalletPage() {
  const [reseller, setReseller] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payoutForm, setPayoutForm] = useState({ method: 'bkash', number: '', amount: 0 });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [rRes, tRes] = await Promise.all([
      fetch('/api/reseller/settings'),
      fetch('/api/reseller/wallet/transactions'),
    ]);
    if (rRes.ok) { const d = await rRes.json(); setReseller(d.reseller); setPayoutForm(f => ({ ...f, amount: d.reseller?.walletBalance || 0 })); }
    if (tRes.ok) setTransactions((await tRes.json()).transactions || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const submitPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutForm.number || payoutForm.amount <= 0) { toast.error('সঠিক তথ্য দিন'); return; }
    if (payoutForm.amount > reseller?.walletBalance) { toast.error('ব্যালেন্স অপর্যাপ্ত'); return; }
    setSubmitting(true);
    const res = await fetch('/api/reseller/payout-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payoutForm, resellerId: reseller._id }),
    });
    if (res.ok) { toast.success('পেআউট অনুরোধ পাঠানো হয়েছে!'); fetchData(); }
    else toast.error('সমস্যা হয়েছে');
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 px-0 py-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Wallet & Payouts</h2>
          <p className="text-muted-foreground">Track your earnings and request withdrawals</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}><RefreshCcw className="h-4 w-4" /></Button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Wallet className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Available Balance</p>
                <p className="text-2xl font-black text-green-600">৳{(reseller?.walletBalance ?? 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-xs text-muted-foreground">Pending Commission</p>
                <p className="text-2xl font-black text-yellow-600">৳{(reseller?.pendingBalance ?? 0).toLocaleString()}</p>
                <p className="text-[11px] text-muted-foreground">Cleared after delivery</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-black">৳{(reseller?.totalEarnings ?? 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
          <TabsTrigger value="payout">Request Payout</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">লেনদেন ইতিহাস</CardTitle></CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">কোনো লেনদেন নেই</p>
              ) : (
                <div className="space-y-2">
                  {transactions.map((t: any) => (
                    <div key={t._id} className="flex items-center justify-between py-2.5 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{t.description}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(t.createdAt), 'dd MMM yyyy, hh:mm a')}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${t.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {t.amount > 0 ? '+' : ''}৳{Math.abs(t.amount).toLocaleString()}
                        </p>
                        <Badge variant="outline" className="text-[10px]">{t.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payout" className="mt-4">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <ArrowDownCircle className="h-4 w-4 text-primary" /> Payout Request
              </CardTitle>
              <CardDescription>Withdraw your available balance to your mobile banking</CardDescription>
            </CardHeader>
            <CardContent>
              {(reseller?.walletBalance ?? 0) <= 0 ? (
                <p className="text-center text-muted-foreground py-4 text-sm">উত্তোলনযোগ্য ব্যালেন্স নেই</p>
              ) : (
                <form onSubmit={submitPayout} className="space-y-4">
                  <div className="space-y-1">
                    <Label>পেআউট পদ্ধতি</Label>
                    <select value={payoutForm.method} onChange={e => setPayoutForm(f => ({ ...f, method: e.target.value }))}
                      className="w-full h-10 border rounded-lg px-3 text-sm bg-background">
                      <option value="bkash">bKash</option>
                      <option value="nagad">Nagad</option>
                      <option value="bank">Bank Transfer</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label>Account Number</Label>
                    <Input value={payoutForm.number} onChange={e => setPayoutForm(f => ({ ...f, number: e.target.value }))} placeholder="01XXXXXXXXX" required />
                  </div>
                  <div className="space-y-1">
                    <Label>Amount (Max ৳{reseller?.walletBalance?.toLocaleString()})</Label>
                    <Input type="number" value={payoutForm.amount} max={reseller?.walletBalance}
                      onChange={e => setPayoutForm(f => ({ ...f, amount: Number(e.target.value) }))} required />
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full">
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Request Payout
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
