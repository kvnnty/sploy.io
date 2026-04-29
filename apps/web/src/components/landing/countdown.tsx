"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";

interface CountdownProps {
  period: Date | string | number;
  className?: string;
  label?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function Countdown({
  period,
  className = "",
  label = "LEFT UNTIL LAUNCH",
}: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const targetDate = useMemo(() => new Date(period).getTime(), [period]);

  const calculateTimeLeft = useCallback(() => {
    const now = new Date().getTime();
    const difference = targetDate - now;

    if (difference <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }

    setTimeLeft({
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      ),
      minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((difference % (1000 * 60)) / 1000),
    });
  }, [targetDate]);

  useEffect(() => {
    calculateTimeLeft();
    intervalRef.current = setInterval(calculateTimeLeft, 1000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [calculateTimeLeft]);

  const formatNumber = useCallback(
    (num: number) => num.toString().padStart(2, "0"),
    [],
  );

  const containerVariants = useMemo(
    () => ({
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          when: "beforeChildren" as const,
          staggerChildren: prefersReducedMotion ? 0 : 0.1,
        },
      },
    }),
    [prefersReducedMotion],
  );

  const itemVariants = useMemo(
    () => ({
      hidden: prefersReducedMotion ? { opacity: 0 } : { y: 20, opacity: 0 },
      visible: {
        y: 0,
        opacity: 1,
        transition: {
          type: prefersReducedMotion ? ("tween" as const) : ("spring" as const),
          stiffness: 300,
          damping: 24,
        },
      },
    }),
    [prefersReducedMotion],
  );

  const segments: { key: string; value: string; label: string }[] = [
    { key: "days", value: String(timeLeft.days), label: "Days" },
    { key: "hours", value: formatNumber(timeLeft.hours), label: "Hours" },
    { key: "minutes", value: formatNumber(timeLeft.minutes), label: "Min" },
  ];

  return (
    <motion.div
      className={`flex flex-col items-center rounded p-4 ${className}`}
      aria-label={`Countdown: ${timeLeft.days} days, ${timeLeft.hours} hours, ${timeLeft.minutes} minutes, and ${timeLeft.seconds} seconds remaining`}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      layout="position"
    >
      <motion.div
        className="flex items-center justify-center space-x-3 md:space-x-4"
        variants={containerVariants}
      >
        {segments.map((seg, i) => (
          <motion.div key={seg.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <motion.span
                className="text-4xl font-semibold tracking-tight text-foreground"
                key={`${seg.key}-${seg.value}`}
                initial={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: 10 }
                }
                animate={
                  prefersReducedMotion
                    ? { opacity: 1 }
                    : { opacity: 1, y: 0 }
                }
                transition={{
                  type: prefersReducedMotion ? "tween" : "spring",
                  stiffness: 200,
                }}
              >
                {seg.value}
              </motion.span>
              <motion.span
                className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground"
                variants={itemVariants}
              >
                {seg.label}
              </motion.span>
            </div>
            {i < segments.length - 1 && (
              <span className="pb-4 pl-3 text-lg text-muted-foreground md:pl-4 md:text-xl">
                :
              </span>
            )}
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="mt-3 flex items-center justify-center text-[11px] uppercase tracking-wider text-muted-foreground"
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: 1,
          y: 0,
          transition: {
            delay: prefersReducedMotion ? 0.2 : 0.5,
            duration: prefersReducedMotion ? 0.3 : 0.5,
          },
        }}
      >
        <span>{label}</span>
      </motion.div>
    </motion.div>
  );
}
