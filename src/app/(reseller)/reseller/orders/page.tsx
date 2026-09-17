'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Loader2, Eye, Search, ChevronDown, CheckCircle2, XCircle, Download, Copy, RefreshCcw, MoreHorizontal, FileText, Printer, Truck
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuGroup, DropdownMenuLabel, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import ResellerOrderDetailsDialog from '@/components/reseller/ResellerOrderDetailsDialog';

function WhatsAppIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
    </svg>
  );
}

// Fraud check badge component
function FraudCheckBadge({ phone }: { phone: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!phone) return;
    const fetchFraud = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/courier/fraud-check?phone=${phone}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchFraud();
  }, [phone]);

  if (loading) {
    return <span className="inline-flex items-center text-[10px] text-muted-foreground ml-2"><Loader2 className="h-3 w-3 animate-spin mr-1"/></span>;
  }

  if (!data || !data.data?.summary) return null;

  const successRatio = data.data.summary.success_ratio;

  return (
    <span 
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ml-2 border ${
        successRatio >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
        successRatio >= 60 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
        'bg-red-50 text-red-700 border-red-200'
      }`}
      title={`Total: ${data.data.summary.total_parcel} | Delivered: ${data.data.summary.success_parcel} | Cancelled: ${data.data.summary.cancelled_parcel}`}
    >
      {successRatio >= 80 ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
      {successRatio}% Success
    </span>
  );
}

function OrdersContent() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<any>({});
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });
  
  const [page, setPage] = useState(1);
  const limit = 20;

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set('search', search);
      if (statusFilter !== 'All') params.set('status', statusFilter);
      if (dateFilter.from) params.set('from', dateFilter.from);
      if (dateFilter.to) params.set('to', dateFilter.to);
      
      const res = await fetch(`/api/reseller/orders?${params}`);
      if (res.ok) {
        const d = await res.json();
        setOrders(d.orders || []);
        setTotal(d.total || 0);
        setStatusCounts(d.statusCounts || {});
      }
    } catch { toast.error('Failed to fetch orders'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [page, statusFilter, dateFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Order Placed': return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-none">Placed</Badge>;
      case 'Confirmed': return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-none">Confirmed</Badge>;
      case 'Paid': return <Badge variant="secondary" className="bg-green-100 text-green-800 border-none text-[10px]">Paid</Badge>;
      case 'Processing': return <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-none text-[10px]">Processing</Badge>;
      case 'Ready for Delivery': return <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-none text-[10px]">Ready</Badge>;
      case 'Released for Delivery': return <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-none text-[10px]">Released</Badge>;
      case 'Delivered': return <Badge variant="default" className="bg-green-600 text-white border-none">Delivered</Badge>;
      case 'Cancelled': return <Badge variant="destructive">Cancelled</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const exportToCSV = () => {
    if (orders.length === 0) {
      toast.error('No orders to export');
      return;
    }

    const headers = [
      'Order ID', 'Date', 'Customer', 'Email', 'Phone', 'Address', 'Items', 'Total Amount', 'Commission', 'Payment Status', 'Status'
    ];

    const rows = orders.map(o => {
      const itemsList = o.items.map((i: any) => {
        const variantDesc = [i.color, i.size].filter(Boolean).join('/');
        return `• ${i.quantity} x ${i.name}${variantDesc ? ` [${variantDesc}]` : ''} (@৳${i.retailPrice})`;
      }).join('\n');

      const id = o.motherOrderId ? String(o.motherOrderId).slice(-8).toUpperCase() : String(o._id).slice(-8).toUpperCase();

      return [
        `#${id}`,
        format(new Date(o.createdAt), 'yyyy-MM-dd HH:mm'),
        o.customer?.name || 'Guest',
        o.customer?.email || 'N/A',
        o.customer?.phone || 'N/A',
        `${o.customer?.address?.street || ''}, ${o.customer?.address?.city || ''}`,
        itemsList,
        o.totalAmount,
        o.resellerCommission || 0,
        o.paymentStatus,
        o.status
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reseller_orders_export_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Excel/CSV export started');
  };

  const handleDownloadInvoice = async (order: any) => {
    try {
      toast.info('Generating PDF invoice...');
      const { generateInvoicePDF } = await import('@/lib/invoice-generator');
      await generateInvoicePDF(order, null);
    } catch (error) {
      toast.error('Error generating invoice');
    }
  };

  const handleLocalPrint = (id: string, type: 'invoice' | 'sticker') => {
    const qs = `?id=${id}&type=${type}`;
    window.open(`/admin/orders/print${qs}`, '_blank');
  };

  const handleBookCourier = async (order: any) => {
    const result = await Swal.fire({
      title: 'Book Courier?',
      text: `Hand over order #${order.shortId || order._id.slice(-8)} to Courier?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      confirmButtonText: 'Yes, send now!'
    });
    
    if (!result.isConfirmed) return;
    
    try {
      const res = await fetch(`/api/reseller/orders/${order._id}/book-courier`, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || `Courier booked successfully!`);
        fetchOrders();
      } else {
        toast.error(data.message || 'Courier booking failed');
      }
    } catch (e) {
      toast.error('Network error');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex-1 space-y-4 px-0 py-4 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-shrink-0">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight whitespace-nowrap">Order Management</h2>
          <p className="text-muted-foreground text-xs md:text-sm hidden sm:block">Review, fulfillment and track shop orders.</p>
        </div>
        <Button onClick={exportToCSV} className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold shrink-0">
          <Download className="mr-2 h-4 w-4" /> Export
        </Button>
      </div>

      {/* Search and Date Range Row (1 Row) */}
      <div className="flex flex-wrap md:flex-nowrap items-center gap-2 w-full">
        <div className="relative w-full md:w-80 shrink-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, phone, email or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 w-full h-10"
          />
        </div>

        <div className="block md:hidden w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 w-full">
                {statusFilter === 'All' ? 'All Status' : statusFilter}
                <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {[
                  { label: 'All', value: 'All', count: statusCounts.all },
                  { label: 'Placed', value: 'Order Placed', count: statusCounts.placed },
                  { label: 'Confirmed', value: 'Confirmed', count: statusCounts.confirmed },
                  { label: 'Processing', value: 'Processing', count: statusCounts.processing },
                  { label: 'Ready', value: 'Ready for Delivery', count: statusCounts.ready },
                  { label: 'Released', value: 'Released for Delivery', count: statusCounts.released },
                  { label: 'Delivered', value: 'Delivered', count: statusCounts.delivered },
                  { label: 'Cancelled', value: 'Cancelled', count: statusCounts.cancelled }
                ].map((status) => (
                  <DropdownMenuItem
                    key={status.value}
                    onClick={() => {
                      setStatusFilter(status.value);
                      setPage(1);
                    }}
                    className={statusFilter === status.value ? "bg-accent font-bold" : ""}
                  >
                    <div className="flex items-center justify-between w-full text-xs">
                      <span>{status.label}</span>
                      <Badge variant="secondary" className="ml-2 text-[9px] px-1.5 py-0">
                        {status.count ?? 0}
                      </Badge>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-md border w-full md:w-auto h-10">
          <Input
            type="date"
            className="h-8 w-full md:w-36 border-none bg-transparent focus-visible:ring-0"
            value={dateFilter.from}
            onChange={(e) => {
              setDateFilter(prev => ({ ...prev, from: e.target.value }));
              setPage(1);
            }}
          />
          <span className="text-muted-foreground text-xs">to</span>
          <Input
            type="date"
            className="h-8 w-full md:w-36 border-none bg-transparent focus-visible:ring-0"
            value={dateFilter.to}
            onChange={(e) => {
              setDateFilter(prev => ({ ...prev, to: e.target.value }));
              setPage(1);
            }}
          />
        </div>

        {(statusFilter !== 'All' || dateFilter.from || dateFilter.to || search) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatusFilter('All');
              setDateFilter({ from: '', to: '' });
              setSearch('');
              setPage(1);
            }}
            className="text-xs text-muted-foreground hover:text-primary shrink-0"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Status Tabs Row (Desktop only - Full Width Grid) */}
      <div className="hidden md:grid md:grid-cols-8 gap-2 pb-2 border-b">
        {[
          { label: 'All', value: 'All', count: statusCounts.all },
          { label: 'Placed', value: 'Order Placed', count: statusCounts.placed },
          { label: 'Confirmed', value: 'Confirmed', count: statusCounts.confirmed },
          { label: 'Processing', value: 'Processing', count: statusCounts.processing },
          { label: 'Ready', value: 'Ready for Delivery', count: statusCounts.ready },
          { label: 'Released', value: 'Released for Delivery', count: statusCounts.released },
          { label: 'Delivered', value: 'Delivered', count: statusCounts.delivered },
          { label: 'Cancelled', value: 'Cancelled', count: statusCounts.cancelled }
        ].map((status) => {
          const isActive = statusFilter === status.value;
          return (
            <button
              key={status.value}
              onClick={() => {
                setStatusFilter(status.value);
                setPage(1);
              }}
              className={`w-full py-2 text-xs font-semibold rounded-md transition-all duration-200 text-center truncate flex items-center justify-center gap-1.5 ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-background hover:bg-muted text-muted-foreground border border-input'
              }`}
              title={`${status.label} (${status.count ?? 0})`}
            >
              <span>{status.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                isActive 
                  ? 'bg-white/20 text-white' 
                  : 'bg-muted text-muted-foreground border'
              }`}>
                {status.count ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      <div className="rounded-md border bg-background overflow-hidden relative">
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order Info</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                 <TableRow>
                   <TableCell colSpan={7} className="h-24 text-center">
                     <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                   </TableCell>
                 </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No orders found.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => {
                  const displayId = order.motherOrderId ? String(order.motherOrderId).slice(-8).toUpperCase() : String(order._id).slice(-8).toUpperCase();
                  return (
                  <TableRow key={order._id}>
                    <TableCell className="max-w-[200px] whitespace-normal">
                      <div className="flex flex-col gap-1.5 text-xs">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => {
                              setSelectedOrderId(order._id);
                              setIsDetailsOpen(true);
                            }}
                          >
                            <span className="font-bold hover:underline text-primary">
                              #{displayId}
                            </span>
                          </button>
                        </div>
                        
                        <div className="flex flex-col text-[11px] text-slate-700 dark:text-zinc-300 mt-1 space-y-0.5">
                          <span className="font-semibold text-slate-900 dark:text-white break-words block">
                            {order.customer?.name || 'Customer'}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span 
                              onClick={() => order.customer?.phone && setSearch(order.customer.phone)}
                              className="text-muted-foreground hover:text-primary cursor-pointer hover:underline font-medium"
                            >
                              {order.customer?.phone || 'No Phone'}
                            </span>
                            {order.customer?.phone && (
                              <>
                                <a 
                                  href={`https://wa.me/${order.customer.phone.replace(/[^0-9]/g, '').startsWith('88') ? order.customer.phone.replace(/[^0-9]/g, '') : '88' + (order.customer.phone.replace(/[^0-9]/g, '').startsWith('0') ? order.customer.phone.replace(/[^0-9]/g, '').slice(1) : order.customer.phone.replace(/[^0-9]/g, ''))}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-green-600 hover:text-green-700 transition-colors p-0.5 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded"
                                  title="Chat on WhatsApp"
                                >
                                  <WhatsAppIcon className="h-3.5 w-3.5" />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(order.customer.phone);
                                    toast.success('Phone number copied!');
                                  }}
                                  className="text-muted-foreground hover:text-primary transition-colors p-0.5 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded"
                                  title="Copy Phone Number"
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                              </>
                            )}
                          </div>
                          {order.customer?.phone && (
                            <div className="mt-0.5">
                              <FraudCheckBadge phone={order.customer.phone} />
                            </div>
                          )}
                          <span className="text-muted-foreground truncate max-w-[150px]">{order.customer?.email || 'No Email'}</span>
                          <span className="text-[10px] text-muted-foreground uppercase mt-0.5">
                            {format(new Date(order.createdAt), 'MMM dd, h:mm a')}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex flex-col gap-1 w-full max-w-[280px]">
                        {order.items?.map((item: any, i: number) => {
                          const variantDesc = [item.color, item.size].filter(Boolean).join(' / ');
                          return (
                            <div key={item._id || item.id || i} className="text-[11px] bg-muted/40 p-1.5 rounded-sm border truncate" title={item.name}>
                              <span className="font-medium text-muted-foreground">{item.quantity}x</span>{' '}
                              <span className="font-semibold text-slate-800 dark:text-zinc-200">{item.name}</span>
                              {variantDesc && <span className="text-muted-foreground ml-1">({variantDesc})</span>}
                            </div>
                          );
                        })}
                        {order.internalNote && (
                          <div className="text-[10px] bg-yellow-50 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-400 p-1.5 rounded-sm border border-yellow-200 dark:border-yellow-900/50 mt-1 whitespace-pre-wrap">
                            <span className="font-bold">Note:</span> {order.internalNote}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">৳{Math.round(order.totalAmount)}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-green-600 text-sm">৳{Math.round(order.resellerCommission || 0)}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant={order.paymentStatus === 'Paid' ? 'default' : 'outline'} className={
                        order.paymentStatus === 'Pending' ? 'text-yellow-600 border-yellow-300 bg-yellow-50' :
                        order.paymentStatus === 'Failed' ? 'text-red-600 border-red-300 bg-red-50' : 
                        'bg-green-100 text-green-700 hover:bg-green-200'
                      }>
                        {order.paymentStatus || 'Pending'}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {getStatusBadge(order.status)}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                          onClick={() => {
                            setSelectedOrderId(order._id);
                            setIsDetailsOpen(true);
                          }}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuGroup>
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleDownloadInvoice(order)}>
                                <FileText className="mr-2 h-4 w-4 text-primary" /> Download Invoice
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleLocalPrint(order._id, 'invoice')}>
                                <Printer className="mr-2 h-4 w-4 text-primary" /> Print Invoice
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleLocalPrint(order._id, 'sticker')}>
                                <Printer className="mr-2 h-4 w-4 text-primary" /> Print Sticker Invoice
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleBookCourier(order)} disabled={!!order.shippingDetails?.consignmentId}>
                                <Truck className="mr-2 h-4 w-4 text-orange-500" /> Book Courier
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View */}
        <div className="block md:hidden divide-y">
          {loading ? (
             <div className="py-12 text-center">
               <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
             </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No orders found.</div>
          ) : (
            orders.map(order => {
              const displayId = order.motherOrderId ? String(order.motherOrderId).slice(-8).toUpperCase() : String(order._id).slice(-8).toUpperCase();
              return (
              <div key={order._id} className="p-4 space-y-3 bg-card">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    className="font-bold hover:underline text-primary text-sm"
                    onClick={() => {
                      setSelectedOrderId(order._id);
                      setIsDetailsOpen(true);
                    }}
                  >
                    #{displayId}
                  </button>
                  {getStatusBadge(order.status)}
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Customer</span>
                    <span className="font-semibold">{order.customer?.name}</span>
                    <div className="text-muted-foreground">{order.customer?.phone}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-muted-foreground block text-[10px] uppercase">Date</span>
                    <span className="font-medium">{format(new Date(order.createdAt), 'dd MMM yyyy, h:mm a')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs border-t pt-2 mt-2">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Total</span>
                    <span className="font-bold">৳{Math.round(order.totalAmount)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-muted-foreground block text-[10px] uppercase">Commission</span>
                    <span className="font-bold text-green-600">৳{Math.round(order.resellerCommission || 0)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <Badge variant={order.paymentStatus === 'Paid' ? 'default' : 'outline'} className={
                    order.paymentStatus === 'Pending' ? 'text-yellow-600 border-yellow-300 bg-yellow-50' :
                    order.paymentStatus === 'Failed' ? 'text-red-600 border-red-300 bg-red-50' : 
                    'bg-green-100 text-green-700 hover:bg-green-200'
                  }>
                    {order.paymentStatus || 'Pending'}
                  </Badge>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-8 text-xs px-3"
                    onClick={() => {
                      setSelectedOrderId(order._id);
                      setIsDetailsOpen(true);
                    }}
                  >
                    <Eye className="h-3 w-3 mr-1" /> View
                  </Button>
                </div>
              </div>
            );
            })
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-xs font-semibold px-3" 
            disabled={page <= 1} 
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </Button>
          <span className="text-xs font-bold py-1.5 px-3 border rounded-md bg-muted/30">
            Page {page} of {totalPages}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-xs font-semibold px-3" 
            disabled={page >= totalPages} 
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Order Details Dialog */}
      <ResellerOrderDetailsDialog 
        orderId={selectedOrderId} 
        open={isDetailsOpen} 
        onOpenChange={setIsDetailsOpen} 
        onUpdate={fetchOrders}
      />
    </div>
  );
}

export default function ResellerOrdersPage() {
  return (
    <Suspense fallback={<div className="flex h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <OrdersContent />
    </Suspense>
  );
}
