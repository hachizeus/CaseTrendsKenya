import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useRefreshTrigger } from "@/contexts/RefreshContext";
import { 
  Search, Eye, X, Mail, Loader, MessageCircle, 
  Filter, ChevronDown, TrendingUp, CreditCard, 
  Smartphone, Calendar, MapPin, Package, Truck,
  XCircle, CheckCircle, Clock, AlertCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "@/lib/constants";
import { logAuditAction } from "@/lib/audit";

const STATUS_OPTIONS = ["pending", "confirmed", "processing", "delivered", "cancelled"];
const PAYMENT_METHOD_OPTIONS = ["all", "whatsapp", "paystack"] as const;

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  pending: { label: "Pending", icon: Clock, color: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed: { label: "Confirmed", icon: CheckCircle, color: "bg-sky-50 text-sky-700 border-sky-200" },
  processing: { label: "Processing", icon: Package, color: "bg-violet-50 text-violet-700 border-violet-200" },
  delivered: { label: "Delivered", icon: Truck, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "bg-rose-50 text-rose-700 border-rose-200" },
};

const paymentConfig: Record<string, { label: string; icon: any; color: string }> = {
  whatsapp: { label: "WhatsApp", icon: MessageCircle, color: "bg-teal-50 text-teal-700 border-teal-200" },
  paystack: { label: "Paystack", icon: CreditCard, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { user, role, session } = useAuth();
  const isModerator = role === "moderator";
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [selected, setSelected] = useState<any>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const { refreshTrigger } = useRefreshTrigger();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  useEffect(() => { loadOrders(); }, [refreshTrigger]);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchQuery), 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        console.warn("Orders table not yet available:", error.message);
        toast.error("Orders table not available. Please check admin panel.");
      }
      setOrders(data || []);
    } catch (err) {
      console.warn("Error loading orders:", err);
      setOrders([]);
    }
    setLoading(false);
  };

  const sendStatusUpdateEmail = async (order: any, isManual: boolean = false) => {
    if (!order.customer_email) {
      if (isManual) {
        toast.error("No email address on file for this order");
      }
      return;
    }

    if (isManual) setSendingEmail(true);

    try {
      const emailBody = {
        to: order.customer_email,
        type: "status_update",
        data: order,
      };
      
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`${API_URL}/api/send-email`, {
        method: "POST",
        headers,
        body: JSON.stringify(emailBody),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        console.error("Email send failed:", responseData);
        if (isManual) toast.error(`Email failed: ${responseData.error || "Unknown error"}`);
        throw new Error(responseData.error || "Failed to send email");
      }

      if (isManual) {
        toast.success(`Status update email sent to ${order.customer_email}`);
        await logAuditAction({
          actor_id: user?.id ?? null,
          actor_email: user?.email ?? null,
          action_type: "status_update_email_sent",
          entity: "orders",
          entity_id: order.id,
          details: { customer_email: order.customer_email, status: order.status },
          user_id: order.user_id ?? null,
        });
      }
    } catch (err) {
      console.error("Error sending email:", err);
      if (isManual) toast.error(`Failed to send email: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      if (isManual) setSendingEmail(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await (supabase as any)
        .from("orders")
        .update({ status })
        .eq("id", id);
      if (error) { toast.error(error.message); return; }
      
      const order = orders.find(o => o.id === id);
      if (order) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
        if (selected?.id === id) setSelected((s: any) => ({ ...s, status }));

        const updatedOrder = { ...order, status };
        if (order.customer_email) {
          try {
            await sendStatusUpdateEmail(updatedOrder, false);
            toast.success(`Order ${status} and customer notified.`);
          } catch (emailErr) {
            toast.warning(`Order ${status}, but notification email failed to send.`);
          }
        } else {
          toast.success(`Order ${status} (no email on file).`);
        }

        await logAuditAction({
          actor_id: user?.id ?? null,
          actor_email: user?.email ?? null,
          action_type: `order_status_${status}`,
          entity: "orders",
          entity_id: id,
          details: { old_status: order.status, new_status: status },
          user_id: order.user_id ?? null,
        });
      }
    } catch (err) {
      console.error("Error updating order:", err);
      toast.error("Failed to update order");
    }
  };

  const filtered = useMemo(() => {
    return orders
      .filter(o => {
        const normalizedSearch = search.toLowerCase();
        const matchSearch = !search ||
          o.customer_name?.toLowerCase().includes(normalizedSearch) ||
          o.customer_phone?.includes(normalizedSearch);
        const matchStatus = statusFilter === "all" || o.status === statusFilter;
        const paymentMethod = o.payment_method || "whatsapp";
        const matchPayment = paymentFilter === "all" || paymentMethod === paymentFilter;
        return matchSearch && matchStatus && matchPayment;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [orders, search, statusFilter, paymentFilter]);

  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === "pending").length;
    const confirmed = orders.filter(o => o.status === "confirmed").length;
    const processing = orders.filter(o => o.status === "processing").length;
    const delivered = orders.filter(o => o.status === "delivered").length;
    const cancelled = orders.filter(o => o.status === "cancelled").length;
    
    const revenue = !isModerator ? orders
      .filter(o => o.status !== "cancelled")
      .reduce((s, o) => s + Number(o.total_amount), 0) : 0;
    
    const paystackRevenue = !isModerator ? orders
      .filter(o => o.status !== "cancelled" && o.payment_method === "paystack")
      .reduce((s, o) => s + Number(o.total_amount), 0) : 0;
    
    const whatsappRevenue = !isModerator ? orders
      .filter(o => o.status !== "cancelled" && (!o.payment_method || o.payment_method === "whatsapp"))
      .reduce((s, o) => s + Number(o.total_amount), 0) : 0;
    
    return { total, pending, confirmed, processing, delivered, cancelled, revenue, paystackRevenue, whatsappRevenue };
  }, [orders, isModerator]);

  const StatusBadge = ({ status }: { status: string }) => {
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={`${config.color} gap-1 px-2 py-0.5 text-[10px] font-semibold`}>
        <Icon className="w-2.5 h-2.5" />
        {config.label}
      </Badge>
    );
  };

  const PaymentBadge = ({ method }: { method: string }) => {
    const config = paymentConfig[method] || paymentConfig.whatsapp;
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={`${config.color} gap-1 px-2 py-0.5 text-[10px] font-semibold`}>
        <Icon className="w-2.5 h-2.5" />
        {config.label}
      </Badge>
    );
  };

  const OrderCard = ({ order }: { order: any }) => (
    <div 
      onClick={() => setSelected(order)}
      className="bg-white border border-border rounded-lg p-4 space-y-3 hover:shadow-md transition-all cursor-pointer active:scale-[0.99]"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">{order.customer_name}</h3>
          <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-primary text-sm">
            {isModerator ? "KSh ****" : `KSh ${Number(order.total_amount).toLocaleString()}`}
          </p>
          <StatusBadge status={order.status} />
        </div>
      </div>
      
      <div className="flex gap-2 text-xs text-muted-foreground">
        <PaymentBadge method={order.payment_method || "whatsapp"} />
        <Badge variant="outline" className="gap-1">
          <Truck className="w-2.5 h-2.5" />
          {order.delivery_method === "delivery" ? "Delivery" : "Pickup"}
        </Badge>
      </div>
      
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {new Date(order.created_at).toLocaleDateString()}
        </span>
        <span className="flex items-center gap-1">
          {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and track all customer orders
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-3">
              <p className="text-xs text-blue-600 font-medium">Total Orders</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-3">
              <p className="text-xs text-amber-600 font-medium">Pending</p>
              <p className="text-2xl font-bold text-amber-900">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardContent className="p-3">
              <p className="text-xs text-emerald-600 font-medium">Delivered</p>
              <p className="text-2xl font-bold text-emerald-900">{stats.delivered}</p>
            </CardContent>
          </Card>
          {!isModerator && (
            <>
              <Card className="bg-gradient-to-br from-violet-50 to-violet-100 border-violet-200 col-span-2 sm:col-span-1">
                <CardContent className="p-3">
                  <p className="text-xs text-violet-600 font-medium">Total Revenue</p>
                  <p className="text-xl font-bold text-violet-900">KSh {stats.revenue.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200 col-span-2 sm:col-span-1">
                <CardContent className="p-3">
                  <p className="text-xs text-teal-600 font-medium">WhatsApp</p>
                  <p className="text-base font-bold text-teal-900">KSh {stats.whatsappRevenue.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 col-span-2 sm:col-span-1">
                <CardContent className="p-3">
                  <p className="text-xs text-emerald-600 font-medium">Paystack</p>
                  <p className="text-base font-bold text-emerald-900">KSh {stats.paystackRevenue.toLocaleString()}</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Filters - Desktop */}
        <div className="hidden md:flex flex-wrap gap-3 mb-4">
          <div className="flex gap-2 flex-wrap">
            {["all", ...STATUS_OPTIONS].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${
                  statusFilter === s
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white border border-border text-muted-foreground hover:border-primary hover:text-primary"
                }`}
              >
                {s === "all" ? `All (${stats.total})` : `${s} (${stats[s as keyof typeof stats]})`}
              </button>
            ))}
          </div>
          <Separator orientation="vertical" className="h-8" />
          <div className="flex gap-2 flex-wrap">
            {PAYMENT_METHOD_OPTIONS.map(method => (
              <button
                key={method}
                onClick={() => setPaymentFilter(method)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all capitalize ${
                  paymentFilter === method
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white border border-border text-muted-foreground hover:border-primary hover:text-primary"
                }`}
              >
                {method === "all" ? "All Methods" : method}
              </button>
            ))}
          </div>
        </div>

        {/* Filters - Mobile */}
        <div className="md:hidden flex gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMobileFilterOpen(true)}
            className="flex-1"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Search - Desktop */}
        <div className="hidden md:block relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer name or phone number..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Mobile Filter Sheet */}
        <Sheet open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
          <SheetContent side="bottom" className="rounded-t-xl">
            <SheetHeader>
              <SheetTitle>Filter Orders</SheetTitle>
              <SheetDescription>Filter by status or payment method</SheetDescription>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Status</p>
                <div className="flex flex-wrap gap-2">
                  {["all", ...STATUS_OPTIONS].map(s => (
                    <button
                      key={s}
                      onClick={() => {
                        setStatusFilter(s);
                        setIsMobileFilterOpen(false);
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all capitalize ${
                        statusFilter === s
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Payment Method</p>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_METHOD_OPTIONS.map(method => (
                    <button
                      key={method}
                      onClick={() => {
                        setPaymentFilter(method);
                        setIsMobileFilterOpen(false);
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all capitalize ${
                        paymentFilter === method
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {method === "all" ? "All" : method}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Orders Grid - Mobile */}
        <div className="md:hidden space-y-3">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-24 mb-3" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No orders found</p>
              </CardContent>
            </Card>
          ) : (
            filtered.map(order => <OrderCard key={order.id} order={order} />)
          )}
        </div>

        {/* Orders Table - Desktop */}
        <div className="hidden md:block bg-white border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Customer</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Phone</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Total</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Payment</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Delivery</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Placed</th>
                  <th className="text-right px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                )) : filtered.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium">{o.customer_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{o.customer_phone}</td>
                    <td className="px-4 py-3 font-semibold text-primary">
                      {isModerator ? "KSh ****" : `KSh ${Number(o.total_amount).toLocaleString()}`}
                    </td>
                    <td className="px-4 py-3">
                      <PaymentBadge method={o.payment_method || "whatsapp"} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="gap-1">
                        {o.delivery_method === "delivery" ? <Truck className="w-3 h-3" /> : <Package className="w-3 h-3" />}
                        {o.delivery_method === "delivery" ? "Delivery" : "Pickup"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={o.status}
                        onChange={e => updateStatus(o.id, e.target.value)}
                        className={`text-[10px] font-semibold px-2 py-1 rounded-lg border-0 outline-none cursor-pointer ${statusConfig[o.status]?.color || statusConfig.pending.color}`}
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s} className="bg-white text-foreground capitalize">{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelected(o)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && filtered.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No orders match your filters.</p>
              </div>
            )}
          </div>
        </div>

        {/* Order Detail Sheet */}
        <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            {selected && (
              <>
                <SheetHeader>
                  <SheetTitle>Order Details</SheetTitle>
                  <SheetDescription>
                    Order #{selected.id.slice(-8)}
                  </SheetDescription>
                </SheetHeader>
                
                <div className="mt-6 space-y-6">
                  {/* Status Update */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Order Status</p>
                    <select
                      value={selected.status}
                      onChange={e => updateStatus(selected.id, e.target.value)}
                      className={`w-full text-sm font-semibold px-3 py-2 rounded-lg border outline-none cursor-pointer ${statusConfig[selected.status]?.color || statusConfig.pending.color}`}
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s} className="bg-white text-foreground capitalize">{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {selected.customer_email && (
                      <Button
                        onClick={() => sendStatusUpdateEmail(selected, true)}
                        disabled={sendingEmail}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        {sendingEmail ? (
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Mail className="w-4 h-4 mr-2" />
                        )}
                        Email
                      </Button>
                    )}
                    {selected.customer_phone && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => window.open(`https://wa.me/${selected.customer_phone.replace(/\D/g, "")}`, "_blank")}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        WhatsApp
                      </Button>
                    )}
                  </div>

                  {/* Delivery Info */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Truck className="w-4 h-4" />
                      Delivery Information
                    </div>
                    {selected.delivery_method === "delivery" ? (
                      <>
                        <p className="text-sm text-muted-foreground">{selected.delivery_address || "Address not available"}</p>
                        {selected.delivery_latitude && selected.delivery_longitude && (
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto"
                            onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${selected.delivery_latitude},${selected.delivery_longitude}`, "_blank")}
                          >
                            <MapPin className="w-3 h-3 mr-1" />
                            View on Map
                          </Button>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Store Pickup</p>
                    )}
                  </div>

                  {/* Payment Info */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <CreditCard className="w-4 h-4" />
                      Payment Information
                    </div>
                    <PaymentBadge method={selected.payment_method || "whatsapp"} />
                    <p className="text-xs text-muted-foreground mt-2">
                      {selected.payment_method === "paystack"
                        ? "Card orders are only saved after payment completes."
                        : "WhatsApp orders are saved when the user clicks through to WhatsApp."}
                    </p>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Order Items</p>
                    <div className="space-y-2">
                      {(selected.items || []).map((item: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm py-2 border-b border-border last:border-0">
                          <span className="flex-1">{item.name}{item.color ? ` (${item.color})` : ""} <span className="text-muted-foreground">×{item.quantity}</span></span>
                          <span className="font-medium ml-4">KSh {(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between font-bold text-base pt-3 border-t border-border">
                      <span>Total</span>
                      <span className="text-primary">
                        {isModerator ? "KSh ****" : `KSh ${Number(selected.total_amount).toLocaleString()}`}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground text-center pt-4">
                    Placed on {new Date(selected.created_at).toLocaleString()}
                  </p>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default AdminOrders;