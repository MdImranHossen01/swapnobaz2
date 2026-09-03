'use client';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus, Edit, Trash, Loader2, Search, Package } from 'lucide-react';
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

  return (
    <div className="flex-1 space-y-4 px-0 py-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Store Products</h2>
          <p className="text-muted-foreground">Products available in your store ({total} total)</p>
        </div>
        <Link href="/reseller/products/new">
          <Button><Plus className="mr-2 h-4 w-4" /> Add Product</Button>
        </Link>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button type="submit" variant="outline">Search</Button>
      </form>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
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

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm py-2 px-3 border rounded-lg">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
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
