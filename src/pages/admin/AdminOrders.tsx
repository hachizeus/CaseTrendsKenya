import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, Eye, X, Mail, Loader } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "@/lib/constants";

const STATUS_OPTIONS = ["pending", "confirmed", "processing", "delivered", "cancelled"];

const statusStyle: Record<string, string> = {
  pending:    "bg-yellow-100 text-yellow-700",
  confirmed:  "bg-blue-100 text-blue-700",
  processing: "bg-violet-100 text-violet-700",
  delivered:  "bg-emerald-100 text-emerald-700",
  cancelled:  "bg-red-100 text-red-600",
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<any>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    try {
      const { data, error } = await (supabase
        .from("orders" as any)
        .select("*")
        .order("created_at", { ascending: false }) as any);
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
      console.warn("No email address on file for order:", order.id);
      return;
    }

    if (isManual) {
      setSendingEmail(true);
    }

    try {
      const emailBody = {
        to: order.customer_email,
        type: "status_update",
        data: order,
      };
      
      console.log("Sending status update email for order", order.id, "to", order.customer_email);
      
      const response = await fetch(`${API_URL}/api/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailBody),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        console.error("Email send failed - Status:", response.status, "Response:", responseData);
        if (isManual) {
          toast.error(`Email failed: ${responseData.error || "Unknown error"}`);
        }
        throw new Error(responseData.error || "Failed to send email");
      }

      console.log("Status update email sent successfully to", order.customer_email);
      if (isManual) {
        toast.success(`Status update email sent to ${order.customer_email}`);
      }
    } catch (err) {
      console.error("Error sending email:", err);
      if (isManual) {
        toast.error(`Failed to send email: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    } finally {
      if (isManual) {
        setSendingEmail(false);
      }
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await (supabase
        .from("orders" as any)
        .update({ status })
        .eq("id", id) as any);
      if (error) { toast.error(error.message); return; }
      
      const order = orders.find(o => o.id === id);
      if (order) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
        if (selected?.id === id) setSelected((s: any) => ({ ...s, status }));
        
        toast.success(`Order marked as ${status}`);
        
        // Send status update email automatically (without toasts)
        const updatedOrder = { ...order, status };
        try {
          await sendStatusUpdateEmail(updatedOrder, false);
        } catch (emailErr) {
          console.error("Email send failed but order status was updated:", emailErr);
          // Don't fail order update if email fails - just log it
        }
      }
    } catch (err) {
      console.error("Error updating order:", err);
      toast.error("Failed to update order");
    }
  };

  const filtered = orders.filter(o => {
    const matchSearch = !search ||
      o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_phone?.includes(search);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRevenue = orders
    .filter(o => o.status !== "cancelled")
    .reduce((s, o) => s + Number(o.total_amount), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold">Orders</h1>
          <p className="text-sm text-muted-foreground">
            {orders.length} total · KSh {totalRevenue.toLocaleString()} revenue
          </p>
        </div>
      </div>

      {/* Status summary pills */}
      <div className="flex gap-2 flex-wrap">
        {["all", ...STATUS_OPTIONS].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 text-xs font-semibold border transition-colors capitalize ${
              statusFilter === s
                ? "bg-primary text-white border-primary"
                : "bg-white border-border text-muted-foreground hover:border-primary hover:text-primary"
            }`}
          >
            {s === "all" ? `All (${orders.length})` : `${s} (${orders.filter(o => o.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Customer</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground hidden sm:table-cell">Phone</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Total</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground hidden md:table-cell">Delivery</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Date</th>
                <th className="text-right px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={7} className="px-4 py-3">
                    <div className="h-3 bg-secondary rounded animate-pulse" />
                  </td>
                </tr>
              )) : filtered.map(o => (
                <tr key={o.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{o.customer_name}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{o.customer_phone}</td>
                  <td className="px-4 py-3 font-semibold text-primary">KSh {Number(o.total_amount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell capitalize">{o.delivery_method}</td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      onChange={e => updateStatus(o.id, e.target.value)}
                      className={`text-[10px] font-semibold px-2 py-0.5 border-0 outline-none cursor-pointer ${statusStyle[o.status] || "bg-secondary text-foreground"}`}
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s} className="bg-white text-foreground capitalize">{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                    {new Date(o.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelected(o)}
                      className="p-1.5 hover:bg-secondary border border-transparent hover:border-border transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && (
            <p className="text-muted-foreground text-center py-12 text-sm">
              {search || statusFilter !== "all" ? "No orders match your filters." : "No orders yet."}
            </p>
          )}
        </div>
      </div>

      {/* Order detail panel */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setSelected(null)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-white">
                <h2 className="font-bold text-sm">Order Details</h2>
                <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-secondary transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Status */}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Status</p>
                  <select
                    value={selected.status}
                    onChange={e => updateStatus(selected.id, e.target.value)}
                    className={`text-xs font-semibold px-3 py-1.5 border outline-none cursor-pointer ${statusStyle[selected.status]}`}
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s} className="bg-white text-foreground capitalize">{s}</option>
                    ))}
                  </select>
                </div>

                {/* Resend Email Button */}
                {selected.customer_email && (
                  <Button
                    onClick={() => sendStatusUpdateEmail(selected, true)}
                    disabled={sendingEmail}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    {sendingEmail ? (
                      <>
                        <Loader className="w-3.5 h-3.5 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-3.5 h-3.5 mr-2" />
                        Resend Status Email
                      </>
                    )}
                  </Button>
                )}

                {/* Customer */}
                <div className="bg-secondary p-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Customer</p>
                  <p className="text-sm font-medium">{selected.customer_name}</p>
                  <p className="text-sm text-muted-foreground">{selected.customer_phone}</p>
                  {selected.customer_email && <p className="text-sm text-muted-foreground">{selected.customer_email}</p>}
                  <p className="text-sm text-muted-foreground capitalize">
                    {selected.delivery_method === "delivery"
                      ? `Delivery → ${selected.delivery_address}`
                      : "Pickup"}
                  </p>
                </div>

                {/* Items */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Items</p>
                  <div className="space-y-2">
                    {(selected.items || []).map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-sm py-2 border-b border-border last:border-0">
                        <span className="flex-1 min-w-0 truncate">{item.name} <span className="text-muted-foreground">×{item.quantity}</span></span>
                        <span className="font-medium ml-4 flex-shrink-0">KSh {(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between font-bold text-base mt-3 pt-3 border-t border-border">
                    <span>Total</span>
                    <span className="text-primary">KSh {Number(selected.total_amount).toLocaleString()}</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Placed on {new Date(selected.created_at).toLocaleString()}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminOrders;
