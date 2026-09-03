'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { Loader2, Search, ArrowUpDown, ShieldAlert, Package, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminWarehousePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [adjustingItem, setAdjustingItem] = useState<{ product: any; variant?: any } | null>(null);
  const [adjustmentValue, setAdjustmentValue] = useState<number>(0);
  const [adjustmentType, setAdjustmentType] = useState<'inc' | 'set'>('inc');
  const [adjustmentReason, setAdjustmentReason] = useState('Restock');
  const [updating, setUpdating] = useState(false);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products?limit=100');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch {
      toast.error('পণ্য তালিকা লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAdjustStock = async () => {
    if (!adjustingItem) return;
    setUpdating(true);
    try {
      const res = await fetch('/api/admin/warehouse/stock-adjustment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: adjustingItem.product._id,
          variantId: adjustingItem.variant?._id || undefined,
          quantity: adjustmentValue,
          type: adjustmentType,
          reason: adjustmentReason,
        }),
      });

      if (res.ok) {
        toast.success('স্টক সফলভাবে আপডেট করা হয়েছে');
        setAdjustingItem(null);
        fetchProducts();
      } else {
        const err = await res.json();
        toast.error(err.error || 'স্টক আপডেট করতে ব্যর্থ');
      }
    } catch {
      toast.error('নেটওয়ার্ক ত্রুটি');
    } finally {
      setUpdating(false);
    }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-4 px-0 py-4 md:p-8 font-sans">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">গুদাম ও ইনভেন্টরি কন্ট্রোল</h1>
        <p className="text-sm text-muted-foreground">গুদামের পণ্যের স্টক লেভেল পর্যবেক্ষণ ও সমন্বয় করুন</p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="পণ্য বা SKU দিয়ে খুঁজুন..."
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
              <Package className="h-16 w-16 mx-auto mb-4" />
              <p>কোনো পণ্য পাওয়া যায়নি</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>পণ্যের নাম</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>ভ্যারিয়েন্ট বিবরণ</TableHead>
                  <TableHead>স্টক লেভেল</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead className="text-right">সমন্বয়</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(p => {
                  const hasVariants = p.variants && p.variants.length > 0;
                  return (
                    <TableRow key={p._id}>
                      <TableCell className="font-semibold">{p.name}</TableCell>
                      <TableCell className="font-mono text-xs">{p.sku || 'ভ্যারিয়েন্ট SKU'}</TableCell>
                      <TableCell>
                        {hasVariants ? (
                          <div className="space-y-1">
                            {p.variants.map((v: any) => (
                              <div key={v._id} className="text-xs flex items-center justify-between border-b pb-1 last:border-0 last:pb-0">
                                <span>{v.color || 'No Color'} / {v.size || 'No Size'} ({v.sku || 'No SKU'})</span>
                                <span className="font-bold mr-4">{v.stock} pcs</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => {
                                    setAdjustingItem({ product: p, variant: v });
                                    setAdjustmentValue(0);
                                    setAdjustmentType('inc');
                                  }}
                                >
                                  স্টক এডজাস্ট
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">কোনো ভ্যারিয়েন্ট নেই</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`font-black text-sm ${p.stock <= 5 ? 'text-destructive' : 'text-green-600'}`}>
                          {p.stock} pcs
                        </span>
                      </TableCell>
                      <TableCell>
                        {p.stock <= 5 ? (
                          <span className="text-[10px] text-destructive bg-destructive/10 px-2 py-0.5 rounded font-black uppercase">Low Stock</span>
                        ) : (
                          <span className="text-[10px] text-green-600 bg-green-500/10 px-2 py-0.5 rounded font-black uppercase">In Stock</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!hasVariants && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setAdjustingItem({ product: p });
                              setAdjustmentValue(0);
                              setAdjustmentType('inc');
                            }}
                          >
                            স্টক এডজাস্ট
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Adjust Dialog */}
      <Dialog open={adjustingItem !== null} onOpenChange={open => !open && setAdjustingItem(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>ইনভেন্টরি স্টক সমন্বয়</DialogTitle>
            <DialogDescription>
              {adjustingItem?.product?.name} {adjustingItem?.variant ? `(${adjustingItem.variant.color || ''} / ${adjustingItem.variant.size || ''})` : ''} এর স্টক এডজাস্ট করুন।
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <Label>সমন্বয়ের ধরন</Label>
              <select
                value={adjustmentType}
                onChange={e => setAdjustmentType(e.target.value as 'inc' | 'set')}
                className="w-full h-10 border rounded-lg px-3 text-sm bg-background"
              >
                <option value="inc">যোগ/বিয়োগ করুন (যেমন: +১০ বা -৫)</option>
                <option value="set">সরাসরি নতুন স্টক নির্ধারণ করুন (যেমন: ৫০)</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>পরিমাণ (সংখ্যা)</Label>
              <Input
                type="number"
                value={adjustmentValue}
                onChange={e => setAdjustmentValue(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <Label>সমন্বয়ের কারণ</Label>
              <select
                value={adjustmentReason}
                onChange={e => setAdjustmentReason(e.target.value)}
                className="w-full h-10 border rounded-lg px-3 text-sm bg-background"
              >
                <option value="Restock">নতুন রি-স্টক (Restock)</option>
                <option value="Damage">ক্ষতিগ্রস্ত পণ্য (Damage)</option>
                <option value="Customer Return">গ্রাহক রিটার্ন (Return)</option>
                <option value="Audit adjustment">অডিট এবং কাউন্ট সমন্বয় (Audit)</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustingItem(null)} disabled={updating}>বাতিল</Button>
            <Button onClick={handleAdjustStock} disabled={updating}>
              {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              স্টক সেভ করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
