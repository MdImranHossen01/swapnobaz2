'use client';

import { useEffect, useState, Suspense } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Loader2, User as UserIcon, Eye, Calendar, Phone, MapPin,
  ShoppingBag, Search, RefreshCcw, MoreHorizontal
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { toast } from 'sonner';

function UsersContent() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const limit = 20;

  const fetchUsers = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    const res = await fetch(`/api/reseller/users?${params}`);
    if (res.ok) {
      const d = await res.json();
      setUsers(d.users || []);
      setTotal(d.total || 0);
    } else {
      toast.error('Failed to fetch users');
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex-1 space-y-4 px-0 py-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customer Management</h2>
          <p className="text-muted-foreground">All customers registered to your store ({total} total)</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
        </Button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search by name, email, phone..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button type="submit" variant="outline">Search</Button>
      </form>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold">Customer</TableHead>
              <TableHead className="font-bold">Contact</TableHead>
              <TableHead className="font-bold">Joined</TableHead>
              <TableHead className="font-bold">Orders</TableHead>
              <TableHead className="font-bold">Loyalty</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="text-right font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="h-40 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              </TableCell></TableRow>
            ) : users.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="h-40 text-center">
                <div className="flex flex-col items-center gap-2">
                  <UserIcon className="h-8 w-8 text-muted-foreground" />
                  <p className="text-muted-foreground">No customers found</p>
                </div>
              </TableCell></TableRow>
            ) : (
              users.map(user => (
                <TableRow key={user._id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border">
                        <AvatarImage src={user.image} />
                        <AvatarFallback><UserIcon className="h-4 w-4" /></AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm">{user.name || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      {user.phone && (
                        <div className="flex items-center gap-1 text-xs">
                          <Phone className="h-3 w-3" />{user.phone}
                        </div>
                      )}
                      {user.address && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />{user.address}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {user.createdAt ? format(new Date(user.createdAt), 'dd MMM yyyy') : '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs">
                      <ShoppingBag className="h-3 w-3 text-primary" />
                      <span className="font-semibold">{user.totalOrders || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isLoyaltyActive ? 'default' : 'secondary'} className="text-[10px]">
                      {user.isLoyaltyActive ? `● Active` : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isBlocked ? 'destructive' : 'secondary'} className="text-[10px]">
                      {user.isBlocked ? 'Blocked' : 'Active'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      } />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm py-2 px-3 border rounded-lg">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14 border-2 border-primary/20">
                  <AvatarImage src={selectedUser.image} />
                  <AvatarFallback><UserIcon className="h-6 w-6" /></AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-lg">{selectedUser.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="border rounded-lg p-3 space-y-0.5">
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-semibold">{selectedUser.phone || '-'}</p>
                </div>
                <div className="border rounded-lg p-3 space-y-0.5">
                  <p className="text-xs text-muted-foreground">Joined</p>
                  <p className="font-semibold">{selectedUser.createdAt ? format(new Date(selectedUser.createdAt), 'dd MMM yyyy') : '-'}</p>
                </div>
                <div className="border rounded-lg p-3 space-y-0.5">
                  <p className="text-xs text-muted-foreground">Total Orders</p>
                  <p className="font-bold text-primary">{selectedUser.totalOrders || 0}</p>
                </div>
                <div className="border rounded-lg p-3 space-y-0.5">
                  <p className="text-xs text-muted-foreground">Total Spent</p>
                  <p className="font-bold">৳{(selectedUser.totalSpent || 0).toLocaleString()}</p>
                </div>
                <div className="border rounded-lg p-3 space-y-0.5 col-span-2">
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="font-semibold">{selectedUser.address || '-'}</p>
                </div>
                <div className="border rounded-lg p-3 space-y-0.5">
                  <p className="text-xs text-muted-foreground">Loyalty Status</p>
                  <Badge variant={selectedUser.isLoyaltyActive ? 'default' : 'secondary'}>
                    {selectedUser.isLoyaltyActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="border rounded-lg p-3 space-y-0.5">
                  <p className="text-xs text-muted-foreground">Loyalty Balance</p>
                  <p className="font-bold text-green-600">৳{(selectedUser.loyaltyBalance || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ResellerUsersPage() {
  return (
    <Suspense fallback={<div className="flex h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <UsersContent />
    </Suspense>
  );
}
