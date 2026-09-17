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
import { Button } from '@/components/ui/button';
import { 
  Loader2, Mail, Phone, MapPin, CreditCard, Calendar, Truck, 
  Printer, ExternalLink
} from 'lucide-react';
import { format, isValid } from 'date-fns';
import { toast } from 'sonner';
import Image from 'next/image';
import Swal from 'sweetalert2';

interface ResellerOrderDetailsDialogProps {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

export default function ResellerOrderDetailsDialog({
  orderId,
  open,
  onOpenChange,
  onUpdate = () => {}
}: ResellerOrderDetailsDialogProps) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fraudData, setFraudData] = useState<any>(null);
  const [fraudLoading, setFraudLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

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
          toast.error(errData.message || `Failed to load order`);
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

  const handleLocalPrint = (type: 'invoice' | 'sticker') => {
    if (!order) return;
    const qs = `?id=${order._id}&type=${type}`;
    window.open(`/admin/orders/print${qs}`, '_blank');
  };

  const handleBookCourier = async () => {
    if (!order) return;
    const result = await Swal.fire({
      title: 'Book Courier?',
      text: `Hand over order #${order.shortId} to Courier?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      confirmButtonText: 'Yes, send now!'
    });
    
    if (!result.isConfirmed) return;
    
    setBookingLoading(true);
    try {
      const res = await fetch(`/api/reseller/orders/${order._id}/book-courier`, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || `Courier booked successfully!`);
        onUpdate();
        const updateRes = await fetch(`/api/reseller/orders/${order._id}`);
        if (updateRes.ok) setOrder(await updateRes.json());
      } else {
        toast.error(data.message || 'Courier booking failed');
      }
    } catch (e) {
      toast.error('Network error');
    } finally {
      setBookingLoading(false);
    }
  };

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
                  <button 
                    onClick={() => handleLocalPrint('invoice')}
                    className="p-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    title="Print A4 Invoice"
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleLocalPrint('sticker')}
                    className="p-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1 px-2.5 py-1"
                    title="Print Sticker Invoice"
                  >
                    <Printer className="h-4 w-4" />
                    <span className="text-[10px] font-bold">Sticker</span>
                  </button>
               </div>
            )}
          </div>
          <DialogDescription>
            {order ? `Order ID: #${String(order.motherOrderId ? order.motherOrderId : order._id).slice(-8).toUpperCase()}` : 'Loading order details...'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : order ? (
          <div className="space-y-6 pt-4">
            {/* Customer Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase text-muted-foreground">Customer</h3>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {order.customer?.name?.[0]?.toUpperCase() || 'C'}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">{order.customer?.name || 'Customer'}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {order.customer?.email || 'No Email'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase text-muted-foreground">Order Date</h3>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {order.createdAt && isValid(new Date(order.createdAt)) 
                      ? format(new Date(order.createdAt), 'MMMM dd, yyyy p')
                      : '—'}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Shipping & Payment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Shipping Address
                </h4>
                <div className="text-sm leading-relaxed">
                  {order.customer?.name && (
                    <p>{order.customer?.name}</p>
                  )}
                  {order.customer?.address?.street && <p>{order.customer.address.street}</p>}
                  {(() => {
                    const city = order.customer?.address?.city || '';
                    const division = order.customer?.address?.division || '';
                    const zip = order.customer?.address?.zipCode || '';
                    
                    const isCityDefault = ['dhaka', 'outside dhaka'].includes(city.toLowerCase().trim());
                    const isDivisionDefault = ['dhaka', 'outside dhaka'].includes(division.toLowerCase().trim());
                    const isZipDefault = zip.trim() === '0000';

                    const cityDivParts = [];
                    if (!isCityDefault && city) cityDivParts.push(city);
                    if (!isDivisionDefault && division) cityDivParts.push(division);

                    return (
                      <>
                        {cityDivParts.length > 0 && (
                          <p>
                            {cityDivParts.join(', ')}
                            {!isZipDefault && zip ? ` ${zip}` : ''}
                          </p>
                        )}
                        {cityDivParts.length === 0 && !isZipDefault && zip && (
                          <p>{zip}</p>
                        )}
                        <p>Bangladesh</p>
                      </>
                    );
                  })()}
                  {order.customer?.phone && (
                    <div className="space-y-2 mt-1">
                      <p className="flex items-center gap-1 text-muted-foreground font-semibold">
                        <Phone className="h-3 w-3" /> {order.customer.phone}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2">
                  <CreditCard className="h-4 w-4" /> Payment Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between font-medium">
                    <span>Method:</span>
                    <span>{order.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Status:</span>
                    <Badge variant={order.paymentStatus === 'Paid' ? 'default' : 'outline'} className={order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : ''}>
                      {order.paymentStatus}
                    </Badge>
                  </div>
                  {order.manualPaymentDetails?.transactionId && (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">Transaction ID:</span>
                      <code className="bg-muted px-2 py-1 rounded text-[10px] break-all">{order.manualPaymentDetails.transactionId}</code>
                    </div>
                  )}

                  {order.paymentMethod === 'Manual' && order.manualPaymentDetails && (
                    <div className="mt-3 p-3 bg-primary/5 rounded-xl border border-primary/20 space-y-2">
                       <p className="text-[10px] font-black uppercase text-primary tracking-widest">Manual Verification</p>
                       <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                             <span className="text-muted-foreground block">Method:</span>
                             <span className="font-bold uppercase">{order.manualPaymentDetails.methodName}</span>
                          </div>
                          <div>
                             <span className="text-muted-foreground block">Sender No:</span>
                             <span className="font-bold">{order.manualPaymentDetails.senderNumber}</span>
                          </div>
                          <div className="col-span-2">
                             <span className="text-muted-foreground block">TrxID:</span>
                             <code className="font-bold text-primary bg-white px-1.5 py-0.5 rounded border">{order.manualPaymentDetails.transactionId}</code>
                          </div>
                       </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* BD Courier Fraud Checker UI */}
            {order.customer?.phone && (
              <div className="mt-2 p-3 bg-muted/30 border rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">BD Courier Profile</span>
                  {fraudLoading && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                </div>

                {fraudData?.status === 'success' && fraudData?.data?.summary ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground text-[10px]">Success Rate:</span>
                        <span className={`font-black ${fraudData.data.summary.success_ratio >= 80 ? 'text-green-600' : fraudData.data.summary.success_ratio >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {fraudData.data.summary.success_ratio}%
                        </span>
                      </div>
                      <span className="text-muted-foreground/35">|</span>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground text-[10px]">Total Parcels:</span>
                        <span className="font-bold text-slate-800 dark:text-zinc-200">{fraudData.data.summary.total_parcel}</span>
                      </div>
                      <span className="text-muted-foreground/35">|</span>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground text-[10px]">Delivered:</span>
                        <span className="font-bold text-green-600">{fraudData.data.summary.success_parcel}</span>
                      </div>
                      <span className="text-muted-foreground/35">|</span>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground text-[10px]">Cancelled:</span>
                        <span className="font-bold text-red-600">{fraudData.data.summary.cancelled_parcel}</span>
                      </div>
                    </div>

                    {/* Reports List */}
                    {fraudData.reports && fraudData.reports.length > 0 && (
                      <div className="border-t pt-2 mt-1">
                        <span className="text-[10px] font-bold text-red-600 block mb-1">⚠️ Merchant Fraud Reports ({fraudData.reports.length})</span>
                        <div className="space-y-1.5 max-h-[80px] overflow-y-auto">
                          {fraudData.reports.map((report: any, idx: number) => (
                            <div key={idx} className="bg-red-50 dark:bg-red-950/20 p-1.5 rounded text-[10px] border border-red-100 dark:border-red-900/50">
                              <p className="font-semibold text-red-700 dark:text-red-400">{report.name || 'Anonymous'}: <span className="font-normal text-slate-700 dark:text-zinc-300">{report.details}</span></p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : !fraudLoading && (
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-muted-foreground">Click to fetch courier history</span>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="h-6 px-2 text-[10px]" 
                      onClick={() => fetchFraudData(order.customer.phone)}
                    >
                      Verify Number
                    </Button>
                  </div>
                )}
              </div>
            )}

            <Separator />

            {/* Shipping Management */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase text-muted-foreground flex items-center justify-between">
                <span>Shipping Management</span>
              </h3>
              
              {order.shippingDetails?.trackingId ? (
                <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-muted-foreground">Courier Service</p>
                      <p className="font-bold text-sm">{order.shippingDetails.courierName}</p>
                    </div>
                    <Badge variant="outline" className="bg-white">
                      {order.shippingDetails.courierStatus || 'Processing'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Tracking ID</p>
                      <code className="text-sm font-mono font-bold">{order.shippingDetails.trackingId}</code>
                    </div>
                    {order.shippingDetails.trackingUrl && (
                      <a 
                        href={order.shippingDetails.trackingUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        Track Status <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {order.items?.every((i: any) => i.productId?.uploadedBy === order.resellerId) ? (
                    <button
                      disabled={bookingLoading || order.shippingDetails?.courierStatus === 'BOOKING_IN_PROGRESS'}
                      onClick={handleBookCourier}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
                    >
                      {bookingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />} 
                      Hand over to Courier
                    </button>
                  ) : (
                    <div className="text-xs bg-yellow-50 text-yellow-700 p-3 rounded-lg border border-yellow-200">
                      <strong>Note:</strong> Courier booking will be managed by the main administrator.
                    </div>
                  )}
                </div>
              )}
            </div>

            <Separator />
            
            {/* Items */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase text-muted-foreground">Order Items</h4>
              <div className="space-y-3">
                {(order.items || []).map((item: any, i: number) => (
                  <div key={item._id || item.id || i} className="flex items-center justify-between text-sm gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-12 w-12 rounded border overflow-hidden bg-muted flex-shrink-0">
                         {item.image ? (
                             <Image src={item.image} alt={item.name} width={48} height={48} className="h-full w-full object-cover" />
                         ) : (
                             <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">No Img</div>
                         )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium line-clamp-1">{item.name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.color && <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 bg-muted/50">{item.color}</Badge>}
                          {item.size && <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 bg-muted/50">Size: {item.size}</Badge>}
                          <span className="text-xs text-muted-foreground ml-1">৳{Math.round(Number(item.retailPrice) || 0)} × {item.quantity}</span>
                        </div>
                      </div>
                    </div>
                    <div className="font-bold">
                      ৳{Math.round(Number(item.retailPrice || 0) * (item.quantity || 0))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="pt-4 border-t flex flex-col gap-2">
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Subtotal:</span>
                  <span>৳{Math.round(Number(order.subtotal) || 0)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Delivery Charge:</span>
                  <span>৳{Math.round(Number(order.deliveryCharge) || 0)}</span>
                </div>
                {order.couponDiscount > 0 && (
                  <div className="flex justify-between items-center text-sm text-destructive">
                    <span>Discount:</span>
                    <span>-৳{Math.round(Number(order.couponDiscount) || 0)}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center text-lg mt-2 pt-2 border-t">
                  <span className="font-bold">Total Amount:</span>
                  <span className="font-black text-primary">৳{Math.round(Number(order.totalAmount) || 0)}</span>
                </div>

                <div className="flex justify-between items-center text-sm mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <span className="font-bold text-emerald-800">Your Commission:</span>
                  <div className="text-right">
                    <span className="font-black text-emerald-600 block">৳{Math.round(Number(order.resellerCommission) || 0)}</span>
                    <Badge variant="outline" className="text-[10px] bg-white border-emerald-300 text-emerald-700 capitalize">
                      {order.commissionStatus || 'Pending'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        ) : (
          <div className="py-10 text-center text-muted-foreground">
            No details found for this order.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
