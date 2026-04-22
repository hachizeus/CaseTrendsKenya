import { useState } from "react";
import Turnstile from "react-turnstile";
import { toast } from "sonner";

interface CaptchaWidgetProps {
  onVerify: (token: string | null) => void;
  className?: string;
  reset?: boolean;
}

const CaptchaWidget = ({ onVerify, className = "", reset = false }: CaptchaWidgetProps) => {
  const [captchaKey, setCaptchaKey] = useState(0);
  
  // Check if CAPTCHA should be enabled (only on production domains)
  const isProduction = () => {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('192.168.')) {
      return false;
    }
    return hostname.includes('casetrendskenya.co.ke') || hostname.includes('onrender.com');
  };

  const shouldUseCaptcha = isProduction();
  const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "0x4AAAAAADAszbwDj5ytZOc2";

  // Reset CAPTCHA when reset prop changes
  if (reset) {
    setCaptchaKey(prev => prev + 1);
  }

  if (!shouldUseCaptcha) {
    // On localhost, automatically verify with a dummy token
    if (onVerify) {
      setTimeout(() => onVerify("localhost-dev-token"), 100);
    }
    return null;
  }

  return (
    <div className={`flex justify-center py-2 ${className}`} key={captchaKey}>
      <Turnstile
        sitekey={TURNSTILE_SITE_KEY}
        onVerify={(token) => {
          console.log("✅ CAPTCHA verified");
          onVerify(token);
        }}
        onError={() => {
          toast.error("CAPTCHA error. Please refresh and try again.");
          onVerify(null);
        }}
        onExpire={() => {
          toast.error("CAPTCHA expired. Please verify again.");
          onVerify(null);
        }}
        theme="light"
      />
    </div>
  );
};

export default CaptchaWidget;