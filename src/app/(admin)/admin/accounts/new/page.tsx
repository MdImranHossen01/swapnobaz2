'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, ArrowLeft, Loader2, Landmark } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function AddAccountPage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [accountForm, setAccountForm] = useState({
    name: '',
    code: '',
    category: 'Bank',
    bankName: '',
    branchName: '',
    accountNumber: '',
    openingBalance: '0',
    description: ''
  });

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountForm.name || !accountForm.code) {
      toast.error('Name and Code are required');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountForm)
      });
      if (res.ok) {
        toast.success('Account created successfully');
        router.push('/admin/accounts');
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to create account');
      }
    } catch (error) {
      toast.error('Error creating account');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex-1 space-y-6 px-0 py-4 md:p-8 max-w-2xl">
      <div className="flex items-center gap-2 border-b pb-4">
        <Link href="/admin/accounts" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add Account (নতুন অ্যাকাউন্ট তৈরি)</h1>
          <p className="text-muted-foreground text-xs md:text-sm">
            Create a bank, cash, or mobile wallet (MFS) account for business cashflow tracking.
          </p>
        </div>
      </div>

      <Card className="shadow-xs">
        <CardHeader className="bg-muted/30 py-3 px-4 border-b">
          <CardTitle className="text-sm md:text-base font-bold flex items-center gap-2">
            <Landmark className="h-4 w-4 text-primary" /> Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <form onSubmit={handleCreateAccount} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs">Account Name *</Label>
              <Input
                required
                placeholder="e.g. City Bank Primary / Bkash Merchant"
                value={accountForm.name}
                onChange={(e) => setAccountForm(prev => ({ ...prev, name: e.target.value }))}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Account Code *</Label>
                <Input
                  required
                  placeholder="e.g. BANK_CITY_01"
                  value={accountForm.code}
                  onChange={(e) => setAccountForm(prev => ({ ...prev, code: e.target.value }))}
                  className="h-9 text-xs font-mono uppercase"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Account Type *</Label>
                <Select
                  value={accountForm.category}
                  onValueChange={(val) => val && setAccountForm(prev => ({ ...prev, category: val }))}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bank" className="text-xs">Bank Account</SelectItem>
                    <SelectItem value="Cash" className="text-xs">Cash in Hand</SelectItem>
                    <SelectItem value="MFS" className="text-xs">Mobile Wallet (MFS)</SelectItem>
                    <SelectItem value="Other" className="text-xs">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {accountForm.category === 'Bank' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Bank Name</Label>
                  <Input
                    placeholder="e.g. City Bank"
                    value={accountForm.bankName}
                    onChange={(e) => setAccountForm(prev => ({ ...prev, bankName: e.target.value }))}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Branch Name</Label>
                  <Input
                    placeholder="e.g. Gulshan Branch"
                    value={accountForm.branchName}
                    onChange={(e) => setAccountForm(prev => ({ ...prev, branchName: e.target.value }))}
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Account Number / Phone</Label>
                <Input
                  placeholder="e.g. 11029384759"
                  value={accountForm.accountNumber}
                  onChange={(e) => setAccountForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                  className="h-9 text-xs font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Opening Balance (৳)</Label>
                <Input
                  type="number"
                  min="0"
                  value={accountForm.openingBalance}
                  onChange={(e) => setAccountForm(prev => ({ ...prev, openingBalance: e.target.value }))}
                  className="h-9 text-xs text-right"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Description / Note</Label>
              <Input
                placeholder="Optional notes about this account"
                value={accountForm.description}
                onChange={(e) => setAccountForm(prev => ({ ...prev, description: e.target.value }))}
                className="h-9 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Link href="/admin/accounts">
                <Button type="button" variant="outline" size="sm">Cancel</Button>
              </Link>
              <Button type="submit" size="sm" disabled={creating} className="font-bold">
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Save Account
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
