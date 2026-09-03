'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, TrendingDown, RefreshCcw, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function ResellerExpensesPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpenses: 0, netProfit: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch('/api/reseller/expenses-incomes');
    if (res.ok) {
      const d = await res.json();
      setEntries(d.entries || []);
      setSummary(d.summary || { totalIncome: 0, totalExpenses: 0, netProfit: 0 });
    } else toast.error('Failed to fetch data');
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="flex-1 space-y-4 px-0 py-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Expenses & Incomes</h2>
          <p className="text-muted-foreground">Track your store's financial performance</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-green-600" /><p className="text-sm text-muted-foreground">Total Income</p></div>
            <p className="text-2xl font-black text-green-600 mt-1">৳{summary.totalIncome.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2"><TrendingDown className="h-5 w-5 text-red-600" /><p className="text-sm text-muted-foreground">Total Expenses</p></div>
            <p className="text-2xl font-black text-red-600 mt-1">৳{summary.totalExpenses.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /><p className="text-sm text-muted-foreground">Net Profit</p></div>
            <p className={`text-2xl font-black mt-1 ${summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>৳{summary.netProfit.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold">Date</TableHead>
              <TableHead className="font-bold">Type</TableHead>
              <TableHead className="font-bold">Description</TableHead>
              <TableHead className="font-bold text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="h-40 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              </TableCell></TableRow>
            ) : entries.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="h-40 text-center text-muted-foreground">
                No entries found
              </TableCell></TableRow>
            ) : (
              entries.map(e => (
                <TableRow key={e._id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="text-sm">{e.date ? format(new Date(e.date), 'dd MMM yyyy') : '-'}</TableCell>
                  <TableCell><Badge variant={e.type === 'income' ? 'default' : 'secondary'}>{e.type}</Badge></TableCell>
                  <TableCell>{e.description}</TableCell>
                  <TableCell className={`text-right font-bold ${e.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {e.type === 'income' ? '+' : '-'}৳{e.amount?.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
