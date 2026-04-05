import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [delivery, setDelivery] = useState("pickup");
  const [address, setAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sendConfirmationEmail = async (orderData: any) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      
      const response = await fetch(`${apiUrl}/api/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: orderData.customer_email,
          type: "order_confirmation",
          data: orderData,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    setIsSubmitting(true);
    try {
      // Save order to Supabase
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
      };

      const { data, error } = await supabase
        .from("orders")
        .insert(orderPayload)
        .select("*")
        .single();

      if (error) throw error;

      // Send confirmation email in background (don't wait for it)
      if (data.customer_email) {
        sendConfirmationEmail(data);
      }

      clearCart();
      toast.success("Order created! Redirecting to confirmation...");
      
      // Redirect to confirmation page with order ID
      navigate(`/order/${data.id}`);
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
            <h2 className="text-xl sm:text-2xl font-bold mb-4">Your cart is empty</h2>
            <Link to="/" className="text-primary hover:underline">Continue Shopping</Link>
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
