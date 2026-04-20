import { Phone, Mail, Instagram, Facebook, Youtube } from "lucide-react";

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    fill="currentColor" 
    viewBox="0 0 24 24" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.321 5.562a5.122 5.122 0 0 1-.868-.082 3.04 3.04 0 0 1-1.075-.46 3.04 3.04 0 0 1-.77-.96 3.04 3.04 0 0 1-.494-1.256V1h-3.638v13.558a2.29 2.29 0 0 1-4.44.205 2.289 2.289 0 0 1 2.232-2.555 2.29 2.29 0 0 1 .85.155v-3.68a6.018 6.018 0 0 0-5.868 5.97c0 3.315 2.686 6 6 6s6-2.685 6-6v-3.248a7.558 7.558 0 0 0 4.87 1.858V8.84a4.35 4.35 0 0 1-1.809-.458Z"/>
  </svg>
);

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    fill="currentColor" 
    viewBox="0 0 24 24" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.077 4.928C17.191 3.041 14.683 2 12.006 2 6.478 2 2 6.477 2 12.006c0 1.764.46 3.483 1.336 5.002L2 22l5.143-1.352c1.456.79 3.104 1.208 4.863 1.208h.004c5.527 0 10.006-4.477 10.006-9.994 0-2.673-1.041-5.18-2.935-6.934zm-7.07 15.389h-.003c-1.518 0-3.007-.407-4.306-1.176l-.308-.183-3.05.802.814-2.976-.2-.318a8.475 8.475 0 0 1-1.302-4.456c0-4.66 3.795-8.456 8.46-8.456 2.26 0 4.382.88 5.977 2.476a8.4 8.4 0 0 1 2.476 5.98c0 4.66-3.796 8.456-8.46 8.456h-.004zm4.64-6.336c-.255-.127-1.505-.743-1.739-.828-.233-.085-.403-.127-.573.127-.17.255-.658.828-.807.998-.148.17-.297.191-.552.064-.254-.128-1.076-.397-2.05-1.266-.758-.676-1.27-1.512-1.418-1.767-.149-.255-.016-.393.111-.52.114-.114.255-.297.382-.446.127-.148.17-.255.255-.425.085-.17.042-.318-.021-.446-.064-.127-.573-1.38-.785-1.89-.207-.495-.417-.428-.573-.436-.148-.008-.318-.01-.488-.01-.17 0-.445.064-.678.318-.234.255-.891.87-.891 2.123 0 1.253.913 2.464 1.04 2.634.127.17 1.797 2.745 4.354 3.85.608.262 1.083.418 1.453.536.61.194 1.166.167 1.606.101.49-.073 1.505-.615 1.717-1.21.212-.594.212-1.103.148-1.21-.063-.106-.233-.17-.488-.297z"/>
  </svg>
);

// Social Icon Button Component for consistency
const SocialIconButton = ({ 
  href, 
  label, 
  icon: Icon, 
  hoverColor,
}: { 
  href: string; 
  label: string; 
  icon: React.ComponentType<{ className?: string }>; 
  hoverColor: string;
}) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={label}
    className="
      relative flex items-center justify-center 
      w-8 h-8 rounded-full
      bg-white/10 backdrop-blur-sm
      text-white/80
      transition-all duration-300 ease-out
      hover:scale-110 hover:-translate-y-0.5
      hover:shadow-lg hover:shadow-white/10
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white/50
    "
    style={{ 
      transitionProperty: 'all',
      transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.color = hoverColor;
      e.currentTarget.style.backgroundColor = `${hoverColor}20`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.color = '';
      e.currentTarget.style.backgroundColor = '';
    }}
  >
    <Icon className="w-4 h-4 transition-transform duration-300" />
  </a>
);

const TopBar = () => {
  const socialLinks = [
    {
      href: "https://www.instagram.com/casetrends_kenya/?hl=en",
      label: "Follow us on Instagram",
      icon: Instagram,
      hoverColor: "#E4405F",
    },
    {
      href: "https://www.tiktok.com/@casetrendskenya",
      label: "Follow us on TikTok",
      icon: TikTokIcon,
      hoverColor: "#00f2ea",
    },
    {
      href: "https://www.facebook.com/",
      label: "Follow us on Facebook",
      icon: Facebook,
      hoverColor: "#1877F2",
    },
    {
      href: "https://wa.me/254707177657",
      label: "Chat with us on WhatsApp",
      icon: WhatsAppIcon,
      hoverColor: "#25D366",
    },
    {
      href: "https://www.youtube.com/@casetrends",
      label: "Subscribe on YouTube",
      icon: Youtube,
      hoverColor: "#FF0000",
    }
  ];

  return (
    <div className="bg-black text-white text-xs py-2 hidden md:block">
      <div className="container flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Phone className="w-3 h-3" /> +254 707 177 657  | +254 714 204 2716
          </span>
          <span className="flex items-center gap-1.5">
            <Mail className="w-3 h-3" /> support@casetrendskenya.co.ke
          </span>
        </div>
        <div className="flex items-center gap-2">
          {socialLinks.map((social) => (
            <SocialIconButton
              key={social.label}
              href={social.href}
              label={social.label}
              icon={social.icon}
              hoverColor={social.hoverColor}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopBar;