'use client';

import { useState } from 'react';
import { Truck, Search, Package, MapPin, CheckCircle2, Clock, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';

interface Props {
  subdomain: string;
  storeName: string;
}

export function ResellerTrackOrder({ subdomain, storeName }: Props) {
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) {
      toast.error('অর্ডার আইডি দিন');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/store/${subdomain}/track-order/${encodeURIComponent(orderId)}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
        toast.success('অর্ডার তথ্য পাওয়া গেছে!');
      } else {
        setOrder(null);
        const errorData = await res.json();
        toast.error(errorData.message || 'অর্ডার পাওয়া যায়নি। সঠিক আইডি দিন।');
      }
    } catch {
      toast.error('অর্ডার ট্র্যাক করতে ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'Order Placed':
        return 0;
      case 'Confirmed':
      case 'Processing':
      case 'Ready for Delivery':
        return 1;
      case 'Released for Delivery':
      case 'Shipped':
        return 2;
      case 'Delivered':
        return 3;
      case 'Cancelled':
      case 'Returned':
      default:
        return 0;
    }
  };

  const steps = [
    { label: 'অর্ডার প্লেসড', desc: 'অর্ডার সফলভাবে নেওয়া হয়েছে', icon: Clock },
    { label: 'কনফার্মড', desc: 'অর্ডার কনফার্ম করা হয়েছে', icon: CheckCircle2 },
    { label: 'ডেলিভারিতে আছে', desc: 'কুরিয়ারে পাঠানো হয়েছে', icon: Truck },
    { label: 'ডেলিভার্ড', desc: 'সফলভাবে ডেলিভারি হয়েছে', icon: MapPin },
  ];

  const currentStep = order ? getStatusStep(order.status) : -1;

  return (
    <div className="space-y-8">
      {/* Search Panel */}
      <Card className="border-2 shadow-lg rounded-2xl overflow-hidden">
        <CardContent className="p-6 md:p-8">
          <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="অর্ডার আইডি লিখুন (যেমন: #RS12345)"
                className="h-12 pl-12 rounded-xl border focus-visible:ring-primary bg-background font-medium"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-12 px-8 rounded-xl font-bold gap-2 text-sm"
            >
              {loading ? 'অনুসন্ধান হচ্ছে...' : 'অর্ডার ট্র্যাক করুন'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Result Panel */}
      {order && (
        <Card className="border shadow-xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-primary text-primary-foreground p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/75">অর্ডার আইডি:</p>
              <h2 className="text-2xl font-black">#{order.shortId}</h2>
            </div>
            <div className="flex gap-4 text-xs font-medium">
              <div>
                <p className="text-primary-foreground/75">তারিখ:</p>
                <p className="font-bold">{new Date(order.createdAt).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              <div>
                <p className="text-primary-foreground/75">মোট মূল্য:</p>
                <p className="font-bold">৳{order.totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <CardContent className="p-6 md:p-8 space-y-8 bg-card">
            {/* Delivery Stepper */}
            <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              {/* Stepper bar (Desktop) */}
              <div className="absolute left-6 top-1/2 -translate-y-1/2 right-6 h-0.5 bg-muted hidden md:block -z-0" />
              <div
                className="absolute left-6 top-1/2 -translate-y-1/2 h-0.5 bg-primary hidden md:block -z-0 transition-all duration-500"
                style={{ width: `${Math.max(0, currentStep) * 33.33}%` }}
              />

              {steps.map((step, idx) => {
                const StepIcon = step.icon;
                const isCompleted = idx <= currentStep;
                const isActive = idx === currentStep;

                return (
                  <div
                    key={step.label}
                    className="flex md:flex-col items-center gap-4 md:gap-2.5 z-10 w-full md:w-auto relative"
                  >
                    {/* Stepper bar (Mobile) */}
                    {idx > 0 && (
                      <div className={`absolute left-5 -top-6 w-0.5 h-6 md:hidden -z-0 ${idx <= currentStep ? 'bg-primary' : 'bg-muted'}`} />
                    )}

                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                        isCompleted
                          ? 'bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20 scale-105'
                          : 'bg-background border-muted text-muted-foreground'
                      } ${isActive ? 'ring-4 ring-primary/20' : ''}`}
                    >
                      <StepIcon className="h-5 w-5" />
                    </div>
                    <div className="text-left md:text-center min-w-0">
                      <p className={`text-sm font-bold leading-tight ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {step.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Courier status info */}
            {order.shippingDetails?.courierName && (
              <div className="rounded-xl border bg-muted/20 p-4 flex gap-3 items-start">
                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">শিপিং ইনফরমেশন:</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    {order.shippingDetails.courierName} কুরিয়ার সার্ভিসের মাধ্যমে আপনার অর্ডারটি পাঠানো হয়েছে।
                  </p>
                  {order.shippingDetails.trackingUrl && (
                    <a
                      href={order.shippingDetails.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary font-bold hover:underline inline-flex items-center gap-1 mt-1.5"
                    >
                      কুরিয়ার ট্র্যাকিং লিঙ্ক →
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Order Items & Customer details */}
            <div className="grid md:grid-cols-2 gap-8 pt-4 border-t">
              {/* Product Details */}
              <div className="space-y-4">
                <h3 className="font-black text-sm text-foreground uppercase tracking-wider">পণ্যসমূহ</h3>
                <div className="space-y-3">
                  {order.items.map((item: any, i: number) => (
                    <div key={i} className="flex gap-3 items-center">
                      <div className="w-12 h-12 rounded-lg overflow-hidden border bg-muted shrink-0 relative">
                        {item.image ? (
                          <Image src={item.image} alt={item.name} width={48} height={48} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          ৳{item.retailPrice} × {item.quantity}
                          {item.color || item.size ? ` | ${[item.color, item.size].filter(Boolean).join(' - ')}` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="space-y-4">
                <h3 className="font-black text-sm text-foreground uppercase tracking-wider">ডেলিভারি ঠিকানা</h3>
                <div className="text-xs space-y-2 text-muted-foreground font-medium">
                  <div>
                    <span className="text-foreground font-bold">নাম: </span>
                    <span>{order.shippingDetails.name}</span>
                  </div>
                  <div>
                    <span className="text-foreground font-bold">ফোন: </span>
                    <span>{order.shippingDetails.phone}</span>
                  </div>
                  <div>
                    <span className="text-foreground font-bold">জেলা/শহর: </span>
                    <span>{order.shippingDetails.address}</span>
                  </div>
                  <div>
                    <span className="text-foreground font-bold">পেমেন্ট পদ্ধতি: </span>
                    <span>{order.paymentMethod === 'COD' ? 'ক্যাশ অন ডেলিভারি (COD)' : order.paymentMethod}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
