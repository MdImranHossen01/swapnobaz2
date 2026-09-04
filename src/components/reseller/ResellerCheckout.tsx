'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, ShoppingBag, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const schema = z.object({
  name: z.string().min(2, 'নাম দিন'),
  phone: z.string().min(11, 'সঠিক নম্বর দিন'),
  address: z.string().min(5, 'ঠিকানা দিন'),
  city: z.string().min(2, 'শহর/জেলা দিন'),
  deliveryArea: z.enum(['inside', 'outside']),
  paymentMethod: z.string().min(1),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

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
  };
}

export function ResellerCheckout({ subdomain, storeInfo }: Props) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [ordered, setOrdered] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
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
        if (Array.isArray(data)) {
          setCart(data);
        } else {
          setCart([]);
        }
      } catch (err) {
        console.error('Failed to parse cart localStorage:', err);
        setCart([]);
      }
    };
    loadCart();
    window.addEventListener('reseller-cart-updated', loadCart);
    return () => window.removeEventListener('reseller-cart-updated', loadCart);
  }, [subdomain]);

  const deliveryCharge = deliveryArea === 'inside' ? storeInfo.deliveryInside : storeInfo.deliveryOutside;
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const total = subtotal + deliveryCharge;

  const removeItem = (resellerProductId: string, color?: string, size?: string) => {
    const cartKey = `rscart_${subdomain}`;
    const updated = cart.filter(i => 
      !(i.resellerProductId === resellerProductId && i.color === color && i.size === size)
    );
    setCart(updated);
    localStorage.setItem(cartKey, JSON.stringify(updated));
    window.dispatchEvent(new Event('reseller-cart-updated'));
  };

  const onSubmit = async (values: FormValues) => {
    if (cart.length === 0) return toast.error('কার্টে কোনো পণ্য নেই');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/store/${subdomain}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            name: values.name,
            phone: values.phone,
            address: { street: values.address, city: values.city },
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
          // Initialize Stripe Checkout session and redirect
          const stripeRes = await fetch('/api/payment/stripe/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: data.orderId,
              subdomain,
            }),
          });
          const stripeData = await stripeRes.json();
          if (stripeRes.ok && stripeData.url) {
            localStorage.removeItem(`rscart_${subdomain}`);
            setCart([]);
            window.location.href = stripeData.url;
            return;
          } else {
            toast.error(stripeData.error || 'স্ট্রাইপ পেমেন্ট শুরু করতে ব্যর্থ হয়েছে');
          }
        } else {
          localStorage.removeItem(`rscart_${subdomain}`);
          setCart([]);
          setOrderId(data.shortId || data.orderId);
          setOrdered(true);
        }
      } else {
        toast.error(data.error || 'অর্ডার দিতে সমস্যা হয়েছে');
      }
    } catch {
      toast.error('নেটওয়ার্ক সমস্যা');
    } finally {
      setSubmitting(false);
    }
  };

  if (ordered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4 max-w-md">
          <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto" />
          <h1 className="text-2xl font-black">অর্ডার সফল! 🎉</h1>
          <p className="text-muted-foreground">আপনার অর্ডার গ্রহণ করা হয়েছে। আমরা শীঘ্রই যোগাযোগ করব।</p>
          {orderId && (
            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground mb-1">অর্ডার নম্বর</p>
              <p className="font-black text-xl tracking-widest">{orderId}</p>
            </div>
          )}
          <Link href="/" className="inline-block mt-4 text-primary underline font-medium">আরো শপিং করুন</Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-xl font-bold mb-2">কার্ট খালি</p>
          <Link href="/" className="text-primary underline">পণ্য দেখুন</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-14 flex items-center">
          <Link href="/" className="text-sm font-semibold text-primary">← {storeInfo.storeName}</Link>
          <h1 className="ml-4 font-black">চেকআউট</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="grid md:grid-cols-5 gap-8">
          {/* Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="md:col-span-3 space-y-5">
            <div className="space-y-1">
              <Label>পুরো নাম</Label>
              <Input {...form.register('name')} placeholder="আপনার নাম" />
              {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>মোবাইল নম্বর</Label>
              <Input {...form.register('phone')} placeholder="01XXXXXXXXX" type="tel" />
              {form.formState.errors.phone && <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>ঠিকানা</Label>
              <Input {...form.register('address')} placeholder="বাড়ি/রোড নম্বর, এলাকা" />
              {form.formState.errors.address && <p className="text-xs text-destructive">{form.formState.errors.address.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>শহর / জেলা</Label>
              <Input {...form.register('city')} placeholder="যেমন: ঢাকা, চট্টগ্রাম" />
              {form.formState.errors.city && <p className="text-xs text-destructive">{form.formState.errors.city.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>ডেলিভারি এলাকা</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'inside', label: `ঢাকার ভেতরে — ৳${storeInfo.deliveryInside}` },
                  { value: 'outside', label: `ঢাকার বাইরে — ৳${storeInfo.deliveryOutside}` },
                ].map(opt => (
                  <label
                    key={opt.value}
                    className={`cursor-pointer rounded-xl border p-3 text-sm font-medium transition-all ${form.watch('deliveryArea') === opt.value ? 'border-primary bg-primary/5 text-primary' : 'hover:border-muted-foreground'}`}
                  >
                    <input type="radio" {...form.register('deliveryArea')} value={opt.value} className="sr-only" />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Payment */}
            <div className="space-y-2">
              <Label>পেমেন্ট পদ্ধতি</Label>
              <div className="space-y-2">
                <label className={`flex items-center gap-3 cursor-pointer rounded-xl border p-3 transition-all ${paymentMethod === 'COD' ? 'border-primary bg-primary/5' : ''}`}>
                  <input type="radio" {...form.register('paymentMethod')} value="COD" className="accent-primary" />
                  <span className="font-medium text-sm">ক্যাশ অন ডেলিভারি (COD)</span>
                </label>
                {storeInfo.paymentConfig?.bkash?.active && (
                  <label className={`flex items-center gap-3 cursor-pointer rounded-xl border p-3 transition-all ${paymentMethod === 'bkash' ? 'border-primary bg-primary/5' : ''}`}>
                    <input type="radio" {...form.register('paymentMethod')} value="bkash" className="accent-primary" />
                    <span className="font-medium text-sm">bKash — {storeInfo.paymentConfig.bkash.number}</span>
                  </label>
                )}
                {storeInfo.paymentConfig?.nagad?.active && (
                  <label className={`flex items-center gap-3 cursor-pointer rounded-xl border p-3 transition-all ${paymentMethod === 'nagad' ? 'border-primary bg-primary/5' : ''}`}>
                    <input type="radio" {...form.register('paymentMethod')} value="nagad" className="accent-primary" />
                    <span className="font-medium text-sm">Nagad — {storeInfo.paymentConfig.nagad.number}</span>
                  </label>
                )}
                {storeInfo.stripeActive && (
                  <label className={`flex items-center gap-3 cursor-pointer rounded-xl border p-3 transition-all ${paymentMethod === 'stripe' ? 'border-primary bg-primary/5' : ''}`}>
                    <input type="radio" {...form.register('paymentMethod')} value="stripe" className="accent-primary" />
                    <span className="font-medium text-sm">Stripe (Card / Mobile Payment)</span>
                  </label>
                )}
              </div>
              {storeInfo.paymentConfig?.instructions && (paymentMethod === 'bkash' || paymentMethod === 'nagad') && (
                <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                  {storeInfo.paymentConfig.instructions}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label>বিশেষ নির্দেশনা (ঐচ্ছিক)</Label>
              <Input {...form.register('notes')} placeholder="কোনো বিশেষ কথা থাকলে লিখুন..." />
            </div>

            <Button type="submit" disabled={submitting} size="lg" className="w-full">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              অর্ডার নিশ্চিত করুন — ৳{total.toLocaleString()}
            </Button>
          </form>

          {/* Order Summary */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="font-black text-base">অর্ডার সারাংশ</h2>
            <div className="space-y-3">
              {cart.map(item => (
                <div key={`${item.resellerProductId}_${item.color || ''}_${item.size || ''}`} className="flex gap-3 items-start">
                  <div className="w-14 h-14 rounded-lg overflow-hidden border bg-muted shrink-0">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} width={56} height={56} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold line-clamp-2">{item.name}</p>
                    {(item.color || item.size) && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {[item.color && `Color: ${item.color}`, item.size && `Size: ${item.size}`].filter(Boolean).join(' | ')}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">× {item.quantity}</p>
                    <p className="text-sm font-bold text-primary">৳{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                  <button onClick={() => removeItem(item.resellerProductId, item.color, item.size)} className="text-muted-foreground hover:text-destructive text-xs">✕</button>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 space-y-2 text-sm">
              <div className="flex justify-between"><span>সাবটোটাল</span><span>৳{subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>ডেলিভারি</span><span>৳{deliveryCharge}</span></div>
              <div className="flex justify-between font-black text-base border-t pt-2"><span>মোট</span><span className="text-primary">৳{total.toLocaleString()}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
