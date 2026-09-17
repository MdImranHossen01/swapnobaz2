'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Mail, Phone, MapPin, CreditCard, Calendar, Truck, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Image from 'next/image';

interface ResellerOrderDetailsDialogProps {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ResellerOrderDetailsDialog({
  orderId,
  open,
  onOpenChange,
}: ResellerOrderDetailsDialogProps) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fraudData, setFraudData] = useState<any>(null);
  const [fraudLoading, setFraudLoading] = useState(false);

  const fetchFraudData = async (phone: string) => {
    setFraudLoading(true);
    try {
      const res = await fetch(`/api/admin/courier/fraud-check?phone=${phone}`);
      if (res.ok) {
        const json = await res.json();
        setFraudData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFraudLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      setLoading(true);
      try {
        const orderRes = await fetch(`/api/reseller/orders/${orderId}`, { signal: controller.signal });

        if (!orderRes.ok) {
          const errData = await orderRes.json().catch(() => ({}));
          toast.error(errData.message || `Failed to load order: ${orderRes.statusText || orderRes.status}`);
          return;
        }

        const orderData = await orderRes.json();
        setOrder(orderData);
        
        if (orderData?.customer?.phone) {
          fetchFraudData(orderData.customer.phone);
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Fetch error:', error);
          toast.error('Error loading data');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    if (open && orderId) {
      fetchData();
    } else {
      setOrder(null);
      setFraudData(null);
      setFraudLoading(false);
    }

    return () => controller.abort();
  }, [open, orderId]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="text-xl font-bold">
              Order Details
            </DialogTitle>
            {order && (
               <div className="flex items-center gap-2">
                  <Badge variant={order.status === 'Delivered' ? 'default' : 'secondary'}>
                    {order.status}
                  </Badge>
               </div>
            )}
          </div>
          <DialogDescription>
            {order ? `Order ID: #${String(order._id ?? '').toUpperCase()}` : 'Loading order details...'}
            {order?.shortId && ` • Short ID: ${order.shortId}`}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : order ? (
          <div className="space-y-6 pt-4 text-xs sm:text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Customer Info */}
              <div className="space-y-3 p-4 bg-muted/20 rounded-lg border">
                <h3 className="font-bold flex items-center gap-2 text-foreground pb-2 border-b">
                  <Phone className="h-4 w-4" /> Customer Information
                </h3>
                <div className="space-y-2 text-muted-foreground">
                  <p><span className="font-semibold text-foreground">Name:</span> {order.customer?.name}</p>
                  <p className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">Phone:</span> 
                    <a href={`tel:${order.customer?.phone}`} className="hover:underline text-primary">
                      {order.customer?.phone}
                    </a>
                  </p>
                  {order.customer?.email && (
                    <p><span className="font-semibold text-foreground">Email:</span> {order.customer.email}</p>
                  )}
                  
                  {/* Fraud Check Widget inline */}
                  {fraudLoading ? (
                     <div className="flex items-center gap-2 text-xs text-muted-foreground bg-white/50 p-1 rounded border inline-flex mt-1">
                        <Loader2 className="h-3 w-3 animate-spin" /> Checking Fraud Score...
                     </div>
                  ) : fraudData ? (
                    <div className="mt-2 p-2 border rounded-md bg-white text-xs space-y-1">
                       <p className="font-bold text-foreground">Fraud Analysis</p>
                       <p>Delivery Success: <strong>{fraudData.successRatio}%</strong></p>
                       <p>Cancelled: <span className="text-destructive font-medium">{fraudData.cancelled}</span> | Delivered: <span className="text-emerald-600 font-medium">{fraudData.delivered}</span></p>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="space-y-3 p-4 bg-muted/20 rounded-lg border">
                <h3 className="font-bold flex items-center gap-2 text-foreground pb-2 border-b">
                  <MapPin className="h-4 w-4" /> Delivery Address
                </h3>
                <div className="space-y-2 text-muted-foreground">
                  <p>{order.customer?.address?.street}</p>
                  <p>{order.customer?.address?.city}{order.customer?.address?.division ? `, ${order.customer.address.division}` : ''}</p>
                  <p>Bangladesh {order.customer?.address?.zipCode && `- ${order.customer.address.zipCode}`}</p>
                </div>
              </div>

              {/* Order Status & Financials */}
              <div className="space-y-3 p-4 bg-muted/20 rounded-lg border md:col-span-2">
                <h3 className="font-bold flex items-center gap-2 text-foreground pb-2 border-b">
                  <FileText className="h-4 w-4" /> Order Overview
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-muted-foreground">
                  <div>
                    <p className="text-[10px] font-bold uppercase mb-1">Date</p>
                    <p className="font-medium text-foreground">{format(new Date(order.createdAt), 'dd MMM yyyy')}</p>
                    <p className="text-[10px]">{format(new Date(order.createdAt), 'hh:mm a')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase mb-1">Payment Method</p>
                    <p className="font-medium text-foreground">{order.paymentMethod}</p>
                    <Badge variant={order.paymentStatus === 'Paid' ? 'default' : 'outline'} className="mt-1 text-[10px]">
                      {order.paymentStatus}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase mb-1">Total Amount</p>
                    <p className="font-bold text-primary text-lg">৳{order.totalAmount}</p>
                    <p className="text-[10px]">Includes ৳{order.deliveryCharge} delivery</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase mb-1 text-emerald-600">Your Commission</p>
                    <p className="font-bold text-emerald-600 text-lg">৳{order.resellerCommission}</p>
                    <Badge variant="outline" className="mt-1 text-[10px] capitalize">
                      {order.commissionStatus}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Courier Info */}
            {order.shippingDetails?.courierName && (
               <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-bold flex items-center gap-2 text-primary">
                      <Truck className="h-4 w-4" /> Courier Info: {order.shippingDetails.courierName}
                    </h3>
                    <p className="text-muted-foreground text-xs">Tracking ID: {order.shippingDetails.trackingId}</p>
                  </div>
                  <Badge variant="outline" className="bg-white">{order.shippingDetails.courierStatus || 'Processing'}</Badge>
               </div>
            )}

            {/* Items Table */}
            <div className="space-y-3">
              <h3 className="font-bold text-base flex items-center gap-2 text-foreground">
                Order Items ({order.items?.length || 0})
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-xs text-muted-foreground font-semibold">
                    <tr>
                      <th className="px-4 py-3 w-[60px]">Image</th>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3 text-center">Qty</th>
                      <th className="px-4 py-3 text-right">Price</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {order.items?.map((item: any, idx: number) => (
                      <tr key={idx} className="bg-background">
                        <td className="px-4 py-3">
                          {item.image ? (
                            <Image 
                              src={item.image} 
                              alt={item.name} 
                              width={40} 
                              height={40} 
                              className="rounded-md object-cover border bg-muted"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">
                              No Img
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 max-w-[200px]">
                          <p className="font-medium text-foreground truncate" title={item.name}>{item.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.color && <span className="mr-2">Color: {item.color}</span>}
                            {item.size && <span>Size: {item.size}</span>}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-center font-medium">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-right">
                          ৳{item.retailPrice}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-primary">
                          ৳{(item.retailPrice * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Subtotals Footer */}
            <div className="flex justify-end pt-4 border-t">
              <div className="w-full sm:w-1/2 space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-medium">৳{order.subtotal}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery Charge</span>
                  <span className="font-medium">৳{order.deliveryCharge}</span>
                </div>
                {order.couponDiscount > 0 && (
                  <div className="flex justify-between text-destructive">
                    <span>Discount</span>
                    <span className="font-medium">-৳{order.couponDiscount}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between text-base font-bold text-foreground">
                  <span>Total Amount</span>
                  <span className="text-primary">৳{order.totalAmount}</span>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            <p>Order not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
