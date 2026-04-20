import { useEffect, useState } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { MessageCircle, ArrowLeft, Loader } from "lucide-react";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { API_URL, WHATSAPP_NUMBER, PAYSTACK_PUBLIC_KEY } from "@/lib/constants";
import { payWithPaystack } from "@/lib/paystack";
import { supabase } from "@/integrations/supabase/client";

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
  payment_method?: string | null;
  created_at: string;
}

const OrderConfirmationPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const isPending = order?.status === "pending";

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        navigate("/");
        return;
      }

      const token = searchParams.get("token");
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch(
        `${API_URL}/api/order/${orderId}${token ? `?token=${token}` : ""}`,
        {
          headers,
        }
      );

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        console.error("Order fetch failed", response.status, errorBody);
        toast.error("Order not found or unauthorized");
        navigate("/");
        return;
      }

      const payload = await response.json();
      const order = payload.order as Order;
      setOrder(order);
      setLoading(false);
    };

    fetchOrder();
  }, [orderId, user, navigate]);

  const handleWhatsAppRedirect = () => {
    const productList = order?.items
      .map(
        (i: any) =>
          `• ${i.name}${i.color ? ` (${i.color})` : ""} x${i.quantity} - KSh ${(i.price * i.quantity).toLocaleString()}`
      )
      .join("\n");

    const message = `🛒 *Order Confirmation*\n\n*Order ID:* ${order?.id}\n*Customer:* ${order?.customer_name}\n*Phone:* ${order?.customer_phone}\n*Email:* ${order?.customer_email}\n\n*Products:*\n${productList}\n\n*Total: KSh ${order?.total_amount.toLocaleString()}*\n\n*Delivery Method:* ${
      order?.delivery_method === "delivery"
        ? `Delivery to: ${order?.delivery_address}`
        : "Pickup"
    }`;

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handlePayWithCard = async () => {
    if (!order) return;
    if (!PAYSTACK_PUBLIC_KEY) {
      toast.error("Paystack public key is not configured.");
      return;
    }

    setIsPaying(true);

    try {
      await payWithPaystack(
        {
          amount: order.total_amount,
          email: order.customer_email || user?.email || "",
          orderId: order.id,
          userId: user?.id ?? undefined,
        },
        PAYSTACK_PUBLIC_KEY
      );

      toast.success("Payment completed. We are verifying your order.");

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", order.id)
        .single();

      if (!error && data) {
        setOrder(data as Order);
      }
    } catch (err) {
      console.error(err);
      toast.error("Card payment was not completed.");
    } finally {
      setIsPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopBar />
        <Header />
        <div className="flex-1 flex items-center justify-center bg-secondary">
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Loading your order...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopBar />
        <Header />
        <div className="flex-1 flex items-center justify-center bg-secondary">
          <div className="text-center">
            <p className="mb-4">Order not found</p>
            <Link to="/" className="text-primary hover:underline">
              Back to Shop
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
        <div className="container py-6 sm:py-8 max-w-2xl">
          <Link
            to={user ? "/account/orders" : "/"}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> {user ? "Back to Orders" : "Back to Shop"}
          </Link>

          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6 mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-green-900 mb-2">
              ✓ Order Confirmed!
            </h1>
            <p className="text-green-700">Thank you for your order.</p>
          </div>

          {/* Order Details */}
          <div className="bg-card rounded-lg p-4 sm:p-6 mb-6 border border-border">
            <div className="mb-6 pb-6 border-b border-border">
              <h2 className="font-bold text-lg mb-3">Order ID</h2>
              <p className="font-mono text-sm bg-secondary p-3 rounded text-primary break-all">
                {order.id}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Save this ID for your records
              </p>
            </div>

            {/* Customer Info */}
            <div className="mb-6 pb-6 border-b border-border">
              <h2 className="font-semibold mb-3">Customer Information</h2>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Name:</span> {order.customer_name}
                </p>
                <p>
                  <span className="text-muted-foreground">Phone:</span> {order.customer_phone}
                </p>
                <p>
                  <span className="text-muted-foreground">Email:</span> {order.customer_email}
                </p>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="mb-6 pb-6 border-b border-border">
              <h2 className="font-semibold mb-3">Delivery Details</h2>
              <div className="space-y-2 text-sm">
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
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6 pb-6 border-b border-border">
              <h2 className="font-semibold mb-3">Order Items</h2>
              <div className="space-y-2 text-sm">
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between py-2">
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

            {/* Total */}
            <div className="flex justify-between items-center font-bold text-lg mb-6">
              <span>Total Amount</span>
              <span className="text-primary">KSh {order.total_amount.toLocaleString()}</span>
            </div>

            {/* Status */}
            <div className="bg-secondary/50 p-3 rounded">
              <p className="text-xs text-muted-foreground mb-1">Current Status</p>
              <p className="font-semibold text-sm capitalize bg-gray-200 text-gray-900 w-fit px-3 py-1 rounded">
                {order.status}
              </p>
            </div>
          </div>

          {/* Order Actions */}
          <div className="space-y-3">
            <div className="rounded-lg border border-border p-4 bg-secondary/80">
              <p className="text-sm text-muted-foreground">
                Your order is confirmed. You will receive an email and SMS once it is ready for delivery or pickup.
              </p>
            </div>

            {user ? (
              <Link to="/account/orders" className="block">
                <Button variant="ghost" size="lg" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" /> View All Orders
                </Button>
              </Link>
            ) : (
              <Link to="/" className="block">
                <Button variant="ghost" size="lg" className="w-full">
                  Continue Shopping
                </Button>
              </Link>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderConfirmationPage;
