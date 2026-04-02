import { motion } from "framer-motion";
import heroBanner from "@/assets/hero-banner.jpg";

const HeroBanner = () => (
  <section className="relative overflow-hidden">
    <div className="relative w-full h-[200px] sm:h-[300px] md:h-[380px]">
      <img
        src={heroBanner}
        alt="Latest smartphones and deals at TechMobile KE"
        className="w-full h-full object-cover"
        width={1920}
        height={512}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-foreground/60 via-foreground/20 to-transparent" />
      <div className="absolute inset-0 flex items-center">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-md text-primary-foreground"
          >
            <span className="inline-block bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full mb-3">
              🔥 HOT DEALS
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-2">
              Latest Smartphones at Unbeatable Prices
            </h1>
            <p className="text-sm sm:text-base opacity-90 mb-4">
              Free delivery across Nairobi. Genuine products with warranty.
            </p>
            <a
              href="#products"
              className="inline-block bg-accent text-accent-foreground px-6 py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Shop Now
            </a>
          </motion.div>
        </div>
      </div>
    </div>
  </section>
);

export default HeroBanner;
