import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, ShoppingBag, Shield, Truck, Star } from "lucide-react";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const perks = [
  { icon: ShoppingBag, text: "Track your orders easily" },
  { icon: Shield, text: "Secure checkout every time" },
  { icon: Truck, text: "Free delivery on KSh 5,000+" },
  { icon: Star, text: "Save favourites & wishlists" },
];

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/";

  const switchMode = (login: boolean) => {
    setIsLogin(login);
    setEmail(""); setPassword(""); setFullName("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        toast.success("Welcome back!");
        navigate(from, { replace: true });
      } else {
        await signUp(email, password, fullName);
        toast.success("Account created! Check your email to verify.");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f6f9]">
      <TopBar />
      <Header />

      <main className="flex-1 flex items-center justify-center py-10 px-4">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 shadow-xl overflow-hidden">

          {/* Left panel — branding */}
          <div className="hidden lg:flex flex-col justify-between bg-[#0f1117] text-white p-10">
            <div>
              <img src="/logo.png" alt="Case Trends Kenya" className="h-10 w-auto mb-10 brightness-200" />
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-3xl font-bold leading-tight mb-3">
                  {isLogin ? "Welcome back." : "Join Case Trends Kenya."}
                </h2>
                <p className="text-white/60 text-sm leading-relaxed mb-8">
                  {isLogin
                    ? "Sign in to access your orders, wishlist, and exclusive deals."
                    : "Create a free account and start shopping the best electronics in Nairobi."}
                </p>
                <div className="space-y-4">
                  {perks.map((p, i) => (
                    <motion.div
                      key={p.text}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-8 h-8 bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <p.icon className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm text-white/80">{p.text}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
            <p className="text-xs text-white/30 mt-8">© 2026 Case Trends Kenya. All rights reserved.</p>
          </div>

          {/* Right panel — form */}
          <div className="bg-white p-8 sm:p-10 flex flex-col justify-center">
            {/* Mobile logo */}
            <Link to="/" className="flex justify-center mb-6 lg:hidden">
              <img src="/logo.png" alt="Case Trends Kenya" className="h-10 w-auto" />
            </Link>

            {/* Tab switcher */}
            <div className="flex border-b border-border mb-8">
              {["Sign In", "Create Account"].map((label, i) => {
                const active = i === 0 ? isLogin : !isLogin;
                return (
                  <button
                    key={label}
                    onClick={() => switchMode(i === 0)}
                    className={`flex-1 pb-3 text-sm font-semibold transition-colors relative ${
                      active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                    {active && (
                      <motion.div
                        layoutId="auth-tab-underline"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.form
                key={isLogin ? "login" : "register"}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div>
                  <h1 className="text-xl font-bold mb-1">
                    {isLogin ? "Sign in to your account" : "Create your account"}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {isLogin ? "Enter your credentials below." : "Fill in your details to get started."}
                  </p>
                </div>

                {!isLogin && (
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="full-name"
                      name="fullName"
                      placeholder="Full Name"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      required
                      className="pl-10"
                    />
                  </div>
                )}

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {isLogin && (
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">
                      Forgot password?{" "}
                      <a href="mailto:support@casetrendskenya.co.ke" className="text-primary hover:underline">
                        Contact support
                      </a>
                    </span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full gap-2 h-11 text-sm font-semibold"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Please wait...
                    </span>
                  ) : (
                    <>
                      {isLogin ? "Sign In" : "Create Account"}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground pt-2">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                  <button
                    type="button"
                    onClick={() => switchMode(!isLogin)}
                    className="text-primary font-semibold hover:underline"
                  >
                    {isLogin ? "Sign Up" : "Sign In"}
                  </button>
                </p>

                {!isLogin && (
                  <p className="text-center text-[11px] text-muted-foreground">
                    By creating an account you agree to our{" "}
                    <span className="text-primary cursor-pointer hover:underline">Terms of Service</span>
                    {" & "}
                    <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span>
                  </p>
                )}
              </motion.form>
            </AnimatePresence>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AuthPage;
