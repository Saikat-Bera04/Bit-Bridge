import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BorderMagicButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export const BorderMagicButton = ({
  children,
  className,
  onClick,
  disabled = false,
}: BorderMagicButtonProps) => {
  return (
    <motion.button
      className={cn(
        "relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
    >
      <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,hsl(263,70%,50%)_0%,hsl(240,100%,70%)_50%,hsl(263,70%,50%)_100%)]" />
      <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-background px-6 py-1 text-sm font-medium text-foreground backdrop-blur-3xl transition-colors hover:bg-background/80">
        {children}
      </span>
    </motion.button>
  );
};