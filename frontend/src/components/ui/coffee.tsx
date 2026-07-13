import { memo } from "react";
import { motion } from "framer-motion";

interface CoffeeProps {
  /** translate the whole mug in svg units */
  x?: number;
  y?: number;
  scale?: number;
  steam?: boolean;
  reduced?: boolean;
}

/**
 * Ceramic coffee mug with optional rising steam. SVG <g> — render inside an <svg>.
 * Used static on the desk and (translated) near the businessman's mouth during the
 * idle "drink coffee" behavior.
 */
function CoffeeBase({ x = 0, y = 0, scale = 1, steam = true, reduced = false }: CoffeeProps) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {steam &&
        [0, 1, 2].map((i) => (
          <motion.path
            key={i}
            d={`M${10 + i * 7} 2c-4 5 4 9 0 14`}
            stroke="#cbd5e1"
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
            initial={{ opacity: 0, y: 6 }}
            animate={
              reduced
                ? { opacity: 0.4, y: 0 }
                : { opacity: [0, 0.5, 0], y: [6, -10, -18] }
            }
            transition={
              reduced
                ? { duration: 0 }
                : { duration: 2.4, repeat: Infinity, delay: i * 0.5, ease: "easeOut" }
            }
          />
        ))}
      {/* mug */}
      <path d="M4 20h26v18a9 9 0 0 1-9 9H13a9 9 0 0 1-9-9z" fill="#ffffff" />
      <path d="M4 20h26v6H4z" fill="#eef2f7" />
      <path
        d="M30 24h5a7 7 0 0 1 0 14h-5"
        fill="none"
        stroke="#e2e8f0"
        strokeWidth={4}
      />
      {/* coffee surface */}
      <ellipse cx={17} cy={22} rx={11} ry={3} fill="#6f4a2f" />
      <path d="M4 38h26" stroke="#dbe2ea" strokeWidth={1.5} opacity={0.7} />
    </g>
  );
}

export const Coffee = memo(CoffeeBase);
