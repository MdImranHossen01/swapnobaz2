'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  MoreVertical,
  Edit,
  Trash2,
  Settings,
  PlusCircle,
  TrendingUp,
  Store,
  Loader2,
  CheckCircle2,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { cn } from '@/lib/utils';

export interface ProductActionMenuProps {
  product: {
    _id?: string;
    name: string;
    slug: string;
    price?: number;
    salePrice?: number;
    resellerPrice?: number;
    purchasePrice?: number;
    images?: string[];
    uploadedBy?: any;
    [key: string]: any;
  };
  className?: string;
}

export function ProductActionMenu({ product, className }: ProductActionMenuProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const role = (session?.user as any)?.role;
  const currentUserId = (session?.user as any)?.id;
  const resellerId = (session?.user as any)?.resellerId;

  const isAdmin = role === 'admin' || role === 'super_admin';
  const isReseller = role === 'reseller';

  // Modal State for Reseller Sourcing
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [sourcing, setSourcing] = useState(false);

  // Compute wholesale cost & initial retail price
  const wholesaleCost = Math.round(
    Number(product.resellerPrice ?? product.purchasePrice ?? product.price ?? 0)
  );
  const initialRetail = Math.round(
    Number(product.salePrice ?? product.price ?? wholesaleCost)
  );
  const [retailPrice, setRetailPrice] = useState<number>(initialRetail);

  // Check product ownership for Resellers
  const uploadedById =
    typeof product.uploadedBy === 'object' && product.uploadedBy !== null
      ? (product.uploadedBy._id?.toString() || product.uploadedBy.toString())
      : product.uploadedBy?.toString();

  const isOwnProduct = Boolean(
    uploadedById && (uploadedById === resellerId || uploadedById === currentUserId)
  );

  const isResellerProduct = Boolean(uploadedById);

  // If user is neither Admin nor Reseller, render nothing
  if (!isAdmin && !isReseller) {
    return null;
  }

  // Delete Handler with SweetAlert2 confirmation
  const handleDeleteProduct = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const result = await Swal.fire({
      title: 'আপনি কি নিশ্চিত?',
      text: `"${product.name}" প্রোডাক্টটি স্থায়ীভাবে মুছে ফেলা হবে।`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--destructive, #ef4444)',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'হ্যাঁ, ডিলিট করুন!',
      cancelButtonText: 'বাতিল',
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/products/${product.slug}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete product');
      }
      toast.success('প্রোডাক্টটি সফলভাবে মুছে ফেলা হয়েছে');
      router.refresh();
    } catch (err: any) {
      toast.error(`ত্রুটি: ${err.message || 'প্রোডাক্ট ডিলিট করা যায়নি'}`);
    }
  };

  // Reseller Quick Sourcing to Store Handler
  const handleAddToStore = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!product._id) {
      toast.error('প্রোডাক্ট আইডি পাওয়া যায়নি');
      return;
    }

    if (!retailPrice || retailPrice <= 0) {
      toast.error('অনুগ্রহ করে সঠিক বিক্রয় মূল্য দিন');
      return;
    }

    if (wholesaleCost > 0 && retailPrice < wholesaleCost) {
      toast.warning('বিক্রয় মূল্য পাইকারি মূল্যের চেয়ে কম হতে পারে না!');
      return;
    }

    setSourcing(true);
    try {
      const res = await fetch('/api/reseller/products/source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product._id,
          retailPrice: Number(retailPrice),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`✓ "${product.name}" সফলভাবে আপনার স্টোরে যোগ করা হয়েছে!`);
        setShowSourceModal(false);
      } else {
        toast.error(data.error || 'স্টোরে যোগ করতে সমস্যা হয়েছে');
      }
    } catch {
      toast.error('নেটওয়ার্ক সমস্যা। আবার চেষ্টা করুন।');
    } finally {
      setSourcing(false);
    }
  };

  const estimatedProfit = (Number(retailPrice) || 0) - wholesaleCost;

  return (
    <>
      <div
        className={cn('absolute bottom-3 right-3 z-20', className)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="secondary"
              className="h-7 w-7 rounded-full bg-background/90 backdrop-blur-sm border border-border shadow-md hover:bg-background transition-transform active:scale-95"
              aria-label="Product Actions"
            >
              <MoreVertical className="h-3.5 w-3.5 text-foreground" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-border/80 p-1">
            {/* 1. ADMIN & SUPER_ADMIN VIEW */}
            {isAdmin && (
              <>
                {!isResellerProduct ? (
                  <>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/admin/products/${product.slug}/edit`);
                      }}
                      className="cursor-pointer font-medium"
                    >
                      <Edit className="mr-2 h-4 w-4 text-primary" /> এডিট (Edit Product)
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={handleDeleteProduct}
                      className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 font-medium"
                    >
                      <Trash2 className="mr-2 h-4 w-4 text-destructive" /> ডিলিট (Delete)
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push('/admin/products');
                      }}
                      className="cursor-pointer font-medium"
                    >
                      <Settings className="mr-2 h-4 w-4 text-muted-foreground" /> ম্যানেজ ড্যাশবোর্ড (Manage)
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      <p className="font-semibold text-foreground flex items-center gap-1.5">
                        <Store className="h-3.5 w-3.5 text-purple-600" />
                        রিসেলার প্রোডাক্ট
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        রিসেলার কর্তৃক আপলোডকৃত পণ্য
                      </p>
                    </div>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push('/admin/products');
                      }}
                      className="cursor-pointer font-medium"
                    >
                      <Settings className="mr-2 h-4 w-4 text-muted-foreground" /> প্রোডাক্ট তালিকা (Manage)
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push('/admin/resellers');
                      }}
                      className="cursor-pointer font-medium"
                    >
                      <Store className="mr-2 h-4 w-4 text-primary" /> রিসেলার ডিরেক্টরি
                    </DropdownMenuItem>
                  </>
                )}
              </>
            )}

            {/* 2. RESELLER VIEW */}
            {isReseller && (
              <>
                {/* 2A: Reseller's own uploaded product */}
                {isOwnProduct ? (
                  <>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/reseller/products/${product._id || product.slug}/edit`);
                      }}
                      className="cursor-pointer font-medium"
                    >
                      <Edit className="mr-2 h-4 w-4 text-primary" /> এডিট (Edit My Product)
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={handleDeleteProduct}
                      className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 font-medium"
                    >
                      <Trash2 className="mr-2 h-4 w-4 text-destructive" /> ডিলিট (Delete)
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push('/reseller/products');
                      }}
                      className="cursor-pointer font-medium"
                    >
                      <Settings className="mr-2 h-4 w-4 text-muted-foreground" /> আমার প্রোডাক্ট লিস্ট (Manage)
                    </DropdownMenuItem>
                  </>
                ) : (
                  /* 2B: Main store or shared product (Quick Add to Store) */
                  <>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowSourceModal(true);
                      }}
                      className="cursor-pointer font-bold text-primary focus:text-primary focus:bg-primary/10"
                    >
                      <PlusCircle className="mr-2 h-4 w-4 text-primary" /> স্টোরে যোগ করুন (Add to Store)
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push('/reseller/products/source');
                      }}
                      className="cursor-pointer font-medium"
                    >
                      <ShoppingBag className="mr-2 h-4 w-4 text-muted-foreground" /> সোর্স প্রোডাক্ট ক্যাটালগ
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push('/reseller/dashboard');
                      }}
                      className="cursor-pointer font-medium"
                    >
                      <Store className="mr-2 h-4 w-4 text-muted-foreground" /> রিসেলার ড্যাশবোর্ড
                    </DropdownMenuItem>
                  </>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Quick Source Modal for Resellers */}
      {isReseller && (
        <Dialog open={showSourceModal} onOpenChange={setShowSourceModal}>
          <DialogContent
            className="sm:max-w-[480px] p-6 rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <DialogHeader className="space-y-1 text-left">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <Store className="h-4 w-4" /> রিসেলার স্টোর সোর্সিং
              </div>
              <DialogTitle className="text-lg font-black tracking-tight leading-snug">
                স্টোরে প্রোডাক্ট যোগ করুন
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                প্রোডাক্টটির পাইকারি মূল্য দেখে আপনার ইচ্ছামতো বিক্রয় মূল্য নির্ধারণ করুন।
              </DialogDescription>
            </DialogHeader>

            {/* Product Summary Preview */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/60 mt-1">
              <div className="relative h-14 w-14 rounded-lg overflow-hidden shrink-0 border bg-muted">
                <Image
                  src={product.images?.[0] || '/placeholder.png'}
                  alt={product.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-foreground line-clamp-2 leading-snug">
                  {product.name}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  মেইন স্টোর মূল্য: <span className="font-semibold text-foreground">৳{Math.round(product.price || 0)}</span>
                </p>
              </div>
            </div>

            <form onSubmit={handleAddToStore} className="space-y-4 pt-2">
              {/* Cost vs Selling Grid */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs">
                <div>
                  <span className="text-muted-foreground text-[11px] block">আপনার পাইকারি খরচ:</span>
                  <span className="text-base font-black text-foreground">৳{wholesaleCost}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px] block">প্রত্যাশিত নিট লাভ:</span>
                  <span
                    className={cn(
                      'text-base font-black flex items-center gap-1',
                      estimatedProfit >= 0 ? 'text-emerald-600' : 'text-destructive'
                    )}
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    ৳{estimatedProfit}
                  </span>
                </div>
              </div>

              {/* Retail Price Input */}
              <div className="space-y-1.5">
                <Label htmlFor="selling-price" className="text-xs font-bold">
                  আপনার বিক্রয় মূল্য (Retail Selling Price) <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm font-bold text-muted-foreground">
                    ৳
                  </span>
                  <Input
                    id="selling-price"
                    type="number"
                    min={wholesaleCost || 1}
                    value={retailPrice}
                    onChange={(e) => setRetailPrice(Number(e.target.value))}
                    className="pl-8 text-base font-black h-11"
                    placeholder="e.g. 500"
                    required
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  গ্রাহকরা আপনার স্টোরে (<Badge variant="outline" className="text-[10px] py-0 px-1 font-mono">subdomain.swapnobaz.com</Badge>) এই মূল্যে প্রোডাক্টটি কিনতে পারবে।
                </p>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSourceModal(false)}
                  disabled={sourcing}
                >
                  বাতিল
                </Button>
                <Button type="submit" disabled={sourcing} className="font-bold">
                  {sourcing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> স্টোরে যোগ হচ্ছে...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" /> স্টোরে যুক্ত করুন
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
