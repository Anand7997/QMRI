import { memo } from "react";
import { motion } from "framer-motion";

export type EyeBrow = "normal" | "raised" | "worried" | "happy";

interface BlinkingEyesProps {
  /** true = eyes closed for a blink frame */
  blink: boolean;
  /** pupil offset in svg units, clamped by caller */
  lookX: number;
  lookY: number;
  brow: EyeBrow;
  reduced: boolean;
}

/**
 * Two stylized eyes for the businessman. Rendered as an SVG <g>, so it must live
 * inside an <svg>. Pupils translate toward (lookX, lookY); eyelids drop on blink;
 * brows shift per expression. GPU-friendly (transform + opacity only).
 */
function BlinkingEyesBase({ blink, lookX, lookY, brow, reduced }: BlinkingEyesProps) {
  const eyes = [
    { x: 278, y: 186 },
    { x: 322, y: 186 },
  ];

  const browPath: Record<EyeBrow, [string, string]> = {
    normal: ["M266 168c6-4 16-4 24-1", "M310 167c8-3 18-3 24 1"],
    raised: ["M266 162c6-5 16-6 24-3", "M310 158c8-3 18-2 24 3"],
    worried: ["M266 170c6 2 16 3 24 6", "M310 176c8-3 18-4 24-6"],
    happy: ["M266 166c6-4 16-4 24-1", "M310 165c8-3 18-3 24 1"],
  };
  const [browL, browR] = browPath[brow];

  return (
    <g>
      {/* eyebrows — expression swaps instantly (interpolating SVG `d` across
          differently-shaped paths is invalid), the head/eyes carry the motion */}
      <path d={browL} stroke="#2b241d" strokeWidth={3.6} strokeLinecap="round" fill="none" />
      <path d={browR} stroke="#2b241d" strokeWidth={3.6} strokeLinecap="round" fill="none" />

      {eyes.map((e, i) => (
        <g key={i}>
          {/* eye white */}
          <ellipse cx={e.x} cy={e.y} rx={11} ry={8.5} fill="#f6f8fb" />
          {/* iris + pupil, translated toward look target */}
          <motion.g
            initial={false}
            animate={{ x: lookX, y: lookY, opacity: blink ? 0 : 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
          >
            <circle cx={e.x} cy={e.y} r={5.6} fill="#5b4a36" />
            <circle cx={e.x} cy={e.y} r={2.8} fill="#1b1710" />
            <circle cx={e.x - 1.8} cy={e.y - 2.2} r={1.4} fill="#ffffff" opacity={0.9} />
          </motion.g>
          {/* eyelid — scales down over the eye on blink */}
          <motion.rect
            x={e.x - 12}
            y={e.y - 9.5}
            width={24}
            height={19}
            rx={9}
            fill="#e8b48c"
            initial={false}
            animate={{ scaleY: blink ? 1 : 0 }}
            style={{ originY: "0px", transformBox: "fill-box" }}
            transition={{ duration: reduced ? 0 : 0.09 }}
          />
        </g>
      ))}
    </g>
  );
}

export const BlinkingEyes = memo(BlinkingEyesBase);
