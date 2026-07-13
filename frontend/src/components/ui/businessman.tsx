import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BlinkingEyes, type EyeBrow } from "./blinking-eyes";
import { Coffee } from "./coffee";
import type { CharacterState, IdleAction } from "./interactive-login-character";

interface BusinessmanProps {
  state: CharacterState;
  mouseX: number; // 0..1
  mouseY: number; // 0..1
  blink: boolean;
  idleAction: IdleAction;
  reduced: boolean;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

type Mouth = "neutral" | "smile" | "big" | "confused";
interface Pose {
  headRot: number;
  lookX: number;
  lookY: number;
  brow: EyeBrow;
  mouth: Mouth;
  raised: "none" | "thumb" | "scratch" | "coffee";
  typing: boolean;
}

/** Derive the full pose from the public state + cursor + idle behavior. */
function resolvePose(
  state: CharacterState,
  mouseX: number,
  mouseY: number,
  idleAction: IdleAction,
): Pose {
  // cursor mapped into gaze/head, biased toward the form on the right
  const dx = mouseX - 0.5;
  const dy = mouseY - 0.5;
  const trackLookX = clamp(dx * 16 + 5, -9, 13);
  const trackLookY = clamp(dy * 10, -6, 9);
  const trackHeadRot = clamp(dx * 26, -15, 15);

  switch (state) {
    case "username-focus":
      return { headRot: trackHeadRot * 0.7 + 3, lookX: trackLookX, lookY: trackLookY, brow: "happy", mouth: "smile", raised: "none", typing: false };
    case "typing":
      return { headRot: trackHeadRot * 0.5 + 2, lookX: trackLookX, lookY: 6, brow: "happy", mouth: "smile", raised: "none", typing: true };
    case "password-focus":
      return { headRot: trackHeadRot * 0.5 + 3, lookX: trackLookX, lookY: trackLookY, brow: "raised", mouth: "smile", raised: "none", typing: false };
    case "password-typing":
      // politely look away from the form (turn left), keep typing
      return { headRot: -28, lookX: -8, lookY: 2, brow: "happy", mouth: "smile", raised: "none", typing: true };
    case "loading":
      return { headRot: 4, lookX: 0, lookY: 9, brow: "normal", mouth: "neutral", raised: "none", typing: true };
    case "success":
      return { headRot: 9, lookX: 11, lookY: -2, brow: "happy", mouth: "big", raised: "thumb", typing: false };
    case "error":
      return { headRot: -6, lookX: 2, lookY: 6, brow: "worried", mouth: "confused", raised: "scratch", typing: false };
    case "idle":
    default:
      if (idleAction === "coffee") return { headRot: -3, lookX: -1, lookY: -2, brow: "normal", mouth: "smile", raised: "coffee", typing: false };
      if (idleAction === "notebook") return { headRot: -15, lookX: -6, lookY: 10, brow: "normal", mouth: "neutral", raised: "none", typing: false };
      if (idleAction === "look-around") return { headRot: trackHeadRot, lookX: trackLookX, lookY: trackLookY, brow: "normal", mouth: "smile", raised: "none", typing: false };
      // plain idle: gaze toward the form
      return { headRot: clamp(trackHeadRot * 0.6 + 4, -15, 15), lookX: clamp(trackLookX, 2, 12), lookY: trackLookY, brow: "normal", mouth: "smile", raised: "none", typing: false };
  }
}

const MOUTHS: Record<Mouth, string> = {
  neutral: "M286 232c8 4 20 4 28 0",
  smile: "M284 231c9 8 23 8 32 0",
  big: "M282 229c10 12 26 12 36 0 -6 6 -30 6 -36 0z",
  confused: "M286 234c6-5 16 3 28-2",
};

/**
 * Premium stylized businessman seated in a leather chair. Head tracks the cursor
 * (±15°), turns 30° away while a password is typed, breathes and blinks at idle, and
 * raises a hand for a thumbs-up (success), a head-scratch (error) or a coffee sip
 * (idle). SVG <g> in the shared 0..600 x 0..640 viewBox, drawn before the desk.
 */
function BusinessmanBase({ state, mouseX, mouseY, blink, idleAction, reduced }: BusinessmanProps) {
  const pose = resolvePose(state, mouseX, mouseY, idleAction);
  const breathe = reduced ? {} : { scaleY: [1, 1.015, 1], y: [0, -2, 0] };

  return (
    <g>
      <defs>
        <linearGradient id="bm-skin" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#f4c9a3" />
          <stop offset="100%" stopColor="#e8b48c" />
        </linearGradient>
        <linearGradient id="bm-suit" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#23262d" />
          <stop offset="100%" stopColor="#111318" />
        </linearGradient>
        <linearGradient id="bm-hair" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#3a2b20" />
          <stop offset="100%" stopColor="#1f1712" />
        </linearGradient>
        <linearGradient id="bm-chair" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#3f4a5a" />
          <stop offset="100%" stopColor="#26303c" />
        </linearGradient>
        <filter id="bm-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="8" stdDeviation="9" floodColor="#0f172a" floodOpacity="0.18" />
        </filter>
      </defs>

      {/* soft contact shadow */}
      <ellipse cx={300} cy={472} rx={170} ry={26} fill="#0f172a" opacity={0.1} />

      {/* leather office chair back */}
      <g filter="url(#bm-shadow)">
        <rect x={196} y={236} width={208} height={246} rx={46} fill="url(#bm-chair)" />
        <rect x={214} y={252} width={172} height={214} rx={36} fill="#313b48" opacity={0.7} />
        <line x1={300} y1={258} x2={300} y2={456} stroke="#20272f" strokeWidth={3} opacity={0.6} />
      </g>

      {/* breathing torso + arms + head */}
      <motion.g
        style={{ transformBox: "view-box", transformOrigin: "300px 470px" }}
        animate={breathe}
        transition={reduced ? { duration: 0 } : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* resting upper arms (forearms disappear behind the desk) */}
        <path d="M232 330 C216 380 214 430 226 476" stroke="url(#bm-suit)" strokeWidth={30} strokeLinecap="round" fill="none" />
        <path d="M368 330 C384 380 386 430 374 476" stroke="url(#bm-suit)" strokeWidth={30} strokeLinecap="round" fill="none" />

        {/* suit jacket / shoulders */}
        <g filter="url(#bm-shadow)">
          <path d="M300 306 C244 306 214 330 210 476 L390 476 C386 330 356 306 300 306 Z" fill="url(#bm-suit)" />
          {/* shirt V + collar */}
          <path d="M276 312 L300 356 L324 312 Z" fill="#ffffff" />
          <path d="M276 312 L300 344 L288 314 Z" fill="#f1f5f9" />
          <path d="M324 312 L300 344 L312 314 Z" fill="#f1f5f9" />
          {/* lapels */}
          <path d="M272 310 L300 356 L300 372 L256 322 Z" fill="#191c22" />
          <path d="M328 310 L300 356 L300 372 L344 322 Z" fill="#191c22" />
          {/* black tie */}
          <path d="M294 316 h12 l3 8 -9 6 -9 -6 z" fill="#0b0d11" />
          <path d="M296 332 h8 l4 78 -8 14 -8 -14 z" fill="#15181e" />
        </g>

        {/* neck */}
        <path d="M282 268 h36 v34 c-6 8 -30 8 -36 0 z" fill="url(#bm-skin)" />
        <path d="M282 288 c8 8 28 8 36 0 v14 c-6 8 -30 8 -36 0 z" fill="#d89f77" opacity={0.5} />

        {/* HEAD */}
        <motion.g
          style={{ transformBox: "view-box", transformOrigin: "300px 268px" }}
          animate={{ rotate: pose.headRot * 0.38, x: pose.headRot * 1.15 }}
          transition={{ type: "spring", stiffness: 120, damping: 15 }}
        >
          {/* ears */}
          <ellipse cx={242} cy={206} rx={10} ry={15} fill="url(#bm-skin)" />
          <ellipse cx={358} cy={206} rx={10} ry={15} fill="url(#bm-skin)" />

          {/* face */}
          <path d="M240 196 C240 140 262 118 300 118 C338 118 360 140 360 196 C360 244 334 268 300 268 C266 268 240 244 240 196 Z" fill="url(#bm-skin)" />
          {/* jaw shade */}
          <path d="M262 244 C276 262 324 262 338 244 C330 258 270 258 262 244 Z" fill="#d89f77" opacity={0.4} />

          {/* modern side-swept hair */}
          <path d="M236 190 C230 140 256 104 300 104 C346 104 372 138 366 192 C360 168 348 150 330 146 C346 158 350 176 348 190 C338 166 314 150 300 150 C276 150 252 164 244 196 C240 194 238 192 236 190 Z" fill="url(#bm-hair)" />
          <path d="M300 104 C266 104 244 128 240 168 C252 140 274 126 300 126 C322 126 338 134 348 150 C338 122 322 104 300 104 Z" fill="#0f0b08" opacity={0.5} />

          {/* eyes */}
          <BlinkingEyes blink={blink} lookX={pose.lookX} lookY={pose.lookY} brow={pose.brow} reduced={reduced} />

          {/* nose */}
          <path d="M298 200 C294 214 292 220 300 224 C308 220 306 214 302 200" fill="none" stroke="#cf9268" strokeWidth={2.4} strokeLinecap="round" />

          {/* mouth — expression swaps instantly (SVG `d` paths differ in shape) */}
          <path
            d={MOUTHS[pose.mouth]}
            fill={pose.mouth === "big" ? "#7c2f39" : "none"}
            stroke="#7c2f39"
            strokeWidth={3}
            strokeLinecap="round"
          />
        </motion.g>
      </motion.g>

      {/* raised-hand behaviors (drawn above the desk so the resting hands stay hidden) */}
      <AnimatePresence>
        {pose.raised === "thumb" && (
          <motion.g
            key="thumb"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: reduced ? 0 : [4, -4, 4] }}
            exit={{ opacity: 0, y: 40 }}
            transition={reduced ? { duration: 0.2 } : { y: { duration: 1.4, repeat: Infinity }, opacity: { duration: 0.3 } }}
          >
            <path d="M392 476 C398 440 404 424 410 410" stroke="url(#bm-suit)" strokeWidth={26} strokeLinecap="round" fill="none" />
            <circle cx={412} cy={404} r={17} fill="url(#bm-skin)" />
            <rect x={405} y={372} width={14} height={30} rx={7} fill="url(#bm-skin)" />
          </motion.g>
        )}

