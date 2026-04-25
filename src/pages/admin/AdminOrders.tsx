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
import { logAuditAction } from "@/lib/audit";

const STATUS_OPTIONS = ["pending", "confirmed", "processing", "delivered", "cancelled"];
const PAYMENT_METHOD_OPTIONS = ["all", "whatsapp", "paystack"] as const;

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  pending: { label: "Pending", icon: Clock, color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  confirmed: { label: "Confirmed", icon: CheckCircle, color: "bg-sky-500/20 text-sky-400 border-sky-500/30" },
  processing: { label: "Processing", icon: Package, color: "bg-violet-500/20 text-violet-400 border-violet-500/30" },
  delivered: { label: "Delivered", icon: Truck, color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "bg-rose-500/20 text-rose-400 border-rose-500/30" },
};

const paymentConfig: Record<string, { label: string; icon: any; color: string }> = {
  whatsapp: { label: "WhatsApp", icon: MessageCircle, color: "bg-teal-500/20 text-teal-400 border-teal-500/30" },
  paystack: { label: "Paystack", icon: CreditCard, color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
};

const allowedTransitions: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

const isStatusTransitionAllowed = (currentStatus: string, newStatus: string): boolean => {
  return allowedTransitions[currentStatus]?.includes(newStatus) || false;
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
    return false;
  }

  if (isManual) setSendingEmail(true);

  try {
    // Get the current session token for authentication
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    
    // Invoke with auth header
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: order.customer_email,
        type: "status_update",
        data: {
          id: order.id,
          customer_name: order.customer_name,
          customer_email: order.customer_email,
          customer_phone: order.customer_phone,
          delivery_method: order.delivery_method,
          delivery_address: order.delivery_address,
          status: order.status,
          total_amount: order.total_amount,
          items: order.items,
          created_at: order.created_at
        }
      },
      headers: {
        Authorization: `Bearer ${currentSession?.access_token || session?.access_token}`
      }
    });

    if (error) {
      console.error("Email send failed:", error);
      if (isManual) toast.error(`Email failed: ${error.message || "Unknown error"}`);
      return false;
    }

    console.log("Email sent successfully:", data);
    
    if (isManual) {
      toast.success(`Status update email sent to ${order.customer_email}`);
    }
    return true;
  } catch (err) {
    console.error("Error sending email:", err);
    if (isManual) toast.error("Failed to send email");
    return false;
  } finally {
    if (isManual) setSendingEmail(false);
  }
};

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const order = orders.find(o => o.id === id);
      if (!order) {
        toast.error("Order not found");
        return;
      }

      const currentStatus = order.status;
      
      if (!isStatusTransitionAllowed(currentStatus, newStatus)) {
        const currentStatusLabel = statusConfig[currentStatus]?.label || currentStatus;
        const targetStatusLabel = statusConfig[newStatus]?.label || newStatus;
        const allowedStates = allowedTransitions[currentStatus]?.map(s => statusConfig[s]?.label || s) || ["none"];
        
        toast.error(`Cannot change order from "${currentStatusLabel}" to "${targetStatusLabel}". Allowed transitions: ${allowedStates.join(", ")}`);
        return;
      }

      if (newStatus === "cancelled") {
        const confirmed = window.confirm(`Are you sure you want to cancel this order for ${order.customer_name}? This action cannot be undone.`);
        if (!confirmed) return;
      }

      if (newStatus === "delivered" && currentStatus !== "delivered") {
        const confirmed = window.confirm(`Mark order #${id.slice(-8)} as delivered? This action cannot be reversed.`);
        if (!confirmed) return;
      }

      const { error } = await (supabase as any)
        .from("orders")
        .update({ status: newStatus })
        .eq("id", id);
      
      if (error) { 
        toast.error(error.message); 
        return; 
      }
      
      const updatedOrders = orders.map(o => o.id === id ? { ...o, status: newStatus } : o);
      setOrders(updatedOrders);
      if (selected?.id === id) setSelected((s: any) => ({ ...s, status: newStatus }));

      const updatedOrder = { ...order, status: newStatus };
      
      let emailSent = false;
      if (updatedOrder.customer_email) {
        try {
          emailSent = await sendStatusUpdateEmail(updatedOrder, false);
          if (emailSent) {
            toast.success(`Order ${newStatus} and customer notified.`);
          } else {
            toast.warning(`Order ${newStatus}, but notification email failed to send.`);
          }
        } catch (emailErr) {
          console.error("Email sending error:", emailErr);
          toast.warning(`Order ${newStatus}, but notification email failed to send.`);
        }
      } else {
        toast.success(`Order ${newStatus} (no email on file).`);
      }

      await logAuditAction({
        actor_id: user?.id ?? null,
        actor_email: user?.email ?? null,
        action_type: `order_status_${newStatus}`,
        entity: "orders",
        entity_id: id,
        details: { 
          old_status: currentStatus, 
          new_status: newStatus,
          actor_role: role,
          email_sent: emailSent,
          customer_email: updatedOrder.customer_email
        },
        user_id: order.user_id ?? null,
      });
      
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
      className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3 hover:bg-white/10 transition-all cursor-pointer active:scale-[0.99]"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-white truncate">{order.customer_name}</h3>
          <p className="text-xs text-white/50">{order.customer_phone}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-primary text-sm">
            {isModerator ? "KSh ****" : `KSh ${Number(order.total_amount).toLocaleString()}`}
          </p>
          <StatusBadge status={order.status} />
        </div>
      </div>
      
      <div className="flex gap-2 text-xs">
        <PaymentBadge method={order.payment_method || "whatsapp"} />
        <Badge variant="outline" className="gap-1 border-white/20 text-white/60">
          <Truck className="w-2.5 h-2.5" />
          {order.delivery_method === "delivery" ? "Delivery" : "Pickup"}
        </Badge>
      </div>
      
      <div className="flex justify-between items-center text-xs text-white/40">
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
    <div className="min-h-screen bg-gradient-to-b from-[hsl(240,10%,3.9%)] to-[hsl(240,10%,4.5%)]">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Orders</h1>
          <p className="text-sm text-white/50 mt-1">Manage and track all customer orders</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <Card className="bg-gradient-to-br from-primary/20 to-primary/10 border-primary/30">
            <CardContent className="p-3">
              <p className="text-xs text-primary font-medium">Total Orders</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500/20 to-amber-500/10 border-amber-500/30">
            <CardContent className="p-3">
              <p className="text-xs text-amber-400 font-medium">Pending</p>
              <p className="text-2xl font-bold text-white">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 border-emerald-500/30">
            <CardContent className="p-3">
              <p className="text-xs text-emerald-400 font-medium">Delivered</p>
              <p className="text-2xl font-bold text-white">{stats.delivered}</p>
            </CardContent>
          </Card>
          {!isModerator && (
            <>
              <Card className="bg-gradient-to-br from-violet-500/20 to-violet-500/10 border-violet-500/30">
                <CardContent className="p-3">
                  <p className="text-xs text-violet-400 font-medium">Total Revenue</p>
                  <p className="text-xl font-bold text-white">KSh {stats.revenue.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-teal-500/20 to-teal-500/10 border-teal-500/30">
                <CardContent className="p-3">
                  <p className="text-xs text-teal-400 font-medium">WhatsApp</p>
                  <p className="text-base font-bold text-white">KSh {stats.whatsappRevenue.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 border-emerald-500/30">
                <CardContent className="p-3">
                  <p className="text-xs text-emerald-400 font-medium">Paystack</p>
                  <p className="text-base font-bold text-white">KSh {stats.paystackRevenue.toLocaleString()}</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div className="hidden md:flex flex-wrap gap-3 mb-4">
          <div className="flex gap-2 flex-wrap">
            {["all", ...STATUS_OPTIONS].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all capitalize ${
                  statusFilter === s
                    ? "bg-primary text-white shadow-lg shadow-primary/25"
                    : "bg-white/5 border border-white/10 text-white/70 hover:border-primary/50 hover:text-primary"
                }`}
              >
                {s === "all" ? `All (${stats.total})` : `${s} (${stats[s as keyof typeof stats]})`}
              </button>
            ))}
          </div>
          <Separator orientation="vertical" className="h-8 bg-white/10" />
          <div className="flex gap-2 flex-wrap">
            {PAYMENT_METHOD_OPTIONS.map(method => (
              <button
                key={method}
                onClick={() => setPaymentFilter(method)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all capitalize ${
                  paymentFilter === method
                    ? "bg-primary text-white shadow-lg shadow-primary/25"
                    : "bg-white/5 border border-white/10 text-white/70 hover:border-primary/50 hover:text-primary"
                }`}
              >
                {method === "all" ? "All Methods" : method}
              </button>
            ))}
          </div>
        </div>

        <div className="md:hidden flex gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={() => setIsMobileFilterOpen(true)} className="flex-1 border-white/10 text-white hover:bg-white/10">
            <Filter className="w-4 h-4 mr-2" />Filters
          </Button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 bg-black/30 border-white/10 text-white placeholder:text-white/30" />
          </div>
        </div>

        <div className="hidden md:block relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input placeholder="Search by customer name or phone number..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 bg-black/30 border-white/10 text-white placeholder:text-white/30" />
        </div>

        <Sheet open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
          <SheetContent side="bottom" className="rounded-t-xl bg-[hsl(240,10%,6%)] border-white/10">
            <SheetHeader>
              <SheetTitle className="text-white">Filter Orders</SheetTitle>
              <SheetDescription className="text-white/50">Filter by status or payment method</SheetDescription>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm font-medium text-white mb-2">Status</p>
                <div className="flex flex-wrap gap-2">
                  {["all", ...STATUS_OPTIONS].map(s => (
                    <button key={s} onClick={() => { setStatusFilter(s); setIsMobileFilterOpen(false); }} className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all capitalize ${statusFilter === s ? "bg-primary text-white" : "bg-white/10 text-white/70"}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-white mb-2">Payment Method</p>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_METHOD_OPTIONS.map(method => (
                    <button key={method} onClick={() => { setPaymentFilter(method); setIsMobileFilterOpen(false); }} className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all capitalize ${paymentFilter === method ? "bg-primary text-white" : "bg-white/10 text-white/70"}`}>{method === "all" ? "All" : method}</button>
                  ))}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <div className="md:hidden space-y-3">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-32 bg-white/10 mb-2" />
                  <Skeleton className="h-3 w-24 bg-white/10 mb-3" />
                  <Skeleton className="h-8 w-full bg-white/10 rounded" />
                </CardContent>
              </Card>
            ))
          ) : filtered.length === 0 ? (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-8 text-center"><p className="text-white/50">No orders found</p></CardContent>
            </Card>
          ) : (
            filtered.map(order => <OrderCard key={order.id} order={order} />)
          )}
        </div>

        <div className="hidden md:block bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/10 border-b border-white/10">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-white/50">Customer</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-white/50">Phone</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-white/50">Total</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-white/50">Payment</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-white/50">Delivery</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-white/50">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-white/50">Placed</th>
                  <th className="text-right px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {loading ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 8 }).map((_, j) => (<td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full bg-white/10" /></td>))}</tr>
                )) : filtered.map(o => (
                  <tr key={o.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{o.customer_name}</td>
                    <td className="px-4 py-3 text-white/60">{o.customer_phone}</td>
                    <td className="px-4 py-3 font-semibold text-primary">{isModerator ? "KSh ****" : `KSh ${Number(o.total_amount).toLocaleString()}`}</td>
                    <td className="px-4 py-3"><PaymentBadge method={o.payment_method || "whatsapp"} /></td>
                    <td className="px-4 py-3"><Badge variant="outline" className="gap-1 border-white/20 text-white/60">{o.delivery_method === "delivery" ? <Truck className="w-3 h-3" /> : <Package className="w-3 h-3" />}{o.delivery_method === "delivery" ? "Delivery" : "Pickup"}</Badge></td>
                    <td className="px-4 py-3">
                      <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)} className={`text-[10px] font-semibold px-2 py-1 rounded-lg border-0 outline-none cursor-pointer bg-transparent ${statusConfig[o.status]?.color || statusConfig.pending.color}`}>
                        {STATUS_OPTIONS.map(s => (<option key={s} value={s} disabled={!isStatusTransitionAllowed(o.status, s)} className="bg-[hsl(240,10%,6%)] text-white capitalize">{s}</option>))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-white/50 text-xs">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right"><Button variant="ghost" size="sm" onClick={() => setSelected(o)} className="text-white/60 hover:text-primary"><Eye className="w-4 h-4" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && filtered.length === 0 && (<div className="text-center py-12"><p className="text-white/50">No orders match your filters.</p></div>)}
          </div>
        </div>

        <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-[hsl(240,10%,6%)] border-l border-white/10">
            {selected && (
              <>
                <SheetHeader>
                  <SheetTitle className="text-white">Order Details</SheetTitle>
                  <SheetDescription className="text-white/50">Order #{selected.id.slice(-8)}</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-white">Order Status</p>
                    <select value={selected.status} onChange={e => updateStatus(selected.id, e.target.value)} className={`w-full text-sm font-semibold px-3 py-2 rounded-lg border outline-none cursor-pointer bg-black/30 ${statusConfig[selected.status]?.color || statusConfig.pending.color}`}>
                      {STATUS_OPTIONS.map(s => (<option key={s} value={s} disabled={!isStatusTransitionAllowed(selected.status, s)} className="bg-[hsl(240,10%,6%)] text-white capitalize">{s}</option>))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    {selected.customer_email && (
                      <Button onClick={() => sendStatusUpdateEmail(selected, true)} disabled={sendingEmail} variant="outline" size="sm" className="flex-1 border-white/10 text-white hover:bg-white/10">
                        {sendingEmail ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}Email
                      </Button>
                    )}
                    {selected.customer_phone && (
                      <Button variant="outline" size="sm" className="flex-1 border-white/10 text-white hover:bg-white/10" onClick={() => window.open(`https://wa.me/${selected.customer_phone.replace(/\D/g, "")}`, "_blank")}>
                        <MessageCircle className="w-4 h-4 mr-2" />WhatsApp
                      </Button>
                    )}
                  </div>
                  <div className="bg-black/30 rounded-xl p-4 space-y-2 border border-white/10">
                    <div className="flex items-center gap-2 text-sm font-medium text-white"><Truck className="w-4 h-4 text-primary" />Delivery Information</div>
                    {selected.delivery_method === "delivery" ? (
                      <>
                        <p className="text-sm text-white/60">{selected.delivery_address || "Address not available"}</p>
                        {selected.delivery_latitude && selected.delivery_longitude && (
                          <Button variant="link" size="sm" className="p-0 h-auto text-primary" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${selected.delivery_latitude},${selected.delivery_longitude}`, "_blank")}><MapPin className="w-3 h-3 mr-1" />View on Map</Button>
                        )}
                      </>
                    ) : (<p className="text-sm text-white/60">Store Pickup</p>)}
                  </div>
                  <div className="bg-black/30 rounded-xl p-4 space-y-2 border border-white/10">
                    <div className="flex items-center gap-2 text-sm font-medium text-white"><CreditCard className="w-4 h-4 text-primary" />Payment Information</div>
                    <PaymentBadge method={selected.payment_method || "whatsapp"} />
                    <p className="text-xs text-white/40 mt-2">{selected.payment_method === "paystack" ? "Card orders are only saved after payment completes." : "WhatsApp orders are saved when the user clicks through to WhatsApp."}</p>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-white">Order Items</p>
                    <div className="space-y-2">
                      {(selected.items || []).map((item: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm py-2 border-b border-white/10 last:border-0">
                          <span className="flex-1 text-white/80">{item.name}{item.color ? ` (${item.color})` : ""} <span className="text-white/40">×{item.quantity}</span></span>
                          <span className="font-medium text-white ml-4">KSh {(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between font-bold text-base pt-3 border-t border-white/10">
                      <span className="text-white">Total</span>
                      <span className="text-primary">{isModerator ? "KSh ****" : `KSh ${Number(selected.total_amount).toLocaleString()}`}</span>
                    </div>
                  </div>
                  <p className="text-xs text-white/30 text-center pt-4">Placed on {new Date(selected.created_at).toLocaleString()}</p>
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