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
import { AlertTriangle, TrendingDown, Edit } from 'lucide-react';
import Link from 'next/link';

interface LowStockItem {
  id: string;
  productId: string;
  name: string;
  color: string | null;
  size: string | null;
  location: string;
  stock: number;
}

export default function ResellerLowStockPage() {
  const [items, setItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLowStock = async () => {
    try {
      const response = await fetch('/api/products/low-stock');
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching low stock:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLowStock();
  }, []);

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 w-full max-w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <TrendingDown className="h-6 w-6 text-red-500" />
            My Low Stock Inventory
          </h1>
          <p className="text-sm text-muted-foreground">Personal products and variants with less than 5 units remaining in stock</p>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Variant / Specs</TableHead>
                <TableHead>Inventory Scope</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Stock Level</TableHead>
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
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto rounded-lg" /></TableCell>
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    All products are adequately stocked (≥ 5 units).
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="font-bold text-sm">{item.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {item.color || item.size ? (
                        <div className="flex gap-1.5 items-center">
                          {item.color && <span className="font-medium text-foreground">{item.color}</span>}
                          {item.color && item.size && <span>•</span>}
                          {item.size && <span>{item.size}</span>}
                        </div>
                      ) : (
                        'Base Product'
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-muted-foreground">{item.location}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`font-bold text-xs ${item.stock === 0 ? 'text-destructive border-destructive/50 bg-destructive/5' : 'text-orange-600 border-orange-200 bg-orange-50'}`}>
                        {item.stock} {item.stock === 1 ? 'unit' : 'units'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.stock === 0 ? (
                        <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                          <AlertTriangle className="h-3 w-3" /> Out of Stock
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex items-center gap-1 w-fit bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200 border-red-200">
                          Critical Low
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/reseller/products/${item.productId}/edit`}>
                        <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs gap-1">
                          <Edit className="h-3.5 w-3.5" /> Restock / Edit
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile Card View */}
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
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground bg-card rounded-2xl border">
            All products are adequately stocked.
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="p-4 border rounded-2xl bg-card shadow-sm flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-sm">{item.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {[item.color, item.size].filter(Boolean).join(' • ') || 'Base Stock'}
                  </div>
                </div>
                {item.stock === 0 ? (
                  <Badge variant="destructive" className="text-[10px]">Out of Stock</Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] bg-red-100 text-red-800 border-red-200">
                    Low ({item.stock})
                  </Badge>
                )}
              </div>

              <div className="border-t pt-2 flex justify-end">
                <Link href={`/reseller/products/${item.productId}/edit`} className="w-full">
                  <Button variant="outline" size="sm" className="w-full h-8 rounded-lg text-xs gap-1">
                    <Edit className="h-3.5 w-3.5" /> Restock / Edit
                  </Button>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
