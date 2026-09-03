'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { CalendarDays, AlertTriangle, ArrowRight, Edit } from 'lucide-react';
import Link from 'next/link';

interface ExpiringBatch {
  id: string;
  productId: string;
  name: string;
  color: string | null;
  size: string | null;
  batchNumber: string;
  expiryDate: string;
  stock: number;
}

export default function UpcomingExpiryPage() {
  const [batches, setBatches] = useState<ExpiringBatch[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUpcomingExpiry = async () => {
    try {
      const response = await fetch('/api/products/upcoming-expiry');
      if (response.ok) {
        const data = await response.json();
        setBatches(data.batches || []);
      }
    } catch (error) {
      console.error('Error fetching upcoming expiry:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpcomingExpiry();
  }, []);

  const getDaysRemaining = (expiryDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDate);
    const diffTime = exp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 w-full max-w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-orange-500" />
            Upcoming Expiry Batches
          </h1>
          <p className="text-sm text-muted-foreground">Monitor product inventory expiring within the next 30 days</p>
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Variant / Specs</TableHead>
                <TableHead>Batch No</TableHead>
                <TableHead>Remaining Stock</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Days Left</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-40 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto rounded-lg" /></TableCell>
                  </TableRow>
                ))
              ) : batches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    No products expiring within the next 30 days.
                  </TableCell>
                </TableRow>
              ) : (
                batches.map((batch) => {
                  const daysLeft = getDaysRemaining(batch.expiryDate);
                  return (
                    <TableRow key={batch.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-bold text-sm">{batch.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {batch.color || batch.size ? (
                          <div className="flex gap-1.5 items-center">
                            {batch.color && <span className="font-medium text-foreground">{batch.color}</span>}
                            {batch.color && batch.size && <span>•</span>}
                            {batch.size && <span>{batch.size}</span>}
                          </div>
                        ) : (
                          'Main Stock'
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold">{batch.batchNumber}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-bold text-xs">
                          {batch.stock} units
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {format(new Date(batch.expiryDate), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell>
                        {daysLeft <= 0 ? (
                          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                            <AlertTriangle className="h-3 w-3" /> Expired
                          </Badge>
                        ) : daysLeft <= 7 ? (
                          <Badge variant="destructive" className="flex items-center gap-1 w-fit bg-red-600">
                            {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="flex items-center gap-1 w-fit bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200 border-orange-200">
                            {daysLeft} days left
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/products/${batch.productId}/edit`}>
                          <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs gap-1">
                            <Edit className="h-3.5 w-3.5" /> Edit
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile View */}
      <div className="block md:hidden space-y-3">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 border rounded-2xl bg-card shadow-sm space-y-2">
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-4 w-1/2 rounded" />
              </div>
            ))}
          </div>
        ) : batches.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground bg-card rounded-2xl border">
            No products expiring soon.
          </div>
        ) : (
          batches.map((batch) => {
            const daysLeft = getDaysRemaining(batch.expiryDate);
            return (
              <div key={batch.id} className="p-4 border rounded-2xl bg-card shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-sm">{batch.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Batch: <span className="font-mono font-semibold">{batch.batchNumber}</span>
                    </div>
                  </div>
                  {daysLeft <= 0 ? (
                    <Badge variant="destructive" className="text-[10px]">Expired</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] bg-orange-100 text-orange-800 border-orange-200">
                      {daysLeft} days left
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs border-t pt-2">
                  <span className="text-muted-foreground">Stock: <strong className="text-foreground">{batch.stock} units</strong></span>
                  <span className="text-muted-foreground">Expiry: <strong className="text-foreground">{format(new Date(batch.expiryDate), 'dd MMM yyyy')}</strong></span>
                </div>

                <div className="border-t pt-2 flex justify-end">
                  <Link href={`/admin/products/${batch.productId}/edit`} className="w-full">
                    <Button variant="outline" size="sm" className="w-full h-8 rounded-lg text-xs gap-1">
                      <Edit className="h-3.5 w-3.5" /> Edit Product
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
