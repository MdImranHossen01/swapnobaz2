'use client';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Search, Package, PlusCircle, CheckCircle2, DollarSign, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';

function SourceProductsContent() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Sourcing Dialog State
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [retailPrice, setRetailPrice] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '12' });
    if (search) params.set('search', search);

    try {
      const res = await fetch(`/api/reseller/products/source?${params}`);
      if (res.ok) {
        const d = await res.json();
        setProducts(d.products || []);
        setTotalPages(d.pagination?.totalPages || 1);
        setTotal(d.pagination?.total || 0);
      } else {
        toast.error('Failed to fetch sourceable products');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred while fetching products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const openSourcingDialog = (product: any) => {
    setSelectedProduct(product);
    // Suggest default markup if not sourced (e.g. wholesale price + 20%) or use existing retail price
    const wholesalePrice = product.resellerPrice || product.purchasePrice || product.price || 0;
    const initialRetailPrice = product.isSourced && product.sourcedDetails?.retailPrice
      ? String(product.sourcedDetails.retailPrice)
      : String(Math.round(wholesalePrice * 1.2));
    setRetailPrice(initialRetailPrice);
  };

  const handleSourceProduct = async () => {
    if (!selectedProduct) return;
    const priceNum = parseFloat(retailPrice);
    const wholesalePrice = selectedProduct.resellerPrice || selectedProduct.purchasePrice || selectedProduct.price || 0;

    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error('Please enter a valid retail price');
      return;
    }
    if (priceNum < wholesalePrice) {
      toast.error(`Retail price must be at least the wholesale cost (৳${wholesalePrice})`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/reseller/products/source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct._id,
          retailPrice: priceNum,
        }),
      });

      if (res.ok) {
        toast.success(
          selectedProduct.isSourced
            ? 'Retail price updated successfully'
            : 'Product added to your store successfully'
        );
        setSelectedProduct(null);
        fetchProducts();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to source product');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred while saving');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 px-0 py-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Source B2B Products</h2>
          <p className="text-muted-foreground">
            Browse and source products from Mother Inventory or other resellers ({total} products available)
          </p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search B2B products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button type="submit" variant="outline">Search</Button>
      </form>

      {loading ? (
        <div className="flex h-60 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed rounded-xl p-12 bg-card text-center gap-2">
          <Package className="h-12 w-12 text-muted-foreground" />
          <p className="font-semibold text-lg">No B2B Products Available</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            There are currently no wholesale products uploaded by the Admin or shared by other resellers.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(product => {
              const wholesalePrice = product.resellerPrice || product.purchasePrice || product.price || 0;
              const isSourced = product.isSourced;

              return (
                <Card key={product._id} className="overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow group relative">
                  <div>
                    <div className="aspect-square bg-muted relative w-full overflow-hidden border-b">
                      {product.images?.[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <Package className="h-12 w-12 absolute inset-0 m-auto text-muted-foreground" />
                      )}
                      {isSourced && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1 shadow-sm flex items-center justify-center" title="Sourced to Store">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <CardHeader className="p-4 pb-2">
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                        {product.categories?.[0]?.name || 'Uncategorized'}
                      </p>
                      <CardTitle className="text-sm font-bold line-clamp-2 mt-1">{product.name}</CardTitle>
                      <CardDescription className="text-xs font-mono mt-1">SKU: {product.sku || '-'}</CardDescription>
                    </CardHeader>
                  </div>
                  <div>
                    <CardContent className="p-4 pt-0">
                      <div className="flex justify-between items-center bg-muted/30 rounded-lg p-2.5 mt-2 border text-xs">
                        <div>
                          <span className="text-muted-foreground block text-[10px] uppercase font-bold">Wholesale Cost</span>
                          <span className="font-extrabold text-sm text-foreground">৳{wholesalePrice.toLocaleString()}</span>
                        </div>
                        {isSourced && (
                          <div className="text-right">
                            <span className="text-green-600 block text-[10px] uppercase font-bold">Your Retail Price</span>
                            <span className="font-extrabold text-sm text-green-600">
                              ৳{product.sourcedDetails?.retailPrice?.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                      <Button
                        variant={isSourced ? 'outline' : 'default'}
                        className="w-full text-xs font-semibold"
                        onClick={() => openSourcingDialog(product)}
                      >
                        {isSourced ? 'Edit Retail Price' : 'Source & Add to Store'}
                      </Button>
                    </CardFooter>
                  </div>
                </Card>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                Previous
              </Button>
              <span className="text-sm py-2 px-3 border rounded-lg">
                {page} / {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Sourcing Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>
              {selectedProduct?.isSourced ? 'Update Retail Price' : 'Source Product to Store'}
            </DialogTitle>
            <DialogDescription>
              Set the price at which customers will buy this product on your storefront.
            </DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-4 py-2">
              <div className="flex gap-4 items-center border p-3 rounded-lg bg-muted/20">
                <div className="h-16 w-16 bg-muted relative rounded-md overflow-hidden border">
                  {selectedProduct.images?.[0] ? (
                    <Image src={selectedProduct.images[0]} alt={selectedProduct.name} fill className="object-cover" />
                  ) : (
                    <Package className="h-8 w-8 absolute inset-0 m-auto text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm line-clamp-1">{selectedProduct.name}</h4>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">SKU: {selectedProduct.sku || '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border p-3 rounded-lg text-center bg-muted/40">
                  <span className="text-[10px] text-muted-foreground block uppercase font-bold">Wholesale Cost (Pay to Mother)</span>
                  <span className="text-lg font-black text-foreground">
                    ৳{(selectedProduct.resellerPrice || selectedProduct.purchasePrice || selectedProduct.price || 0).toLocaleString()}
                  </span>
                </div>
                <div className="border p-3 rounded-lg text-center bg-primary/5 border-primary/20">
                  <span className="text-[10px] text-primary block uppercase font-bold">Estimated Profit</span>
                  <span className="text-lg font-black text-primary">
                    ৳{Math.max(0, parseFloat(retailPrice || '0') - (selectedProduct.resellerPrice || selectedProduct.purchasePrice || selectedProduct.price || 0)).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="retail-price" className="font-bold text-xs">Your Retail Price (Tk)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground text-sm font-bold">৳</span>
                  <Input
                    id="retail-price"
                    type="number"
                    value={retailPrice}
                    onChange={e => setRetailPrice(e.target.value)}
                    placeholder="Enter retail selling price"
                    className="pl-7 h-10 text-sm font-extrabold"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedProduct(null)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSourceProduct} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedProduct?.isSourced ? 'Update Price' : 'Add to My Store'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SourceProductsPage() {
  return (
    <Suspense fallback={<div className="flex h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <SourceProductsContent />
    </Suspense>
  );
}
