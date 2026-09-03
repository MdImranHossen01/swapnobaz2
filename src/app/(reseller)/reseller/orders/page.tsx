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
  Loader2, Eye, Search, RefreshCcw, ChevronDown,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import { toast } from 'sonner';

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

function OrdersContent() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const limit = 20;

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/reseller/orders?${params}`);
      if (res.ok) {
        const d = await res.json();
        setOrders(d.orders || []);
        setTotal(d.total || 0);
      }
    } catch { toast.error('Failed to fetch orders'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [page, statusFilter]);

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
    <div className="flex-1 space-y-4 px-0 py-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
          <p className="text-muted-foreground">Manage your store orders ({total} total)</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search by order ID, phone..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Button type="submit" variant="outline">Search</Button>
        </form>
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button variant="outline" className="min-w-[150px] justify-between">
              {statusFilter || 'All Status'} <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          } />
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => { setStatusFilter(''); setPage(1); }}>All Status</DropdownMenuItem>
            {STATUS_OPTIONS.map(s => (
              <DropdownMenuItem key={s} onClick={() => { setStatusFilter(s); setPage(1); }}>{s}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
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
                  <TableCell className="font-mono font-bold text-primary">{order.shortId}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-semibold text-sm">{order.customer?.name}</p>
                      <p className="text-xs text-muted-foreground">{order.customer?.phone}</p>
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
                      <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-primary" onClick={() => setSelectedOrder(order)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="ghost" className="h-8 w-8 p-0 text-xs">
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        } />
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm py-2 px-3 border rounded-lg">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-card rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Order #{selectedOrder.shortId}</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(null)}>✕</Button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><p className="text-muted-foreground">Customer</p><p className="font-semibold">{selectedOrder.customer?.name}</p></div>
                <div><p className="text-muted-foreground">Phone</p><p className="font-semibold">{selectedOrder.customer?.phone}</p></div>
                <div><p className="text-muted-foreground">Address</p><p className="font-semibold">{selectedOrder.customer?.address}</p></div>
                <div><p className="text-muted-foreground">Status</p><Badge className={`${statusColorMap[selectedOrder.status] || ''}`}>{selectedOrder.status}</Badge></div>
                <div><p className="text-muted-foreground">Total</p><p className="font-black text-primary">৳{selectedOrder.totalAmount?.toLocaleString()}</p></div>
                <div><p className="text-muted-foreground">Your Commission</p><p className="font-bold text-green-600">৳{selectedOrder.resellerCommission?.toLocaleString() || 0}</p></div>
              </div>
              <div className="border-t pt-3">
                <p className="font-bold mb-2">Items ({selectedOrder.items?.length})</p>
                {selectedOrder.items?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center py-1.5 border-b last:border-0">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity} × ৳{item.price}</p>
                    </div>
                    <p className="font-semibold">৳{(item.quantity * item.price).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
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
