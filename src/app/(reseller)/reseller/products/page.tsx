'use client';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus, Edit, Trash, Loader2, Search, Package, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Swal from 'sweetalert2';

function ProductsContent() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const fetchProducts = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    const res = await fetch(`/api/reseller/products?${params}`);
    if (res.ok) {
      const d = await res.json();
      setProducts(d.products || []);
      setTotalPages(d.pagination?.totalPages || 1);
      setTotal(d.pagination?.total || 0);
    } else {
      toast.error('Failed to fetch products');
    }
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleDelete = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: 'Delete Product?',
      text: `Remove "${name}" from your store?`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', confirmButtonText: 'Yes, remove it!',
      customClass: { popup: 'rounded-xl' },
    });
    if (!result.isConfirmed) return;
    const res = await fetch(`/api/reseller/products?id=${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Product removed'); fetchProducts(); }
    else toast.error('Failed to remove');
  };

  const togglePublish = async (id: string, current: boolean) => {
    const res = await fetch(`/api/reseller/products`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isPublished: !current }),
    });
    if (res.ok) { toast.success(`Product ${!current ? 'published' : 'unpublished'}`); fetchProducts(); }
    else toast.error('Failed to update');
  };

  const [syncing, setSyncing] = useState(false);
  const syncOwnProducts = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/reseller/products/sync-own', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast.success(`✅ ${data.synced} টি প্রোডাক্ট আপনার স্টোরে sync হয়েছে!`);
        fetchProducts();
      } else {
        toast.error(data.error || 'Sync failed');
      }
    } catch {
      toast.error('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 px-0 py-2 md:p-8 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 md:px-0">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">My Store Products</h2>
          <p className="text-xs md:text-sm text-muted-foreground">Products available in your store ({total} total)</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 self-start sm:self-auto text-xs md:text-sm border-primary text-primary hover:bg-primary/10"
            onClick={syncOwnProducts}
            disabled={syncing}
            title="আপনার সব প্রোডাক্ট store-এ sync করুন"
          >
            {syncing ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1.5 h-4 w-4" />}
            Sync to Store
          </Button>
          <Link href="/reseller/products/new">
            <Button size="sm" className="h-9 self-start sm:self-auto text-xs md:text-sm">
              <Plus className="mr-1.5 h-4 w-4" /> Add Product
            </Button>
          </Link>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 px-1 md:px-0 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8 h-9 text-xs md:text-sm" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button type="submit" variant="outline" size="sm" className="h-9 text-xs">Search</Button>
      </form>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[80px] font-bold">Image</TableHead>
                <TableHead className="font-bold">Product</TableHead>
                <TableHead className="font-bold">SKU</TableHead>
                <TableHead className="font-bold">Price</TableHead>
                <TableHead className="font-bold">Stock</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="text-right font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="h-40 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                </TableCell></TableRow>
              ) : products.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="h-10 w-10 text-muted-foreground" />
                    <p className="text-muted-foreground font-medium">No products found</p>
                    <Link href="/reseller/products/new" className="mt-1">
                      <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add First Product</Button>
                    </Link>
                  </div>
                </TableCell></TableRow>
              ) : (
                products.map(product => (
                  <TableRow key={product._id} className="hover:bg-muted/30 transition-colors group">
                    <TableCell>
                      <div className="h-12 w-12 rounded-md border bg-muted overflow-hidden relative">
                        {product.images?.[0] ? (
                          <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                        ) : (
                          <Package className="h-6 w-6 absolute inset-0 m-auto text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold text-sm line-clamp-1">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.slug}</p>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{product.sku || '-'}</TableCell>
                    <TableCell>
                      <div>
                        {product.salePrice && product.salePrice < product.price ? (
                          <>
                            <p className="font-bold text-primary">৳{product.salePrice?.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground line-through">৳{product.price?.toLocaleString()}</p>
                          </>
                        ) : (
                          <p className="font-bold">৳{product.price?.toLocaleString()}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.stock > 0 ? 'outline' : 'destructive'} className="text-xs">
                        {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <button onClick={() => togglePublish(product._id, product.isPublished)} className="hover:opacity-80 transition-opacity">
                        <Badge variant={product.isPublished ? 'default' : 'secondary'} className="cursor-pointer">
                          {product.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/reseller/products/${product._id}/edit`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary hover:bg-primary/10">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(product._id, product.name)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="block md:hidden p-2 space-y-2.5">
          {loading ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              <p>No products found</p>
              <Link href="/reseller/products/new" className="mt-2 inline-block">
                <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Product</Button>
              </Link>
            </div>
          ) : (
            products.map(product => (
              <div key={product._id} className="p-3 bg-card border rounded-lg shadow-sm space-y-2">
                <div className="flex items-start gap-2.5">
                  <div className="h-14 w-14 rounded-md border bg-muted overflow-hidden relative shrink-0">
                    {product.images?.[0] ? (
                      <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                    ) : (
                      <Package className="h-6 w-6 absolute inset-0 m-auto text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-xs leading-snug line-clamp-2 text-foreground">{product.name}</h4>
                    <span className="text-[10px] text-muted-foreground font-mono block">SKU: {product.sku || '-'}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {product.salePrice && product.salePrice < product.price ? (
                        <>
                          <span className="font-bold text-xs text-primary">৳{product.salePrice?.toLocaleString()}</span>
                          <span className="text-[10px] text-muted-foreground line-through">৳{product.price?.toLocaleString()}</span>
                        </>
                      ) : (
                        <span className="font-bold text-xs">৳{product.price?.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t text-xs">
                  <div className="flex items-center gap-1.5">
                    <Badge variant={product.stock > 0 ? 'outline' : 'destructive'} className="text-[10px] px-1.5 py-0">
                      {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                    </Badge>
                    <button onClick={() => togglePublish(product._id, product.isPublished)}>
                      <Badge variant={product.isPublished ? 'default' : 'secondary'} className="cursor-pointer text-[10px] px-1.5 py-0">
                        {product.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link href={`/reseller/products/${product._id}/edit`}>
                      <Button variant="outline" size="sm" className="h-7 text-xs px-2">
                        <Edit className="h-3 w-3 mr-1" /> Edit
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs px-2 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(product._id, product.name)}
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4 px-2">
          <Button variant="outline" size="sm" className="h-8 text-xs px-2.5" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
          <span className="text-xs py-1.5 px-2.5 border rounded-lg">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" className="h-8 text-xs px-2.5" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}

export default function ResellerProductsPage() {
  return (
    <Suspense fallback={<div className="flex h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <ProductsContent />
    </Suspense>
  );
}
