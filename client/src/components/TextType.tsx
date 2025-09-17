import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface TextTypeProps {
  text: string;
  className?: string;
  delay?: number;
}

export const TextType = ({ text, className = "", delay = 0 }: TextTypeProps) => {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 100 + delay);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, delay]);

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: delay / 1000 }}
    >
      {displayText}
      <motion.span
        className="inline-block ml-1 w-1 h-full bg-primary"
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
      >
        |
      </motion.span>
    </motion.div>
  );
};