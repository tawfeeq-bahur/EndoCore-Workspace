import React, { useEffect, useState } from "react";
import { animate, useMotionValue, useTransform, motion } from "framer-motion";

interface NumberTickerProps {
  value: number;
  duration?: number;
  decimals?: number;
}

export function NumberTicker({ value, duration = 0.8, decimals = 0 }: NumberTickerProps) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => latest.toFixed(decimals));
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    const animation = animate(count, value, {
      duration: duration,
      ease: "easeOut",
      onComplete: () => setIsAnimating(false),
    });

    return animation.stop;
  }, [value, duration, count]);

  return <motion.span>{rounded}</motion.span>;
}
