import { memo } from "react";
import { motion } from "framer-motion";
import { Coffee } from "./coffee";
import type { CharacterState } from "./interactive-login-character";

interface DeskProps {
  state: CharacterState;
  reduced: boolean;
}

/**
 * Premium wooden desk and everything on it: laptop (screen glow spills on `loading`
 * and `success`), keyboard, mouse, notebook + pen, pen holder, phone, coffee mug and a
 * desk lamp whose pool of light glows while working. SVG <g> in the shared 0..600 x
 * 0..640 viewBox — drawn after the businessman so it sits in front of his hands.
 */
function DeskBase({ state, reduced }: DeskProps) {
  const working = state === "loading";
  const glowOn = working || state === "success";

  return (
    <g>
      <defs>
        <linearGradient id="desk-wood" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#b98a5e" />
          <stop offset="100%" stopColor="#9a6d43" />
        </linearGradient>
        <linearGradient id="desk-face" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#8a5f39" />
          <stop offset="100%" stopColor="#6f4a2c" />
        </linearGradient>
        <linearGradient id="desk-lid" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#b8c2cf" />
        </linearGradient>
        <radialGradient id="desk-lamp-pool" cx="0.5" cy="0.4" r="0.6">
          <stop offset="0%" stopColor="#fde68a" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* lamp light pool on the desk (behind objects) */}
      <motion.ellipse
        cx={470}
        cy={500}
        rx={110}
        ry={40}
        fill="url(#desk-lamp-pool)"
        initial={false}
        animate={{ opacity: glowOn ? 0.85 : 0.25 }}
        transition={{ duration: 0.5 }}
      />

      {/* laptop screen glow spilling around the lid */}
      <motion.ellipse
        cx={300}
        cy={452}
        rx={90}
        ry={46}
        fill="#60a5fa"
        initial={false}
        animate={
          reduced
            ? { opacity: glowOn ? 0.4 : 0 }
            : { opacity: glowOn ? [0.25, 0.5, 0.25] : 0 }
        }
        transition={reduced ? { duration: 0.4 } : { duration: 1.6, repeat: glowOn ? Infinity : 0 }}
      />

      {/* ── laptop (back of the lid faces the viewer) ── */}
      <g>
        <path d="M232 468 L368 468 L356 410 L244 410 Z" fill="url(#desk-lid)" stroke="#94a3b8" strokeWidth={2} />
        <path d="M244 410 L356 410 L352 416 L248 416 Z" fill="#cbd5e1" opacity={0.6} />
        <circle cx={300} cy={440} r={7} fill="#93c5fd" opacity={0.8} />
      </g>

      {/* desk top */}
      <rect x={20} y={468} width={560} height={30} rx={10} fill="url(#desk-wood)" />
      <rect x={20} y={468} width={560} height={5} rx={2.5} fill="#d7b48c" opacity={0.7} />
      <rect x={20} y={496} width={560} height={104} fill="url(#desk-face)" />

      {/* laptop base / keyboard deck (sits on the desk edge) */}
      <path d="M236 468 L364 468 L372 486 L228 486 Z" fill="#cbd5e1" />
      <path d="M236 468 L364 468 L363 472 L237 472 Z" fill="#e2e8f0" />

      {/* keyboard */}
      <g>
        <rect x={250} y={506} width={100} height={30} rx={5} fill="#e5eaf0" stroke="#cbd5e1" strokeWidth={1.5} />
        {Array.from({ length: 4 }).map((_, r) =>
          Array.from({ length: 9 }).map((_, c) => (
            <rect key={`${r}-${c}`} x={255 + c * 10.4} y={510 + r * 6.2} width={7.5} height={4.4} rx={1} fill="#ffffff" />
          )),
        )}
      </g>

      {/* mouse */}
      <ellipse cx={378} cy={520} rx={11} ry={16} fill="#e5eaf0" stroke="#cbd5e1" strokeWidth={1.5} />
      <line x1={378} y1={508} x2={378} y2={516} stroke="#cbd5e1" strokeWidth={1.5} />

      {/* notebook + pen, left */}
      <g>
        <rect x={95} y={512} width={78} height={54} rx={6} fill="#f8fafc" stroke="#cbd5e1" strokeWidth={1.5} transform="rotate(-8 134 539)" />
        <g transform="rotate(-8 134 539)">
          {[0, 1, 2, 3].map((i) => (
            <line key={i} x1={104} y1={524 + i * 10} x2={164} y2={524 + i * 10} stroke="#dbe2ea" strokeWidth={2} />
          ))}
        </g>
        <rect x={150} y={508} width={44} height={5} rx={2.5} fill="#2563eb" transform="rotate(-8 172 510)" />
      </g>

      {/* pen holder, far left */}
      <g>
        <rect x={44} y={508} width={30} height={40} rx={6} fill="#334155" />
        <rect x={44} y={508} width={30} height={8} rx={4} fill="#475569" />
        <line x1={52} y1={508} x2={49} y2={484} stroke="#ef4444" strokeWidth={4} strokeLinecap="round" />
        <line x1={60} y1={508} x2={62} y2={480} stroke="#3b82f6" strokeWidth={4} strokeLinecap="round" />
        <line x1={68} y1={508} x2={70} y2={488} stroke="#22c55e" strokeWidth={4} strokeLinecap="round" />
      </g>

      {/* phone, right */}
      <g>
        <rect x={508} y={510} width={30} height={54} rx={6} fill="#0f172a" transform="rotate(10 523 537)" />
        <rect x={512} y={516} width={22} height={40} rx={3} fill="#1e293b" transform="rotate(10 523 537)" />
      </g>

      {/* coffee mug, right */}
      <Coffee x={430} y={500} scale={0.95} steam={!working} reduced={reduced} />

      {/* desk lamp, back right */}
      <g stroke="#64748b" strokeWidth={5} strokeLinecap="round" fill="none">
        <ellipse cx={520} cy={498} rx={22} ry={7} fill="#94a3b8" stroke="none" />
        <path d="M520 496 L520 430" />
        <path d="M520 430 L556 404" />
      </g>
      <path d="M548 396 l24 10 l-10 20 l-24 -10 z" fill="#94a3b8" />
      <motion.circle
        cx={556}
        cy={416}
        r={6}
        fill="#fde68a"
        initial={false}
        animate={{ opacity: glowOn ? 1 : 0.4 }}
        transition={{ duration: 0.5 }}
      />
    </g>
  );
}

export const Desk = memo(DeskBase);
