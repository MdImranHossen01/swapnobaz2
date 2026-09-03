'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Check, X, CreditCard, Search, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { format } from 'date-fns';

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [processingTransaction, setProcessingTransaction] = useState<any | null>(null);
  const [payoutReference, setPayoutReference] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPayouts = async () => {
    try {
      const res = await fetch('/api/admin/payouts');
      if (res.ok) {
        const data = await res.json();
        setPayouts(data.payouts || []);
      }
    } catch {
      toast.error('পেআউট তথ্য লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  const handleProcessPayout = async (action: 'approve' | 'reject', transaction: any = processingTransaction) => {
    if (!transaction) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/payouts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: transaction._id,
          action,
          payoutReference: action === 'approve' ? payoutReference : undefined,
        }),
      });
      if (res.ok) {
        toast.success(action === 'approve' ? 'পেআউট সফলভাবে পরিশোধিত হয়েছে' : 'পেআউট বাতিল ও রিফান্ড করা হয়েছে');
        setProcessingTransaction(null);
        setPayoutReference('');
        fetchPayouts();
      } else {
        const err = await res.json();
        toast.error(err.error || 'সমস্যা হয়েছে');
      }
    } catch {
      toast.error('নেটওয়ার্ক ত্রুটি');
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadgeColor: Record<string, string> = {
    cleared: 'bg-green-500/10 text-green-600 border-green-500/20',
    pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    failed: 'bg-red-500/10 text-red-600 border-red-500/20',
  };

  const filtered = payouts.filter(p =>
    p.resellerId?.storeName?.toLowerCase().includes(search.toLowerCase()) ||
    p.payoutReference?.toLowerCase().includes(search.toLowerCase()) ||
    p.payoutMethod?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-4 px-0 py-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">পেআউট অনুরোধ সমূহ</h1>
          <p className="text-sm text-muted-foreground">রিসেলারদের সকল পেআউট অনুরোধ ও পেমেন্ট রেকর্ড পরিচালনা করুন</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="স্টোর নাম, মেথড বা রেফারেন্স..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <CreditCard className="h-16 w-16 mx-auto mb-4" />
              <p>কোনো পেআউট অনুরোধ পাওয়া যায়নি</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>তারিখ</TableHead>
                  <TableHead>রিসেলার স্টোর</TableHead>
                  <TableHead>মালিক</TableHead>
                  <TableHead>পরিমাণ</TableHead>
                  <TableHead>পদ্ধতি</TableHead>
                  <TableHead>হিসাব নম্বর / রেফারেন্স</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead className="text-right">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(p => (
                  <TableRow key={p._id}>
                    <TableCell>{format(new Date(p.createdAt), 'dd MMM yyyy, hh:mm a')}</TableCell>
                    <TableCell className="font-bold">{p.resellerId?.storeName || 'Deleted Store'}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{p.resellerId?.userId?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{p.resellerId?.userId?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-black text-red-600">৳{Math.abs(p.amount).toLocaleString()}</TableCell>
                    <TableCell className="capitalize font-bold">{p.payoutMethod}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{p.payoutReference}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusBadgeColor[p.status] || ''}>
                        {p.status === 'cleared' ? 'পরিশোধিত' : p.status === 'pending' ? 'পেন্ডিং' : 'বাতিল'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {p.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              setProcessingTransaction(p);
                              setPayoutReference('');
                            }}
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />পেমেন্ট রিলিজ
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={async () => {
                              const result = await Swal.fire({
                                title: 'অনুরোধটি বাতিল করতে চান?',
                                text: 'বাতিল করলে টাকা রিসেলারের ওয়ালেটে ফেরত যাবে।',
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonColor: '#d33',
                                cancelButtonColor: '#3085d6',
                                confirmButtonText: 'হ্যাঁ, বাতিল করুন',
                                cancelButtonText: 'ফিরে যান'
                              });
                              if (result.isConfirmed) {
                                handleProcessPayout('reject', p);
                              }
                            }}
                          >
                            <X className="h-3.5 w-3.5 mr-1" />বাতিল
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payout Approval Dialog */}
      <Dialog open={processingTransaction !== null && processingTransaction.status === 'pending'} onOpenChange={open => !open && setProcessingTransaction(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>পেমেন্ট রিলিজ নিশ্চিতকরণ</DialogTitle>
            <DialogDescription>
              রিসেলারকে পেমেন্ট পাঠানোর পর প্রাপ্ত ট্রানজেকশন আইডি বা রেফারেন্স নম্বর এখানে সংরক্ষণ করুন।
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <Label>পেমেন্ট মেথড</Label>
              <Input value={processingTransaction?.payoutMethod?.toUpperCase()} disabled />
            </div>
            <div className="space-y-1">
              <Label>হিসাব নম্বর</Label>
              <Input value={processingTransaction?.payoutReference} disabled />
            </div>
            <div className="space-y-1">
              <Label>পরিমাণ (৳)</Label>
              <Input value={Math.abs(processingTransaction?.amount || 0)} disabled />
            </div>
            <div className="space-y-1">
              <Label>ট্রানজেকশন আইডি / পেমেন্ট রেফারেন্স</Label>
              <Input
                placeholder="যেমন: TRXXXXXXXX"
                value={payoutReference}
                onChange={e => setPayoutReference(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProcessingTransaction(null)} disabled={submitting}>বাতিল</Button>
            <Button onClick={() => handleProcessPayout('approve')} disabled={submitting || !payoutReference}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              পরিশোধ সম্পন্ন করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
