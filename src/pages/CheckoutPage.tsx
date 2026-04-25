import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { payWithPaystack } from "@/lib/paystack";
import { API_URL, ADMIN_NOTIFICATION_EMAIL, PAYSTACK_PUBLIC_KEY, WHATSAPP_NUMBER } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, MessageCircle, Truck, Search, MapPin } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import CaptchaWidget from "@/components/CaptchaWidget";
import "leaflet/dist/leaflet.css";
// Remove the marker image imports - they cause build errors
// import markerIcon2x from "leaflet/dist/images/marker-icon-2x.webp";
// import markerIcon from "leaflet/dist/images/marker-icon.webp";
// import markerShadow from "leaflet/dist/images/marker-shadow.webp";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const SHOP_LOCATION = { lat: -1.2833, lng: 36.8233 };

const CheckoutPage = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [delivery, setDelivery] = useState("pickup");
  const [address, setAddress] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [mapError, setMapError] = useState("");
  const [mapLoading, setMapLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"whatsapp" | "paystack">("whatsapp");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [whatsappOrderPlaced, setWhatsappOrderPlaced] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [resetCaptcha, setResetCaptcha] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Check if CAPTCHA should be enabled (only on production domains)
  const isProduction = () => {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('192.168.')) {
      return false;
    }
    return hostname.includes('casetrendskenya.co.ke') || hostname.includes('onrender.com');
  };

  const shouldUseCaptcha = isProduction();

  const finalTotal = useMemo(() => totalPrice, [totalPrice]);

  const buildWhatsAppLink = (orderId: string) => {
    const itemLines = items
      .map((item) =>
        `${item.quantity} x ${item.name}${item.color ? ` (${item.color})` : ""} (KSh ${item.price.toLocaleString()})`
      )
      .join("\n");

    const message = `*New Order: ${orderId}*\n--------------------------\n${itemLines}\n\n*Subtotal:* KSh ${totalPrice.toLocaleString()}\n*Total Amount:* KSh ${finalTotal.toLocaleString()}\n\n*Customer Details:*\nName: ${name}\nPhone: ${phone}\nMethod: ${delivery.toUpperCase()}\n\n_Please confirm receipt of this order._`;

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  const sendConfirmationEmail = async (orderData: any) => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    } else {
      console.error("Authorization token is missing. Ensure the user is logged in.");
      return;
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
  };

  const sendAdminNotificationEmail = async (orderData: any) => {
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

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const initMap = async () => {
    if (!mapContainerRef.current || mapRef.current) return;

    setMapLoading(true);
    try {
      const leafletModule = await import("leaflet");
      const L = leafletModule.default ?? leafletModule;

      // Fix for missing marker images - use CDN URLs instead of local imports
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const initialPos: [number, number] = [-1.2921, 36.8219];
      mapRef.current = L.map(mapContainerRef.current).setView(initialPos, 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);

      markerRef.current = L.marker(initialPos, { draggable: true }).addTo(mapRef.current);
      markerRef.current.on("dragend", (event: any) => {
        const { lat, lng } = event.target.getLatLng();
        handleLocationUpdate(lat, lng);
      });

      mapRef.current.on("click", (event: any) => {
        const { lat, lng } = event.latlng;
        handleLocationUpdate(lat, lng);
      });

      setTimeout(() => mapRef.current?.invalidateSize(), 200);
    } catch (error) {
      console.error("Map initialization failed", error);
      setMapError("Unable to initialize the map. Please try again.");
    } finally {
      setMapLoading(false);
    }
  };

  const handleLocationUpdate = async (lat: number, lng: number, label?: string) => {
    setCoordinates({ lat, lng });

    if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
    if (mapRef.current) mapRef.current.flyTo([lat, lng], 15);

    if (label) {
      setAddress(label);
      return;
    }

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      setAddress(data.display_name || `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
    } catch (err) {
      setAddress(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
      );
      const data = await res.json();
      if (data.length > 0) {
        const { lat, lon, display_name } = data[0];
        handleLocationUpdate(parseFloat(lat), parseFloat(lon), display_name);
      } else {
        toast.error("Location not found");
      }
    } catch (error) {
      console.error(error);
      toast.error("Search failed");
    }
  };

  useEffect(() => {
    if (delivery === "delivery") {
      initMap();
    }
  }, [delivery]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    if (delivery === "delivery" && !coordinates) {
      toast.error("Please choose a delivery location on the map.");
      return;
    }

    if (shouldUseCaptcha && !captchaToken) {
      toast.error("Please complete the CAPTCHA verification.");
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
        delivery_latitude: delivery === "delivery" ? coordinates?.lat ?? null : null,
        delivery_longitude: delivery === "delivery" ? coordinates?.lng ?? null : null,
        items: items.map((i) => ({
          product_id: i.product_id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          color: i.color || null,
        })),
        total_amount: finalTotal,
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
          await sendConfirmationEmail(order);
        }
        await sendAdminNotificationEmail(order);

        clearCart();
        toast.success("Payment completed and order created! Redirecting to thank you page...");
        navigate("/thank-you");
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
      
      setTimeout(() => {
        setResetCaptcha(true);
        setTimeout(() => setResetCaptcha(false), 100);
        setCaptchaToken(null);
      }, 0);
      
      toast.error("Failed to create order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-[hsl(240,10%,3.9%)] to-[hsl(240,10%,4.5%)]">
        <TopBar /><Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            {whatsappOrderPlaced ? (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 text-green-400 mb-4">
                  <Truck className="w-8 h-8" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Thank you for your order!</h2>
                <p className="text-sm text-white/50 mb-6">
                  Your WhatsApp order has been created and the payment page will open in a new tab.
                </p>
                <Link to="/" className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/80 transition-colors">
                  Continue Shopping
                </Link>
              </>
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 text-white/50 mb-4">
                  <Truck className="w-8 h-8" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Your cart is empty</h2>
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[hsl(240,10%,3.9%)] to-[hsl(240,10%,4.5%)]">
      <TopBar />
      <Header />
      <main className="flex-1">
        <div className="container py-6 sm:py-8 max-w-2xl">
          <Link to="/" className="flex items-center gap-2 text-sm text-white/50 hover:text-primary mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Shop
          </Link>
          <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white mb-6">Checkout</h1>

          <div className="bg-white/5 rounded-xl border border-white/10 p-4 sm:p-6 shadow-lg mb-6">
            <h2 className="font-semibold text-base sm:text-lg text-white mb-4">Order Summary</h2>
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.product_id} className="flex justify-between text-sm py-2 border-b border-white/10 last:border-0 gap-2">
                  <span className="flex-1 min-w-0 truncate text-white/70">{item.name}{item.color ? ` (${item.color})` : ""} x{item.quantity}</span>
                  <span className="font-medium text-white flex-shrink-0">KSh {(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-bold text-base sm:text-lg mt-4 pt-2 border-t border-white/10">
              <span className="text-white">Total</span>
              <span className="text-primary">KSh {finalTotal.toLocaleString()}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white/5 rounded-xl border border-white/10 p-4 sm:p-6 shadow-lg space-y-4">
            <h2 className="font-semibold text-base sm:text-lg text-white mb-2">Your Details</h2>
            
            <div>
              <Label htmlFor="name" className="text-white/70">Full Name</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
                disabled={isSubmitting}
                className="bg-black border-white/10 text-white placeholder:text-white/30 focus:border-primary/50"
              />
            </div>
            
            <div>
              <Label htmlFor="phone" className="text-white/70">Phone Number</Label>
              <Input 
                id="phone" 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                required 
                placeholder="+254..." 
                disabled={isSubmitting}
                className="bg-black border-white/10 text-white placeholder:text-white/30 focus:border-primary/50"
              />
            </div>
            
            <div>
              <Label htmlFor="email" className="text-white/70">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                disabled={isSubmitting}
                className="bg-black border-white/10 text-white placeholder:text-white/30 focus:border-primary/50"
              />
            </div>

            <div>
              <Label className="text-white/70">Delivery Method</Label>
              <RadioGroup value={delivery} onValueChange={setDelivery} className="mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pickup" id="pickup" disabled={isSubmitting} className="border-white/30 text-primary" />
                  <Label htmlFor="pickup" className="text-white/70">Pickup (Free)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="delivery" id="delivery" disabled={isSubmitting} className="border-white/30 text-primary" />
                  <Label htmlFor="delivery" className="text-white/70">Delivery</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-white/70">Payment Method</Label>
              <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as "whatsapp" | "paystack")} className="mt-2">
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="whatsapp" id="payment-whatsapp" disabled={isSubmitting} className="border-white/30 text-primary" />
                    <span className="text-white/70">WhatsApp Checkout</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="paystack" id="payment-paystack" disabled={isSubmitting} className="border-white/30 text-primary" />
                    <span className="text-white/70">Card Payment</span>
                  </label>
                </div>
              </RadioGroup>
            </div>

            {delivery === "delivery" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <Label className="text-white/70">Search Address</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Street, Landmark, or Area"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    disabled={isSubmitting}
                    className="bg-black border-white/10 text-white placeholder:text-white/30 focus:border-primary/50"
                  />
                  <Button type="button" onClick={handleSearch} variant="secondary" disabled={isSubmitting} className="bg-white/10 text-white hover:bg-white/20 border border-white/10">
                    <Search size={18} />
                  </Button>
                </div>

                <div ref={mapContainerRef} className="h-64 w-full rounded-lg border border-white/10 bg-black/30 z-0" />

                <div className="space-y-2">
                  <Label className="text-white/70">Selected Address</Label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Tap a location on the map and add landmark notes here"
                    className="bg-black/50 border-white/10 text-white placeholder:text-white/30 focus:border-primary/50"
                    disabled={isSubmitting}
                  />
                  <p className="text-[10px] text-white/40 flex items-center gap-1">
                    <MapPin size={10} /> Coordinates: {coordinates ? `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}` : "Not selected"}
                  </p>
                  {mapError ? <p className="text-sm text-red-400">{mapError}</p> : null}
                  {mapLoading ? <p className="text-sm text-white/50">Loading map...</p> : null}
                </div>
              </div>
            )}

            <CaptchaWidget 
              onVerify={setCaptchaToken} 
              reset={resetCaptcha}
            />

            <Button 
              type="submit" 
              className="w-full text-base sm:text-lg bg-primary text-white hover:bg-primary/80" 
              size="lg" 
              disabled={isSubmitting || (shouldUseCaptcha && !captchaToken)}
            >
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