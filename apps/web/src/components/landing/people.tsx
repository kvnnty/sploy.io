"use client";

import { useState, useEffect } from "react";
import { motion, useAnimation } from "motion/react";

interface PeopleProps {
  count?: number;
  initialCount?: number;
  className?: string;
}

export default function People({
  count = 0,
  initialCount = 0,
  className = "",
}: PeopleProps) {
  const [displayCount, setDisplayCount] = useState(initialCount);
  const controls = useAnimation();

  useEffect(() => {
    if (count <= 0) return;

    let startTime: number;
    let requestId: number;
    const duration = 2000;

    const animateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOutQuart = 1 - (1 - progress) ** 4;
      const currentCount = Math.floor(
        initialCount + easeOutQuart * (count - initialCount),
      );
      setDisplayCount(currentCount);
      if (progress < 1) {
        requestId = requestAnimationFrame(animateCount);
      }
    };

    requestId = requestAnimationFrame(animateCount);
    controls.start({ opacity: 1, y: 0 });

    return () => {
      if (requestId) cancelAnimationFrame(requestId);
    };
  }, [count, initialCount, controls]);

  if (count <= 0) return null;

  const formattedCount = displayCount.toLocaleString();

  return (
    <motion.div
      className={`flex items-center justify-center gap-2 py-2 px-4 ${className}`}
      animate={controls}
      transition={{ duration: 0.6 }}
    >
      <motion.div className="text-[13px] font-medium tracking-[0.02em] text-[#6a6b6c]">
        Join{" "}
        <motion.span
          className="font-semibold text-[#9c9c9d]"
          key={displayCount}
          initial={{ opacity: 0.5, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {formattedCount}+
        </motion.span>{" "}
        others on the waitlist
      </motion.div>
    </motion.div>
  );
}
