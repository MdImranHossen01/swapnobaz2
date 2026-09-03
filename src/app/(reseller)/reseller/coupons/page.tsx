'use client';

import { useState, useEffect } from 'react';
import {
  Plus, Search, Edit, Trash2, Tag, Calendar, Users, Loader2, MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Swal from 'sweetalert2';

function ResellerCouponForm({ initialData, onSuccess }: { initialData?: any; onSuccess: () => void }) {
  const [form, setForm] = useState({
    code: initialData?.code || '',
    discountType: initialData?.discountType || 'percentage',
    discountValue: initialData?.discountValue || 10,
    minPurchase: initialData?.minPurchase || 0,
    expiryDate: initialData?.expiryDate
      ? new Date(initialData.expiryDate).toISOString().split('T')[0]
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    usageLimit: initialData?.usageLimit || '',
    isActive: initialData?.isActive ?? true,
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.discountValue) { toast.error('Code and discount value required'); return; }
    setLoading(true);
    const res = await fetch('/api/reseller/coupons', {
      method: initialData ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(initialData ? { ...form, id: initialData._id } : form),
    });
    if (res.ok) {
      toast.success(initialData ? 'Coupon updated' : 'Coupon created');
      onSuccess();
    } else {
      const d = await res.json();
      toast.error(d.error || 'Failed');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={submit} className="space-y-4 py-2">
      <div className="space-y-1">
        <Label>Coupon Code</Label>
        <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="SAVE20" className="font-mono" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Discount Type</Label>
          <select value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))} className="w-full h-10 border rounded-lg px-3 text-sm bg-background">
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed Amount (৳)</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label>Discount Value</Label>
          <Input type="number" value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: Number(e.target.value) }))} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Min Purchase (৳)</Label>
          <Input type="number" value={form.minPurchase} onChange={e => setForm(f => ({ ...f, minPurchase: Number(e.target.value) }))} />
        </div>
        <div className="space-y-1">
          <Label>Usage Limit (blank = unlimited)</Label>
          <Input type="number" value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))} placeholder="∞" />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Expiry Date</Label>
        <Input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} required />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {initialData ? 'Update Coupon' : 'Create Coupon'}
      </Button>
    </form>
  );
}

export default function ResellerCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/reseller/coupons');
      if (res.ok) setCoupons((await res.json()).coupons || []);
      else toast.error('Failed to fetch coupons');
    } catch { toast.error('Failed to fetch coupons'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Delete Coupon?',
      text: 'Are you sure you want to delete this coupon? This cannot be undone.',
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', confirmButtonText: 'Yes, delete it!',
      customClass: { popup: 'rounded-xl' },
    });
    if (!result.isConfirmed) return;
    const res = await fetch(`/api/reseller/coupons?id=${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Coupon deleted'); fetchCoupons(); }
    else toast.error('Failed to delete');
  };

  const filtered = coupons.filter(c => (c.code || '').toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex-1 space-y-4 px-0 py-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Coupons</h2>
          <p className="text-muted-foreground">Manage discount codes for your store.</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger render={
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> Add Coupon
            </Button>
          } />
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Coupon</DialogTitle>
              <DialogDescription>Fill in the details to create a new discount code.</DialogDescription>
            </DialogHeader>
            <ResellerCouponForm onSuccess={() => { setIsAddDialogOpen(false); fetchCoupons(); }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by coupon code..." className="pl-8" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold">Code</TableHead>
              <TableHead className="font-bold">Discount</TableHead>
              <TableHead className="font-bold">Min Purchase</TableHead>
              <TableHead className="font-bold">Expiry</TableHead>
              <TableHead className="font-bold">Usage</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="text-right font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="h-24 text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
              </TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                No coupons found.
              </TableCell></TableRow>
            ) : (
              filtered.map(coupon => (
                <TableRow key={coupon._id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-primary" />
                      <span className="font-bold">{coupon.code}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `৳${coupon.discountValue}`}
                  </TableCell>
                  <TableCell>৳{coupon.minPurchase}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs">
                      <Calendar className="h-3 w-3" />
                      {new Date(coupon.expiryDate).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs">
                      <Users className="h-3 w-3" />
                      {coupon.usedCount} / {coupon.usageLimit || '∞'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={coupon.isActive ? 'default' : 'secondary'}>
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      } />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingCoupon(coupon)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(coupon._id)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingCoupon} onOpenChange={() => setEditingCoupon(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Coupon</DialogTitle>
            <DialogDescription>Update the coupon details below.</DialogDescription>
          </DialogHeader>
          {editingCoupon && (
            <ResellerCouponForm initialData={editingCoupon} onSuccess={() => { setEditingCoupon(null); fetchCoupons(); }} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
