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
  Loader2, Eye, Search, RefreshCcw, ChevronDown, CheckCircle2, XCircle
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import { toast } from 'sonner';
import ResellerOrderDetailsDialog from '@/components/reseller/ResellerOrderDetailsDialog';

const STATUS_OPTIONS = [
  'Order Placed', 'Confirmed', 'Processing',
  'Ready for Delivery', 'Released for Delivery', 'Delivered', 'Cancelled'
];

const statusColorMap: Record<string, string> = {
  'Order Placed': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  'Confirmed': 'bg-indigo-500/10 text-indigo-600',
  'Processing': 'bg-yellow-500/10 text-yellow-600',
  'Ready for Delivery': 'bg-orange-500/10 text-orange-600',
  'Released for Delivery': 'bg-purple-500/10 text-purple-600',
  'Delivered': 'bg-green-500/10 text-green-600 border-green-500/20',
  'Cancelled': 'bg-red-500/10 text-red-600',
};

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

  if (!data) return null;

  return (
    <span 
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ml-2 border ${
        data.successRatio >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
        data.successRatio >= 50 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
        'bg-red-50 text-red-700 border-red-200'
      }`}
      title={`Delivered: ${data.delivered} | Cancelled: ${data.cancelled}`}
    >
      {data.successRatio >= 80 ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
      {data.successRatio}% Success
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const updateStatus = async (orderId: string, status: string) => {
    const res = await fetch(`/api/reseller/orders`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status }),
    });
    if (res.ok) { toast.success(`Status updated to ${status}`); fetchOrders(); }
    else toast.error('Failed to update status');
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex-1 space-y-4 px-0 py-2 md:p-8 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 md:px-0">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Orders</h2>
          <p className="text-xs md:text-sm text-muted-foreground">Manage your store orders ({total} total)</p>
        </div>
        <Button variant="outline" size="sm" className="h-9 self-start sm:self-auto" onClick={fetchOrders} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
          Reload
        </Button>
      </div>

      {/* Advanced Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3 bg-card p-3 rounded-md border shadow-sm px-1 md:px-3">
        <form onSubmit={handleSearch} className="relative flex-1 w-full md:max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by order ID, name, phone..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pl-8 h-9 text-sm"
          />
        </form>

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
            Clear
          </Button>
        )}
      </div>

      {/* Status Tabs Row (Desktop only) */}
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

      {/* Table & Cards */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold">Order ID</TableHead>
                <TableHead className="font-bold">Customer</TableHead>
                <TableHead className="font-bold">Date</TableHead>
                <TableHead className="font-bold">Items</TableHead>
                <TableHead className="font-bold">Total</TableHead>
                <TableHead className="font-bold">Commission</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="text-right font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="h-40 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                </TableCell></TableRow>
              ) : orders.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="h-40 text-center text-muted-foreground">
                  No orders found.
                </TableCell></TableRow>
              ) : (
                orders.map(order => (
                  <TableRow key={order._id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <button 
                        onClick={() => {
                          setSelectedOrderId(order._id);
                          setIsDetailsOpen(true);
                        }}
                        className="font-mono font-bold text-primary hover:underline"
                      >
                        {order.shortId}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-sm">{order.customer?.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center">
                          {order.customer?.phone}
                          <FraudCheckBadge phone={order.customer?.phone} />
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(order.createdAt), 'dd MMM, hh:mm a')}
                    </TableCell>
                    <TableCell className="text-sm">{order.items?.length || 0}</TableCell>
                    <TableCell className="font-bold">৳{order.totalAmount?.toLocaleString()}</TableCell>
                    <TableCell className="font-semibold text-green-600">৳{order.resellerCommission?.toLocaleString() || 0}</TableCell>
                    <TableCell>
                      <Badge className={`text-[11px] border ${statusColorMap[order.status] || ''}`}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 hover:text-primary" 
                          onClick={() => {
                            setSelectedOrderId(order._id);
                            setIsDetailsOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 text-xs">
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {STATUS_OPTIONS.map(s => (
                              <DropdownMenuItem key={s} onClick={() => updateStatus(order._id, s)}
                                className={order.status === s ? 'font-bold text-primary' : ''}>
                                {s}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="block md:hidden p-2 space-y-2.5">
          {loading ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
              Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No orders found.
            </div>
          ) : (
            orders.map(order => (
              <div key={order._id} className="p-3 bg-card border rounded-lg shadow-sm space-y-2.5">
                <div className="flex items-start justify-between gap-2 border-b pb-2">
                  <div>
                    <button 
                      onClick={() => {
                        setSelectedOrderId(order._id);
                        setIsDetailsOpen(true);
                      }}
                      className="font-mono font-bold text-xs text-primary block hover:underline"
                    >
                      #{order.shortId}
                    </button>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(order.createdAt), 'dd MMM yyyy, hh:mm a')}
                    </span>
                  </div>
                  <Badge className={`text-[10px] shrink-0 border ${statusColorMap[order.status] || ''}`}>
                    {order.status}
                  </Badge>
                </div>

                <div className="flex items-start justify-between text-xs">
                  <div>
                    <p className="font-semibold text-foreground">{order.customer?.name}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center">
                      {order.customer?.phone}
                      <FraudCheckBadge phone={order.customer?.phone} />
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground block">{order.items?.length || 0} items</span>
                    <span className="font-bold text-sm text-foreground">৳{order.totalAmount?.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-muted/30 text-xs">
                  <span className="text-[11px] text-muted-foreground">Your Commission:</span>
                  <span className="font-bold text-green-600">৳{order.resellerCommission?.toLocaleString() || 0}</span>
                </div>

                <div className="flex items-center justify-between gap-1 pt-1 border-t">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 text-xs px-2">
                        Status <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {STATUS_OPTIONS.map(s => (
                        <DropdownMenuItem key={s} onClick={() => updateStatus(order._id, s)}
                          className={order.status === s ? 'font-bold text-primary text-xs' : 'text-xs'}>
                          {s}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-xs px-2.5" 
                    onClick={() => {
                      setSelectedOrderId(order._id);
                      setIsDetailsOpen(true);
                    }}
                  >
                    <Eye className="h-3 w-3 mr-1" /> Details
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4 px-2">
          <Button variant="outline" size="sm" className="h-8 text-xs px-2.5" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
          <span className="text-xs py-1.5 px-2.5 border rounded-lg">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" className="h-8 text-xs px-2.5" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}

      {/* Improved Order Details Dialog */}
      <ResellerOrderDetailsDialog 
        orderId={selectedOrderId} 
        open={isDetailsOpen} 
        onOpenChange={setIsDetailsOpen} 
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
