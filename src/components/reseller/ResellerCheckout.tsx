'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter
} from '@/components/ui/card';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Loader2, ShoppingBag, CheckCircle2, Truck, CreditCard,
  Plus, Minus, X, ArrowRight, PartyPopper, XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { normalizePhoneNumber } from '@/lib/utils';
import { resellerFbEvent, resellerTtEvent } from '@/lib/reseller-pixel';

const checkoutSchema = z.object({
  fullName: z.string().min(2, 'নাম আবশ্যক'),
  phone: z.string().min(11, 'সঠিক মোবাইল নম্বর দিন'),
  street: z.string().min(5, 'ঠিকানা আবশ্যক'),
  deliveryArea: z.enum(['inside', 'outside']),
  paymentMethod: z.string().min(1),
  notes: z.string().optional(),
});

type CheckoutValues = z.infer<typeof checkoutSchema>;

interface CartItem {
  productId: string;
  resellerProductId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  color?: string;
  size?: string;
}

interface Props {
  subdomain: string;
  storeInfo: {
    storeName: string;
    deliveryInside: number;
    deliveryOutside: number;
    paymentConfig?: {
      bkash?: { number: string; active: boolean };
      nagad?: { number: string; active: boolean };
      instructions?: string;
    };
    stripeActive?: boolean;
    metaPixelId?: string;
    tiktokPixelId?: string;
  };
  resellerId: string;
}

