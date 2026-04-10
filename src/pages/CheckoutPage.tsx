import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { payWithPaystack } from "@/lib/paystack";
import { API_URL, ADMIN_NOTIFICATION_EMAIL, PAYSTACK_PUBLIC_KEY, WHATSAPP_NUMBER } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const CheckoutPage = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [delivery, setDelivery] = useState("pickup");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"whatsapp" | "paystack">("whatsapp");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [whatsappOrderPlaced, setWhatsappOrderPlaced] = useState(false);

  const buildWhatsAppLink = (orderId: string) => {
    const itemLines = items
      .map((item) => `${item.quantity} x ${item.name} (KSh ${item.price.toLocaleString()})`)
      .join("\n");

    const message = `Hello! I want to place an order:\n${itemLines}\n\nTotal: KSh ${totalPrice.toLocaleString()}\nName: ${name}\nPhone: ${phone}\nEmail: ${email}\n${delivery === "delivery" ? `Delivery address: ${address}\n` : "Pickup\n"}Order ID: ${orderId}`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  const sendConfirmationEmail = async (orderData: any) => {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`${API_URL}/api/send-email`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          to: orderData.customer_email,
          type: "order_confirmation",
          data: {
            order_id: orderData.id,
            guest_access_token: orderData.guest_access_token,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Email API error: ${response.status}`);
      }

      const result = await response.json();
      console.log("Confirmation email sent successfully:", result);
    } catch (error) {
      console.warn("Email send error:", error);
      // Don't fail the order if email fails to send
    }
  };

  const sendAdminNotificationEmail = async (orderData: any) => {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`${API_URL}/api/send-email`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          to: ADMIN_NOTIFICATION_EMAIL,
          type: "order_notification",
          data: orderData,
        }),
      });

      if (!response.ok) {
        throw new Error(`Admin email API error: ${response.status}`);
      }

      const result = await response.json();
      console.log("Admin notification email sent successfully:", result);
    } catch (error) {
      console.warn("Admin notification email send error:", error);
    }
  };

  const createOrder = async (payload: any) => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    const response = await fetch(`${API_URL}/api/orders`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || `Order API failed with status ${response.status}`);
    }

    const result = await response.json();
    return result.order;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    setIsSubmitting(true);
    try {
      const guestAccessToken = user
        ? null
        : crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const orderPayload = {
        user_id: user?.id || null,
        customer_name: name,
        customer_phone: phone,
        customer_email: email || null,
        delivery_method: delivery,
        delivery_address: delivery === "delivery" ? address : null,
        items: items.map((i) => ({
          product_id: i.product_id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
        total_amount: totalPrice,
        status: "pending",
        payment_method: paymentMethod,
        guest_access_token: guestAccessToken,
      };

      if (paymentMethod === "whatsapp") {
        const data = await createOrder(orderPayload);
        const waLink = buildWhatsAppLink(data.id);
        if (data.customer_email) {
          sendConfirmationEmail(data);
        }
        sendAdminNotificationEmail(data);
        clearCart();
        setWhatsappOrderPlaced(true);
        toast.success("Thank you for your order!");
        window.open(waLink, "_blank");
        return;
      }

      if (paymentMethod === "paystack") {
        if (!PAYSTACK_PUBLIC_KEY) throw new Error("Missing Paystack public key");

        const order = await createOrder({
          ...orderPayload,
          status: "pending",
          payment_method: "paystack",
        });

        await payWithPaystack(
          {
            amount: order.total_amount,
            email: order.customer_email || "",
            orderId: order.id,
            userId: user?.id,
            metadata: {
              guest_access_token: order.guest_access_token,
            },
          },
          PAYSTACK_PUBLIC_KEY,
        );

        if (order.customer_email) {
          sendConfirmationEmail(order);
        }
        sendAdminNotificationEmail(order);

        clearCart();
        toast.success("Payment completed and order created! Redirecting to confirmation...");
        navigate(`/order/${order.id}${order.guest_access_token ? `?token=${order.guest_access_token}` : ""}`);
        return;
      }

      const data = await createOrder(orderPayload);

      if (data.customer_email) {
        sendConfirmationEmail(data);
      }
      sendAdminNotificationEmail(data);

      clearCart();
      toast.success("Order created! Redirecting to confirmation...");
      navigate(`/order/${data.id}${data.guest_access_token ? `?token=${data.guest_access_token}` : ""}`);
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Failed to create order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopBar /><Header />
        <div className="flex-1 flex items-center justify-center bg-secondary">
          <div className="text-center px-4">
            {whatsappOrderPlaced ? (
              <>
                <h2 className="text-xl sm:text-2xl font-bold mb-4">Thank you for your order!</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Your WhatsApp order has been created and the payment page will open in a new tab.
                </p>
                <Link to="/" className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90">
                  Continue Shopping
                </Link>
              </>
            ) : (
              <>
                <h2 className="text-xl sm:text-2xl font-bold mb-4">Your cart is empty</h2>
                <Link to="/" className="text-primary hover:underline">Continue Shopping</Link>
              </>
            )}
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
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Shop
          </Link>
          <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold mb-6">Checkout</h1>

          <div className="bg-card rounded-xl p-4 sm:p-6 shadow-card mb-6">
            <h2 className="font-semibold text-base sm:text-lg mb-4">Order Summary</h2>
            {items.map(item => (
              <div key={item.product_id} className="flex justify-between text-sm py-2 border-b last:border-0 gap-2">
                <span className="flex-1 min-w-0 truncate">{item.name} x{item.quantity}</span>
                <span className="font-medium flex-shrink-0">KSh {(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-base sm:text-lg mt-4 pt-2 border-t">
              <span>Total</span>
              <span className="text-primary">KSh {totalPrice.toLocaleString()}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-card rounded-xl p-4 sm:p-6 shadow-card space-y-4">
            <h2 className="font-semibold text-base sm:text-lg mb-2">Your Details</h2>
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="+254..." />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            <div>
              <Label>Delivery Method</Label>
              <RadioGroup value={delivery} onValueChange={setDelivery} className="mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pickup" id="pickup" />
                  <Label htmlFor="pickup">Pickup (Free)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <Label htmlFor="delivery">Delivery</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Payment Method</Label>
              <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as "whatsapp" | "paystack")} className="mt-2">
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="whatsapp" id="payment-whatsapp" />
                    <span>WhatsApp Checkout</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="paystack" id="payment-paystack" />
                    <span>Card Payment</span>
                  </label>
                </div>
              </RadioGroup>
            </div>

            {delivery === "delivery" && (
              <div>
                <Label htmlFor="address">Delivery Address</Label>
                <Input id="address" value={address} onChange={e => setAddress(e.target.value)} required placeholder="Enter your delivery address" />
              </div>
            )}

            <Button type="submit" className="w-full text-base sm:text-lg" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating Order...
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 mr-2" /> Place Order
                </>
              )}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CheckoutPage;
