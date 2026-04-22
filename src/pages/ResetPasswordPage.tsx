// ResetPasswordPage component with CAPTCHA
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import CaptchaWidget from "@/components/CaptchaWidget";

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [resetCaptcha, setResetCaptcha] = useState(false);
  const navigate = useNavigate();

  // Check if CAPTCHA should be enabled (only on production domains)
  const isProduction = () => {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('192.168.')) {
      return false;
    }
    return hostname.includes('casetrendskenya.co.ke') || hostname.includes('onrender.com');
  };

  const shouldUseCaptcha = isProduction();

  const handleResetPassword = async () => {
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (shouldUseCaptcha && !captchaToken) {
      toast.error("Please complete the CAPTCHA verification.");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw error;
      }

      toast.success("Password reset successfully! Please log in.");
      navigate("/auth");
    } catch (err: any) {
      console.error("Reset password error:", err);
      
      // Reset CAPTCHA on error
      setResetCaptcha(true);
      setTimeout(() => setResetCaptcha(false), 100);
      setCaptchaToken(null);
      
      toast.error(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-xl font-bold mb-4">Reset Your Password</h1>
        <div className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
              Confirm New Password
            </label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
            />
          </div>
          
          <CaptchaWidget 
            onVerify={setCaptchaToken} 
            reset={resetCaptcha}
          />
          
          <Button
            onClick={handleResetPassword}
            className="w-full"
            disabled={loading || (shouldUseCaptcha && !captchaToken)}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;