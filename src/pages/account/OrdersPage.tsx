import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader, ChevronDown } from "lucide-react";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_method: string;
  delivery_address: string | null;
  items: any[];
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
}

const OrdersPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const statusColors: Record<string, { bg: string; text: string }> = {
    pending: { bg: "bg-yellow-100", text: "text-yellow-900" },
    confirmed: { bg: "bg-gray-200", text: "text-gray-900" },
    processing: { bg: "bg-purple-100", text: "text-purple-900" },
    delivered: { bg: "bg-green-100", text: "text-green-900" },
    cancelled: { bg: "bg-red-100", text: "text-red-900" },
  };

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setOrders((data as unknown as Order[]) || []);
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast.error("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopBar />
        <Header />
        <div className="flex-1 flex items-center justify-center bg-secondary">
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Loading your orders...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopBar />
        <Header />
        <div className="flex-1 flex items-center justify-center bg-secondary">
          <div className="text-center px-4">
            <h2 className="text-xl sm:text-2xl font-bold mb-4">
              Sign in to view your orders
            </h2>
            <Link to="/auth" className="text-primary hover:underline">
              Go to Login
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-secondary">
      <TopBar />
      <Header />
      <main className="flex-1">
        <div className="container py-6 sm:py-8 max-w-4xl">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Shop
          </Link>

          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-6">My Orders</h1>

          {orders.length === 0 ? (
            <div className="bg-card rounded-lg p-8 text-center">
              <p className="text-muted-foreground mb-4">You haven't placed any orders yet.</p>
              <Link to="/products">
                <Button>Start Shopping</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-card rounded-lg border border-border overflow-hidden"
                >
                  {/* Collapsed View */}
                  <button
                    onClick={() =>
                      setExpandedOrder(expandedOrder === order.id ? null : order.id)
                    }
                    className="w-full p-4 sm:p-6 hover:bg-secondary/50 transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <h3 className="font-bold">Order #{order.id.slice(0, 8)}</h3>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded capitalize ${
                            statusColors[order.status]?.bg || "bg-gray-100"
                          } ${statusColors[order.status]?.text || "text-gray-900"}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {new Date(order.created_at).toLocaleDateString("en-KE", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="font-bold text-primary">
                        KSh {order.total_amount.toLocaleString()}
                      </p>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 flex-shrink-0 transition-transform ${
                        expandedOrder === order.id ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Expanded View */}
                  {expandedOrder === order.id && (
                    <div className="border-t border-border p-4 sm:p-6 bg-secondary/30 space-y-4">
                      {/* Order Items */}
                      <div>
                        <h4 className="font-semibold mb-3">Order Items</h4>
                        <div className="space-y-2">
                          {order.items.map((item: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex justify-between text-sm py-2 border-b border-border/50 last:border-0"
                            >
                              <span>
                                {item.name}{item.color ? ` (${item.color})` : ""} x{item.quantity}
                              </span>
                              <span className="font-medium">
                                KSh {(item.price * item.quantity).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Delivery Info */}
                      <div>
                        <h4 className="font-semibold mb-3">Delivery Details</h4>
                        <div className="space-y-1 text-sm">
                          <p>
                            <span className="text-muted-foreground">Method:</span>{" "}
                            {order.delivery_method === "delivery" ? "Delivery" : "Pickup"}
                          </p>
                          {order.delivery_method === "delivery" && (
                            <p>
                              <span className="text-muted-foreground">Address:</span>{" "}
                              {order.delivery_address}
                            </p>
                          )}
                          <p>
                            <span className="text-muted-foreground">Phone:</span>{" "}
                            {order.customer_phone}
                          </p>
                        </div>
                      </div>

                      {/* Status Timeline */}
                      <div>
                        <h4 className="font-semibold mb-3">Status History</h4>
                        <div className="space-y-2 text-sm">
                          <p>
                            <span className="text-muted-foreground">Created:</span>{" "}
                            {new Date(order.created_at).toLocaleString("en-KE")}
                          </p>
                          <p>
                            <span className="text-muted-foreground">Last Updated:</span>{" "}
                            {new Date(order.updated_at).toLocaleString("en-KE")}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Current Status: <span className="font-semibold capitalize">{order.status}</span>
                          </p>
                        </div>
                      </div>

                      {/* Full Order ID */}
                      <div className="bg-background/50 p-3 rounded border border-border/50">
                        <p className="text-xs text-muted-foreground mb-1">Full Order ID</p>
                        <p className="font-mono text-xs break-all text-primary">{order.id}</p>
                      </div>

                      {/* Action Button */}
                      <Link to={`/order/${order.id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          View Full Details
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrdersPage;
