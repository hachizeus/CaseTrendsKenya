import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";

interface PullToRefreshOverlayProps {
  isRefreshing: boolean;
  pullDistance: number;
  progress: number;
}

export const PullToRefreshOverlay = ({ isRefreshing, pullDistance, progress }: PullToRefreshOverlayProps) => {
  return (
    <>
      {/* Pull-to-refresh indicator */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: pullDistance > 0 ? 1 : 0, y: Math.max(-50, pullDistance - 50) }}
        className="fixed top-0 left-0 right-0 z-40 pointer-events-none flex items-center justify-center"
      >
        <div className="flex items-center gap-3 bg-primary text-white px-4 py-2 rounded-b-lg shadow-lg">
          <motion.div
            animate={{ rotate: isRefreshing ? 360 : progress * 360 }}
            transition={{ duration: !isRefreshing ? 0 : 0.6, repeat: isRefreshing ? Infinity : 0 }}
          >
            <RefreshCw className="w-5 h-5" />
          </motion.div>
          <span className="text-sm font-medium">
            {isRefreshing ? "Refreshing..." : progress < 1 ? `Pull to refresh` : "Release to refresh"}
          </span>
        </div>
      </motion.div>

      {/* Semi-transparent overlay when pulling */}
      {pullDistance > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: progress * 0.1 }}
          className="fixed inset-0 bg-black pointer-events-none z-30"
        />
      )}
    </>
  );
};