export function ResellerCheckout({ subdomain, storeInfo, resellerId }: Props) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);
  const [orderId, setOrderId] = useState('');

  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    mode: 'onChange',
    defaultValues: { deliveryArea: 'outside', paymentMethod: 'COD' },
  });

  const deliveryArea = form.watch('deliveryArea');
  const paymentMethod = form.watch('paymentMethod');

  useEffect(() => {
    const cartKey = `rscart_${subdomain}`;
    const loadCart = () => {
      try {
        const raw = localStorage.getItem(cartKey);
        const data = raw ? JSON.parse(raw) : [];
        if (Array.isArray(data)) setCart(data);
        else setCart([]);
      } catch {
        setCart([]);
      }
    };
    loadCart();
    window.addEventListener('reseller-cart-updated', loadCart);
    return () => window.removeEventListener('reseller-cart-updated', loadCart);
  }, [subdomain]);

  // Fire InitiateCheckout when cart loads (if has items)
  useEffect(() => {
    if (cart.length === 0) return;
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const payload = {
      content_ids: cart.map(i => i.resellerProductId),
      contents: cart.map(i => ({ id: i.resellerProductId, quantity: i.quantity, item_price: i.price })),
      value: total,
      currency: 'BDT',
      num_items: cart.reduce((s, i) => s + i.quantity, 0),
    };
    resellerFbEvent(subdomain, 'InitiateCheckout', payload);
    resellerTtEvent(subdomain, 'InitiateCheckout', payload);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.length > 0]);

  const deliveryCharge = deliveryArea === 'inside' ? storeInfo.deliveryInside : storeInfo.deliveryOutside;
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const total = subtotal + deliveryCharge;

  const updateQuantity = (item: CartItem, delta: number) => {
    const cartKey = `rscart_${subdomain}`;
    const existing = [...cart];
    const idx = existing.findIndex(
      i => i.resellerProductId === item.resellerProductId && i.color === item.color && i.size === item.size
    );
    if (idx < 0) return;
    const newQty = existing[idx].quantity + delta;
    if (newQty <= 0) {
      existing.splice(idx, 1);
    } else {
      existing[idx] = { ...existing[idx], quantity: newQty };
    }
    setCart(existing);
    localStorage.setItem(cartKey, JSON.stringify(existing));
    window.dispatchEvent(new Event('reseller-cart-updated'));
  };

  const removeItem = (item: CartItem) => {
    const cartKey = `rscart_${subdomain}`;
    const updated = cart.filter(
      i => !(i.resellerProductId === item.resellerProductId && i.color === item.color && i.size === item.size)
    );
    setCart(updated);
    localStorage.setItem(cartKey, JSON.stringify(updated));
    window.dispatchEvent(new Event('reseller-cart-updated'));
    toast.info(`${item.name} সরানো হয়েছে`);
  };

  // Abandoned Carts Tracking
  const watchedFullName = form.watch('fullName');
  const watchedPhone = form.watch('phone');
  const watchedStreet = form.watch('street');

  useEffect(() => {
    if (cart.length === 0 || submitting || showSuccessModal) return;
    if (!watchedPhone || watchedPhone.trim().length < 11 || !watchedFullName || watchedFullName.trim().length < 2) return;

    const syncAbandonedCart = async () => {
      try {
        await fetch('/api/cart/abandoned', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: watchedFullName,
            phone: watchedPhone,
            street: watchedStreet,
            deliveryArea: deliveryArea,
            resellerId: resellerId,
            items: cart.map(item => ({
              product: item.resellerProductId, // In reseller context, product is the ResellerProduct ID
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              image: item.image,
              color: item.color,
              size: item.size
            })),
            totalAmount: total
          })
        });
      } catch (error) {
        console.error('Failed to sync abandoned cart:', error);
      }
    };

    const timer = setTimeout(syncAbandonedCart, 2000); // 2 seconds debounce
    return () => clearTimeout(timer);
  }, [watchedFullName, watchedPhone, watchedStreet, deliveryArea, cart, total, submitting, showSuccessModal]);

  const onSubmit = async (values: CheckoutValues) => {
    if (cart.length === 0) return toast.error('কার্টে কোনো পণ্য নেই');
    setSubmitting(true);
    try {
      const normalizedPhone = normalizePhoneNumber(values.phone) || values.phone;
      const res = await fetch(`/api/store/${subdomain}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            name: values.fullName,
            phone: normalizedPhone,
            address: { street: values.street, city: deliveryArea === 'inside' ? 'Dhaka' : 'Outside Dhaka' },
          },
          items: cart,
          deliveryArea: values.deliveryArea,
          deliveryCharge,
          subtotal,
          totalAmount: total,
          paymentMethod: values.paymentMethod,
          notes: values.notes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        if (values.paymentMethod === 'stripe') {
          const stripeRes = await fetch('/api/payment/stripe/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: data.orderId, subdomain }),
          });
          const stripeData = await stripeRes.json();
          if (stripeRes.ok && stripeData.url) {
            // Track Purchase before redirect
            const purchasePayload = {
              order_id: data.orderId,
              content_ids: cart.map(i => i.resellerProductId),
              contents: cart.map(i => ({ id: i.resellerProductId, quantity: i.quantity, item_price: i.price })),
              value: total,
              currency: 'BDT',
              num_items: cart.reduce((s, i) => s + i.quantity, 0),
            };
            resellerFbEvent(subdomain, 'Purchase', purchasePayload);
            resellerTtEvent(subdomain, 'Purchase', purchasePayload);
            localStorage.removeItem(`rscart_${subdomain}`);
            setCart([]);
            window.location.href = stripeData.url;
            return;
          } else {
            toast.error(stripeData.error || 'স্ট্রাইপ পেমেন্ট শুরু করতে ব্যর্থ হয়েছে');
          }
        } else {
          // Track Purchase
          const purchasePayload = {
            order_id: data.shortId || data.orderId,
            content_ids: cart.map(i => i.resellerProductId),
            contents: cart.map(i => ({ id: i.resellerProductId, quantity: i.quantity, item_price: i.price })),
            value: total,
            currency: 'BDT',
            num_items: cart.reduce((s, i) => s + i.quantity, 0),
          };
          resellerFbEvent(subdomain, 'Purchase', purchasePayload);
          resellerTtEvent(subdomain, 'Purchase', purchasePayload);
          localStorage.removeItem(`rscart_${subdomain}`);
          setCart([]);
          setOrderId(data.shortId || data.orderId || '');
          setShowSuccessModal(true);
        }
      } else {
        toast.error(data.error || 'অর্ডার দিতে সমস্যা হয়েছে');
      }
    } catch {
      toast.error('নেটওয়ার্ক সমস্যা হয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  const watchedFields = form.watch();
  const isPhoneValid = /^(?:01)[3-9]\d{8}$/.test(watchedFields.phone || '');
  const isAddressValid = (watchedFields.street || '').trim().length >= 5;
  const isNameValid = (watchedFields.fullName || '').trim().length >= 2;
  const isFormValid = !!(isNameValid && isPhoneValid && isAddressValid && watchedFields.deliveryArea);

  // Empty cart state
  if (cart.length === 0 && !showSuccessModal) return (
    <div className="container min-h-[70vh] flex flex-col items-center justify-center gap-6 py-20 text-center">
      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
        <ShoppingBag className="w-12 h-12 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-black tracking-tight">আপনার কার্ট খালি!</h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          চেকআউট করতে আগে কিছু পণ্য কার্টে যোগ করুন।
        </p>
      </div>
      <Link href="/shop">
        <Button className="rounded-full px-8 h-11 font-bold">
          শপে যান <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </div>
  );

  return (
    <div className="container px-4 md:px-6 py-6 md:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-start">

        {/* Left: Cart Summary */}
        <div className="block lg:sticky lg:top-24 self-start space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                আপনার অর্ডারকৃত পণ্যসমূহ ({cart.reduce((s, i) => s + i.quantity, 0)})
              </CardTitle>
              <CardDescription>যে পণ্যগুলো আপনি কিনতে যাচ্ছেন।</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-[500px] overflow-y-auto space-y-4 pr-2 -mr-2">
                {cart.map((item, index) => (
                  <div key={`${item.resellerProductId}_${item.color || ''}_${item.size || ''}_${index}`} className="flex gap-4 items-start relative group">
                    <div className="h-16 w-16 rounded-md border bg-muted flex-shrink-0 relative overflow-hidden">
                      {item.image && (
                        <Image src={item.image} alt={item.name || 'Product'} width={64} height={64} className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-start gap-2 w-full min-w-0">
                        <div className="flex flex-col pr-4 min-w-0 flex-1">
                          <p className="text-sm font-bold truncate" title={item.name}>{item.name}</p>
                          {(item.color || item.size) && (
                            <p className="text-[10px] text-muted-foreground font-medium">
                              {[item.color, item.size].filter(Boolean).join(' / ')}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => removeItem(item)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1 -mt-1 -mr-1"
                          aria-label={`Remove ${item.name}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center border rounded-full bg-muted/50 scale-90 -ml-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item, -1)}
                            className="h-7 w-7 flex items-center justify-center hover:bg-muted rounded-full transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item, 1)}
                            className="h-7 w-7 flex items-center justify-center hover:bg-muted rounded-full transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-sm font-bold text-primary">৳{Math.round(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex justify-between items-center pt-2">
                <span className="text-base font-bold">Items Total</span>
                <span className="text-xl font-black text-primary">৳{Math.round(subtotal)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Delivery & Payment */}
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
            <p className="text-muted-foreground mt-2">Complete your order by filling in the details below.</p>
          </div>

          <Form {...form}>
            <form id="checkout-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Truck className="h-6 w-6 text-primary" />
                    ডেলিভারি তথ্য
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>পূর্ণ নাম</FormLabel>
                        <FormControl>
                          <Input placeholder="আপনার পূর্ণ নাম লিখুন" {...field} className="h-11 focus-visible:ring-primary/20" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>মোবাইল নম্বর</FormLabel>
                        <FormControl>
                          <Input placeholder="যেমন: 017XXXXXXXX" {...field} className="h-11 focus-visible:ring-primary/20" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="deliveryArea"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="font-bold">ডেলিভারি এলাকা</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex flex-row space-x-6 pt-1"
                          >
                            <FormItem className="flex items-center space-x-2 space-y-0 cursor-pointer">
                              <FormControl>
                                <RadioGroupItem value="inside" />
                              </FormControl>
                              <FormLabel className="font-medium cursor-pointer text-sm">
                                ঢাকার ভিতরে — ৳{storeInfo.deliveryInside}
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0 cursor-pointer">
                              <FormControl>
                                <RadioGroupItem value="outside" />
                              </FormControl>
                              <FormLabel className="font-medium cursor-pointer text-sm">
                                ঢাকার বাইরে — ৳{storeInfo.deliveryOutside}
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>সম্পূর্ণ ঠিকানা</FormLabel>
                        <FormControl>
                          <Input placeholder="গ্রাম/বাসা নং, রোড নং, এলাকা, থানা, জেলা" {...field} className="h-11 focus-visible:ring-primary/20" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Special Instructions (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Any special notes..." {...field} className="h-11 focus-visible:ring-primary/20" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Order Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>৳{Math.round(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="text-primary font-bold">৳{deliveryCharge}</span>
                    </div>
                    <Separator className="mt-4" />
                    <div className="flex justify-between text-lg font-black pt-2">
                      <span>Final Total</span>
                      <span className="text-primary">৳{Math.round(total)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method Card */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex flex-col space-y-2"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                              <FormControl>
                                <RadioGroupItem value="COD" />
                              </FormControl>
                              <FormLabel className="font-bold flex-1 cursor-pointer">
                                Cash on Delivery (COD)
                                <p className="text-xs font-normal text-muted-foreground mt-1">পণ্য পাওয়ার পর টাকা দিন।</p>
                              </FormLabel>
                            </FormItem>
                            {storeInfo.paymentConfig?.bkash?.active && (
                              <FormItem className="flex items-center space-x-3 space-y-0 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                                <FormControl>
                                  <RadioGroupItem value="bkash" />
                                </FormControl>
                                <FormLabel className="font-bold flex-1 cursor-pointer">
                                  bKash — {storeInfo.paymentConfig.bkash.number}
                                  <p className="text-xs font-normal text-muted-foreground mt-1">বিকাশে পেমেন্ট করুন।</p>
                                </FormLabel>
                              </FormItem>
                            )}
                            {storeInfo.paymentConfig?.nagad?.active && (
                              <FormItem className="flex items-center space-x-3 space-y-0 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                                <FormControl>
                                  <RadioGroupItem value="nagad" />
                                </FormControl>
                                <FormLabel className="font-bold flex-1 cursor-pointer">
                                  Nagad — {storeInfo.paymentConfig.nagad.number}
                                  <p className="text-xs font-normal text-muted-foreground mt-1">নগদে পেমেন্ট করুন।</p>
                                </FormLabel>
                              </FormItem>
                            )}
                            {storeInfo.stripeActive && (
                              <FormItem className="flex items-center space-x-3 space-y-0 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                                <FormControl>
                                  <RadioGroupItem value="stripe" />
                                </FormControl>
                                <FormLabel className="font-bold flex-1 cursor-pointer">
                                  Stripe (Card / Mobile Payment)
                                  <Badge variant="secondary" className="mt-2 text-[10px] block w-fit">Recommended</Badge>
                                </FormLabel>
                              </FormItem>
                            )}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {storeInfo.paymentConfig?.instructions && (paymentMethod === 'bkash' || paymentMethod === 'nagad') && (
                    <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                      {storeInfo.paymentConfig.instructions}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-2 border-t flex flex-col gap-3">
                  <Button
                    type="submit"
                    className={`w-full h-14 rounded-full font-black uppercase tracking-widest text-sm transition-all ${
                      isFormValid
                        ? 'bg-primary shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95'
                        : 'bg-muted text-muted-foreground cursor-not-allowed opacity-70'
                    }`}
                    disabled={submitting || !isFormValid}
                  >
                    {submitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                    অর্ডার নিশ্চিত করুন — ৳{Math.round(total)}
                  </Button>
                  {!isFormValid && (
                    <p className="text-[10px] font-bold text-muted-foreground text-center w-full uppercase tracking-widest">
                      অর্ডার সম্পন্ন করতে ডেলিভারি তথ্য পূরণ করুন
                    </p>
                  )}
                </CardFooter>
              </Card>
            </form>
          </Form>
        </div>
      </div>

      {/* ✅ Order Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-0 shadow-2xl">
          <div className="flex flex-col items-center text-center p-8 gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center border-4 border-green-500/20 shadow-xl shadow-green-500/20 animate-in zoom-in-50 duration-500">
                <PartyPopper className="w-12 h-12 text-green-500" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight">অর্ডার সফল হয়েছে!</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে। আমরা শীঘ্রই আপনার সাথে যোগাযোগ করবো।
              </p>
              {orderId && (
                <p className="text-xs font-mono bg-muted px-3 py-1.5 rounded-full inline-block text-muted-foreground">
                  Order ID: <span className="font-bold text-foreground">#{orderId.slice(-8).toUpperCase()}</span>
                </p>
              )}
            </div>
            <div className="flex flex-col gap-3 w-full pt-2">
              <Button
                onClick={() => { setShowSuccessModal(false); window.location.href = '/shop'; }}
                className="w-full h-11 rounded-full font-bold shadow-lg shadow-primary/20"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                আরো শপিং করুন
              </Button>
              <Button
                variant="outline"
                onClick={() => { setShowSuccessModal(false); window.location.href = '/'; }}
                className="w-full h-11 rounded-full font-bold"
              >
                হোমে ফিরে যান <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ❌ Payment Failed Modal */}
      <Dialog open={showFailModal} onOpenChange={setShowFailModal}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-0 shadow-2xl">
          <div className="flex flex-col items-center text-center p-8 gap-6">
            <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center border-4 border-destructive/20 shadow-xl shadow-destructive/20 animate-in zoom-in-50 duration-500">
              <XCircle className="w-12 h-12 text-destructive" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-destructive">পেমেন্ট ব্যর্থ হয়েছে</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                আপনার পেমেন্ট সম্পন্ন হয়নি। পুনরায় চেষ্টা করুন অথবা COD বেছে নিন।
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full pt-2">
              <Button onClick={() => setShowFailModal(false)} className="w-full h-11 rounded-full font-bold">
                পুনরায় চেষ্টা করুন
              </Button>
              <Button
                variant="ghost"
                onClick={() => { setShowFailModal(false); window.location.href = '/shop'; }}
                className="w-full h-11 rounded-full font-bold"
              >
                শপে ফিরে যান
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
