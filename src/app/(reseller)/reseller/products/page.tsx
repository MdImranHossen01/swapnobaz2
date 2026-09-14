/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import * as React from 'react';
import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Plus, Edit, Trash, Loader2, Search, Package, RefreshCw,
  MoreHorizontal, ChevronDown, ChevronRight, PackagePlus, Store,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

function calculateCumulativeStock(product: any): number {
  if (product.variants && product.variants.length > 0) {
    return product.variants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
  }
  return product.stock || 0;
}

function ProductsContent() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const limit = 10;

  const fetchProducts = async (signal?: AbortSignal, page = currentPage) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set('search', search);
      const res = await fetch(`/api/reseller/products?${params}`, { signal });
      if (!res.ok) { toast.error('Failed to fetch products'); return; }
      const d = await res.json();
      setProducts(d.products || []);
      setPagination(d.pagination || { total: 0, totalPages: 1 });
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchProducts(controller.signal, currentPage);
    return () => controller.abort();
  }, [currentPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts(undefined, 1);
  };

  const handleDelete = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: 'Delete Product?',
      text: `Remove "${name}" from your store?`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', confirmButtonText: 'Yes, remove it!',
      customClass: { popup: 'rounded-xl', confirmButton: 'rounded-lg px-4 py-2 font-bold', cancelButton: 'rounded-lg px-4 py-2' },
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

  const syncOwnProducts = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/reseller/products/sync-own', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Synced ${data.synced} products to your store!`);
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

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (products.every(p => selectedIds.includes(p._id))) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map(p => p._id));
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    router.push(`/reseller/products?page=${page}`);
  };

  return (
    <div className="flex-1 space-y-3 sm:space-y-4 px-0 py-2 sm:p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">My Store Products</h2>
          <p className="text-muted-foreground text-xs sm:text-sm">Manage your product catalog ({pagination.total} total)</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline" size="sm"
            onClick={syncOwnProducts} disabled={syncing}
            className="flex items-center gap-1.5 h-8 text-xs font-semibold border-primary text-primary hover:bg-primary/10"
          >
            {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Sync to Store
          </Button>
          <Link href="/reseller/products/new">
            <Button size="sm" className="h-8 text-xs font-bold gap-1">
              <Plus className="h-3.5 w-3.5" /> Add Product
            </Button>
          </Link>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search products by name or SKU..."
            className="pl-8 h-9 text-xs sm:text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button type="submit" variant="outline" size="sm" className="h-9 text-xs">Search</Button>
      </form>

      <div className="rounded-xl border bg-background overflow-hidden relative shadow-xs">
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={products.length > 0 && products.every(p => selectedIds.includes(p._id))}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-8"></TableHead>
                <TableHead className="w-[70px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="min-w-[150px]">Total Stock (Cumulative)</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Sales</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={11} className="h-24 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-10 w-10 text-muted-foreground" />
                      <p className="text-muted-foreground font-medium">No products found</p>
                      <Link href="/reseller/products/new">
                        <Button size="sm"><Plus className="h-4 w-4 mr-1" />Add First Product</Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => {
                  const totalStock = calculateCumulativeStock(product);
                  const hasVariants = product.variants && product.variants.length > 0;
                  const isExpanded = expandedRow === product._id;
                  return (
                    <React.Fragment key={product._id}>
                      <TableRow className={selectedIds.includes(product._id) ? 'bg-muted/50' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(product._id)}
                            onCheckedChange={() => toggleSelect(product._id)}
                          />
                        </TableCell>
                        <TableCell>
                          {hasVariants ? (
                            <button
                              onClick={() => setExpandedRow(isExpanded ? null : product._id)}
                              className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                            >
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <div className="h-12 w-12 overflow-hidden rounded-md border bg-muted">
                            {product.images && product.images.length > 0 ? (
                              <Image src={product.images[0]} alt={product.name} width={48} height={48} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Package className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium max-w-[240px]">
                          <div className="flex flex-col gap-0.5">
                            <Link
                              href={`/product/${product.slug}`} target="_blank"
                              className="hover:text-primary transition-colors hover:underline decoration-primary/30 underline-offset-4 truncate font-bold text-sm"
                            >
                              {product.name}
                            </Link>
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                              {product.brand && (
                                <span className="text-muted-foreground font-semibold flex items-center gap-0.5">
                                  Brand: <span className="text-foreground">{typeof product.brand === 'object' ? product.brand.name : product.brand}</span>
                                </span>
                              )}
                              {product.uploadedBy ? (
                                <span
                                  className="inline-flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 max-w-[120px] truncate"
                                  title={`Reseller: ${product.uploadedBy.storeName}`}
                                >
                                  <Store className="h-2.5 w-2.5 shrink-0" />
                                  <span className="truncate">{product.uploadedBy.storeName}</span>
                                </span>
                              ) : (
                                <span className="text-[10px] text-muted-foreground">Admin</span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{product.sku || '-'}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className={product.salePrice ? 'text-xs line-through text-muted-foreground' : ''}>
                              {String.fromCharCode(2547)}{product.price ? Math.round(product.price) : '0'}
                            </span>
                            {product.salePrice && (
                              <span className="font-semibold text-primary">{String.fromCharCode(2547)}{Math.round(product.salePrice)}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <span className={`font-bold text-sm ${totalStock <= 5 ? 'text-destructive' : 'text-foreground'}`}>
                                {totalStock} pcs
                              </span>
                              {hasVariants && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-primary/40 text-primary">
                                  {product.variants.length} Variants
                                </Badge>
                              )}
                            </div>
                            {hasVariants && (
                              <div className="flex flex-wrap gap-1 max-w-[260px]">
                                {product.variants.slice(0, 3).map((v: any, idx: number) => (
                                  <span key={idx} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                    {v.color || ''}{v.color && v.size ? '/' : ''}{v.size || ''}: <b className="text-foreground">{v.stock || 0}</b>
                                  </span>
                                ))}
                                {product.variants.length > 3 && (
                                  <span className="text-[10px] text-primary cursor-pointer font-medium" onClick={() => setExpandedRow(isExpanded ? null : product._id)}>
                                    +{product.variants.length - 3} more...
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-muted-foreground">{product.views ?? 0}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-primary">{product.totalSales ?? 0}</span>
                        </TableCell>
                        <TableCell>
                          <button onClick={() => togglePublish(product._id, product.isPublished)} className="hover:opacity-80 transition-opacity">
                            <Badge variant={product.isPublished ? 'default' : 'secondary'} className="cursor-pointer">
                              {product.isPublished ? 'Published' : 'Draft'}
                            </Badge>
                          </button>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => router.push(`/reseller/products/${product._id}/edit`)} className="gap-2">
                                <Edit className="h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(product._id, product.name)} className="text-destructive gap-2">
                                <Trash className="h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>

                      {isExpanded && hasVariants && (
                        <TableRow className="bg-muted/30 border-y border-muted">
                          <TableCell colSpan={11} className="p-3 pl-12">
                            <div className="bg-background rounded-lg border p-3 space-y-2">
                              <div className="text-xs font-bold text-foreground flex items-center gap-1.5 pb-1.5 border-b">
                                <PackagePlus className="h-3.5 w-3.5 text-primary" />
                                Variant Stock Breakdown
                              </div>
                              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                                {product.variants.map((v: any, idx: number) => (
                                  <div key={idx} className="flex items-center justify-between bg-muted/60 rounded-md px-3 py-2 text-xs">
                                    <span className="font-medium text-foreground">
                                      {[v.color, v.size].filter(Boolean).join(' / ') || `Variant ${idx + 1}`}
                                    </span>
                                    <span className={`font-bold ml-2 ${(v.stock || 0) <= 5 ? 'text-destructive' : 'text-primary'}`}>
                                      {v.stock || 0} pcs
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="block md:hidden p-2 space-y-2.5">
          {loading ? (
            <div className="text-center py-10">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-muted-foreground text-sm">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-10">
              <Package className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">No products found</p>
              <Link href="/reseller/products/new" className="mt-2 inline-block">
                <Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Product</Button>
              </Link>
            </div>
          ) : (
            products.map(product => {
              const totalStock = calculateCumulativeStock(product);
              const hasVariants = product.variants && product.variants.length > 0;
              return (
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
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                        <span className="font-mono">SKU: {product.sku || '-'}</span>
                        {product.brand && (
                          <span>
                            • {typeof product.brand === 'object' ? product.brand.name : product.brand}
                          </span>
                        )}
                        {product.uploadedBy ? (
                          <span className="inline-flex items-center gap-1 font-semibold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 text-[10px]">
                            <Store className="h-2.5 w-2.5 shrink-0" />
                            {product.uploadedBy.storeName}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">• Admin</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {product.salePrice && product.salePrice < product.price ? (
                          <>
                            <span className="font-bold text-xs text-primary">{String.fromCharCode(2547)}{Math.round(product.salePrice).toLocaleString()}</span>
                            <span className="text-[10px] text-muted-foreground line-through">{String.fromCharCode(2547)}{Math.round(product.price).toLocaleString()}</span>
                          </>
                        ) : (
                          <span className="font-bold text-xs">{String.fromCharCode(2547)}{Math.round(product.price || 0).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`font-bold text-xs ${totalStock <= 5 ? 'text-destructive' : 'text-foreground'}`}>
                        {totalStock} pcs
                      </span>
                      {hasVariants && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-primary/40 text-primary">
                          {product.variants.length} Var
                        </Badge>
                      )}
                      <button onClick={() => togglePublish(product._id, product.isPublished)}>
                        <Badge variant={product.isPublished ? 'default' : 'secondary'} className="cursor-pointer text-[10px] px-1.5 py-0">
                          {product.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link href={`/reseller/products/${product._id}/edit`}>
                        <Button variant="outline" size="sm" className="h-7 text-xs px-2">
                          <Edit className="h-3 w-3 mr-1" />Edit
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" className="h-7 text-xs px-2 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(product._id, product.name)}>
                        <Trash className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4 px-2">
          <Button variant="outline" size="sm" className="h-8 text-xs px-2.5" disabled={currentPage <= 1} onClick={() => handlePageChange(currentPage - 1)}>Prev</Button>
          <span className="text-xs py-1.5 px-2.5 border rounded-lg">{currentPage} / {pagination.totalPages}</span>
          <Button variant="outline" size="sm" className="h-8 text-xs px-2.5" disabled={currentPage >= pagination.totalPages} onClick={() => handlePageChange(currentPage + 1)}>Next</Button>
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