        {pose.raised === "scratch" && (
          <motion.g
            key="scratch"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, rotate: reduced ? 0 : [0, -6, 0, -6, 0] }}
            exit={{ opacity: 0, y: 30 }}
            style={{ transformBox: "view-box", transformOrigin: "360px 300px" }}
            transition={reduced ? { duration: 0.2 } : { rotate: { duration: 1, repeat: Infinity }, opacity: { duration: 0.3 } }}
          >
            <path d="M372 476 C392 400 380 260 356 196" stroke="url(#bm-suit)" strokeWidth={26} strokeLinecap="round" fill="none" />
            <circle cx={352} cy={182} r={16} fill="url(#bm-skin)" />
          </motion.g>
        )}

        {pose.raised === "coffee" && (
          <motion.g
            key="coffee"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.35 }}
          >
            <path d="M366 476 C388 400 372 300 336 236" stroke="url(#bm-suit)" strokeWidth={26} strokeLinecap="round" fill="none" />
            <circle cx={332} cy={230} r={15} fill="url(#bm-skin)" />
            <g transform="translate(300 210) scale(0.7)">
              <Coffee x={0} y={0} steam reduced={reduced} />
            </g>
          </motion.g>
        )}
      </AnimatePresence>
    </g>
  );
}

export const Businessman = memo(BusinessmanBase);
