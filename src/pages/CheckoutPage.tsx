import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const CheckoutPage = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [delivery, setDelivery] = useState("pickup");
  const [address, setAddress] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) { toast.error("Cart is empty"); return; }

    const productList = items.map(i => `• ${i.name} x${i.quantity} - KSh ${(i.price * i.quantity).toLocaleString()}`).join("\n");
    const message = `🛒 *New Order from TechMobile KE*\n\n*Customer:* ${name}\n*Phone:* ${phone}\n*Email:* ${email}\n*Delivery:* ${delivery === "delivery" ? `Delivery to: ${address}` : "Pickup"}\n\n*Products:*\n${productList}\n\n*Total: KSh ${totalPrice.toLocaleString()}*`;

    const whatsappUrl = `https://wa.me/254759001048?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
    clearCart();
    toast.success("Order sent via WhatsApp!");
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <Link to="/" className="text-primary hover:underline">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      <div className="container py-8 max-w-2xl">
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Shop
        </Link>
        <h1 className="text-2xl font-bold mb-6">Checkout</h1>

        <div className="bg-card rounded-xl p-6 shadow-card mb-6">
          <h2 className="font-semibold mb-4">Order Summary</h2>
          {items.map(item => (
            <div key={item.product_id} className="flex justify-between text-sm py-2 border-b last:border-0">
              <span>{item.name} x{item.quantity}</span>
              <span className="font-medium">KSh {(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-lg mt-4 pt-2 border-t">
            <span>Total</span>
            <span className="text-primary">KSh {totalPrice.toLocaleString()}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-xl p-6 shadow-card space-y-4">
          <h2 className="font-semibold mb-2">Your Details</h2>
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

          <Button type="submit" className="w-full" size="lg">
            <MessageCircle className="w-4 h-4 mr-2" /> Complete Order via WhatsApp
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;
