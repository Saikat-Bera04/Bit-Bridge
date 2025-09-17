import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glare?: boolean;
}

export const GlassCard = ({
  children,
  className,
  hover = true,
  glare = false,
}: GlassCardProps) => {
  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 backdrop-blur-lg shadow-glass",
        glare && "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:translate-x-[-100%] before:animate-[shimmer_2s_infinite] before:z-10",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={hover ? { scale: 1.02, y: -5 } : undefined}
    >
      {children}
    </motion.div>
  );
};