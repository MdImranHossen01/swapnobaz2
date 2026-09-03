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
import { Loader2, Check, X, ShieldAlert, Edit, Store, Search, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';

export default function AdminResellersPage() {
  const [resellers, setResellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingReseller, setEditingReseller] = useState<any | null>(null);
  const [commissionRate, setCommissionRate] = useState<number>(10);
  const [updating, setUpdating] = useState(false);

  const fetchResellers = async () => {
    try {
      const res = await fetch('/api/admin/resellers');
      if (res.ok) {
        const data = await res.json();
        setResellers(data.resellers || []);
      }
    } catch {
      toast.error('রিসেলার তালিকা লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResellers();
  }, []);

  const handleStatusChange = async (resellerId: string, status: 'active' | 'suspended', name: string) => {
    const actionText = status === 'active' ? 'অনুমোদন' : 'স্থগিত';
    const confirmResult = await Swal.fire({
      title: 'আপনি কি নিশ্চিত?',
      text: `আপনি কি "${name}" স্টোরটি ${actionText} করতে চান?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'হ্যাঁ',
      cancelButtonText: 'না',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
    });

    if (!confirmResult.isConfirmed) return;

    try {
      const res = await fetch('/api/admin/resellers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resellerId, status }),
      });
      if (res.ok) {
        toast.success(`সফলভাবে ${actionText} করা হয়েছে`);
        fetchResellers();
      } else {
        const err = await res.json();
        toast.error(err.error || 'সমস্যা হয়েছে');
      }
    } catch {
      toast.error('নেটওয়ার্ক ত্রুটি');
    }
  };

  const handleUpdateCommission = async () => {
    if (!editingReseller) return;
    setUpdating(true);
    try {
      const res = await fetch('/api/admin/resellers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resellerId: editingReseller._id, commissionRate }),
      });
      if (res.ok) {
        toast.success('কমিশন রেট আপডেট হয়েছে');
        setEditingReseller(null);
        fetchResellers();
      } else {
        const err = await res.json();
        toast.error(err.error || 'সমস্যা হয়েছে');
      }
    } catch {
      toast.error('নেটওয়ার্ক ত্রুটি');
    } finally {
      setUpdating(false);
    }
  };

  const statusBadgeColor: Record<string, string> = {
    active: 'bg-green-500/10 text-green-600 border-green-500/20',
    pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    suspended: 'bg-red-500/10 text-red-600 border-red-500/20',
  };

  const filtered = resellers.filter(r =>
    r.storeName.toLowerCase().includes(search.toLowerCase()) ||
    r.subdomain.toLowerCase().includes(search.toLowerCase()) ||
    r.userId?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-4 px-0 py-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">রিসেলার স্টোর সমূহ</h1>
          <p className="text-sm text-muted-foreground">সব রিসেলার স্টোর এবং তাদের কমিশন রেট এখানে পরিচালনা করুন</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="স্টোর, ডোমেন বা মালিকের নাম..."
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
              <Store className="h-16 w-16 mx-auto mb-4" />
              <p>কোনো রিসেলার স্টোর খুঁজে পাওয়া যায়নি</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>স্টোরের নাম</TableHead>
                  <TableHead>সাবডোমেন</TableHead>
                  <TableHead>মালিক</TableHead>
                  <TableHead>কমিশন রেট</TableHead>
                  <TableHead>মোট অর্ডার</TableHead>
                  <TableHead>মোট রেভিনিউ</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead className="text-right">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(r => (
                  <TableRow key={r._id}>
                    <TableCell className="font-bold">{r.storeName}</TableCell>
                    <TableCell>
                      <a
                        href={`https://${r.subdomain}.swapnobaz.com`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        {r.subdomain}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{r.userId?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{r.contact?.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>{r.commissionRate}%</TableCell>
                    <TableCell>{r.totalOrders}</TableCell>
                    <TableCell>৳{r.totalRevenue?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusBadgeColor[r.status] || ''}>
                        {r.status === 'active' ? 'সক্রিয়' : r.status === 'pending' ? 'অনুমোদন পেন্ডিং' : 'স্থগিত'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingReseller(r);
                          setCommissionRate(r.commissionRate);
                        }}
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" />কমিশন
                      </Button>
                      {r.status === 'pending' && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleStatusChange(r._id, 'active', r.storeName)}
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />অনুমোদন
                        </Button>
                      )}
                      {r.status === 'active' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleStatusChange(r._id, 'suspended', r.storeName)}
                        >
                          <ShieldAlert className="h-3.5 w-3.5 mr-1" />স্থগিত
                        </Button>
                      )}
                      {r.status === 'suspended' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(r._id, 'active', r.storeName)}
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />সক্রিয়
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Commission Modal */}
      <Dialog open={editingReseller !== null} onOpenChange={open => !open && setEditingReseller(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>কমিশন রেট আপডেট</DialogTitle>
            <DialogDescription>
              {editingReseller?.storeName} স্টোরের জন্য প্ল্যাটফর্ম কমিশন রেট নির্ধারণ করুন।
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <Label>কমিশন রেট (%)</Label>
              <Input
                type="number"
                value={commissionRate}
                onChange={e => setCommissionRate(Number(e.target.value))}
                min={0}
                max={100}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingReseller(null)} disabled={updating}>বাতিল</Button>
            <Button onClick={handleUpdateCommission} disabled={updating}>
              {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              সংরক্ষণ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
