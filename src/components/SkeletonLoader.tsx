import React from "react";
import { motion } from "framer-motion";

interface SkeletonLoaderProps {
  lines?: number;
  className?: string;
  lineHeight?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  lines = 3, 
  className = "", 
  lineHeight = "h-3" 
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          className={`${lineHeight} rounded-full bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 bg-[length:200%_100%]`}
          animate={{
            backgroundPosition: ["200% 0", "-200% 0"]
          }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: "linear",
            delay: i * 0.1
          }}
          style={{ width: i === lines - 1 ? "60%" : "100%" }}
        />
      ))}
    </div>
  );
};
