import { type ReactNode, useEffect, useState } from "react";
import { Box, type BoxProps } from "@mui/material";
import { animate, motion, type Variants } from "motion/react";

// Shared entrance choreography for dashboard sections.
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
};

export const riseItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const MotionBox = motion.create(Box);

// Stagger parent — children with `riseItem` variants animate in sequence.
export function MotionStagger(props: BoxProps) {
  return (
    <MotionBox
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      {...(props as object)}
    />
  );
}

// A single item that rises into place; use inside MotionStagger.
export function MotionItem({ children, ...rest }: BoxProps) {
  return (
    <MotionBox variants={riseItem} {...(rest as object)}>
      {children}
    </MotionBox>
  );
}

// Reveal on first paint (independent of a stagger parent).
export function MotionReveal({
  children,
  delay = 0,
  ...rest
}: BoxProps & { delay?: number }) {
  return (
    <MotionBox
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay }}
      {...(rest as object)}
    >
      {children}
    </MotionBox>
  );
}

// Smoothly counts up to `value` on mount / whenever it changes.
export function AnimatedNumber({
  value,
  format,
  duration = 1.1,
}: {
  value: number;
  format?: (n: number) => ReactNode;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(latest),
    });
    return () => controls.stop();
  }, [value, duration]);

  return <>{format ? format(display) : Math.round(display)}</>;
}
