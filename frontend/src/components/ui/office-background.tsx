import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CharacterState } from "./interactive-login-character";

interface OfficeBackgroundProps {
  state: CharacterState;
  mouseX: number; // 0..1
  mouseY: number; // 0..1
  reduced: boolean;
}

const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  left: 8 + (i * 79) % 84,
  delay: (i % 6) * 0.12,
  size: 5 + (i % 4) * 3,
}));

/**
 * Minimal modern office behind the businessman: glass window with a city skyline,
 * a bookshelf, plants and soft blue ambient light. Pure Tailwind-styled divs with a
 * light parallax driven by cursor position. Adds a blue glow + floating particles on
 * `success`.
 */
function OfficeBackgroundBase({ state, mouseX, mouseY, reduced }: OfficeBackgroundProps) {
  const px = reduced ? 0 : (mouseX - 0.5) * 18;
  const py = reduced ? 0 : (mouseY - 0.5) * 12;
  const isSuccess = state === "success";

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* base wall gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100" />

      {/* soft ambient light blooms */}
      <div className="absolute -left-16 top-8 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl" />
      <div className="absolute right-0 top-24 h-64 w-64 rounded-full bg-indigo-300/20 blur-3xl" />

      <motion.div
        className="absolute inset-0"
        animate={{ x: px, y: py }}
        transition={{ type: "spring", stiffness: 60, damping: 20 }}
      >
        {/* large office window with skyline */}
        <div className="absolute right-[6%] top-[8%] h-[42%] w-[46%] overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-b from-sky-200/80 to-blue-100/70 shadow-inner">
          {/* city skyline */}
          <div className="absolute bottom-0 left-0 right-0 flex items-end gap-1 px-2 opacity-70">
            {[38, 62, 48, 80, 55, 70, 42, 60].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm bg-gradient-to-b from-slate-400/60 to-slate-500/70"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          {/* window mullions */}
          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/70" />
          <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-white/70" />
        </div>

        {/* bookshelf, left */}
        <div className="absolute left-[5%] top-[14%] h-[52%] w-[16%] rounded-lg bg-gradient-to-b from-amber-100/70 to-amber-200/50 shadow-sm">
          {[0, 1, 2, 3].map((r) => (
            <div key={r} className="absolute left-0 right-0 border-b border-amber-300/50" style={{ top: `${18 + r * 22}%` }}>
              <div className="flex h-full items-end gap-[3px] px-1 pb-[3px]">
                {[0, 1, 2, 3, 4].map((b) => (
                  <div
                    key={b}
                    className="w-[15%] rounded-sm"
                    style={{
                      height: `${40 + ((b + r) % 3) * 18}%`,
                      background: ["#93c5fd", "#fca5a5", "#86efac", "#fde68a", "#c4b5fd"][(b + r) % 5],
                      opacity: 0.75,
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* plant, lower left */}
        <div className="absolute left-[3%] bottom-[6%] h-[22%] w-[10%]">
          <div className="absolute bottom-0 left-1/2 h-[38%] w-[60%] -translate-x-1/2 rounded-b-lg rounded-t-sm bg-gradient-to-b from-orange-200 to-orange-300/80" />
          {[-20, -6, 8, 22].map((rot, i) => (
            <div
              key={i}
              className="absolute bottom-[34%] left-1/2 h-[70%] w-[26%] origin-bottom rounded-full bg-gradient-to-t from-emerald-500/80 to-emerald-400/70"
              style={{ transform: `translateX(-50%) rotate(${rot}deg)` }}
            />
          ))}
        </div>
      </motion.div>

      {/* success ambient glow */}
      <motion.div
        className="absolute inset-0 bg-blue-400/0"
        animate={{ backgroundColor: isSuccess ? "rgba(59,130,246,0.16)" : "rgba(59,130,246,0)" }}
        transition={{ duration: 0.5 }}
      />

      {/* floating success particles */}
      <AnimatePresence>
        {isSuccess &&
          !reduced &&
          PARTICLES.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full bg-blue-400/70 shadow-[0_0_8px_rgba(59,130,246,0.6)]"
              style={{ left: `${p.left}%`, bottom: "12%", width: p.size, height: p.size }}
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: [0, 1, 0], y: -180, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.2, delay: p.delay, repeat: Infinity, ease: "easeOut" }}
            />
          ))}
      </AnimatePresence>
    </div>
  );
}

export const OfficeBackground = memo(OfficeBackgroundBase);
