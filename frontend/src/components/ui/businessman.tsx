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

function resolvePose(
  state: CharacterState,
  mouseX: number,
  mouseY: number,
  idleAction: IdleAction,
): Pose {
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
      return { headRot: clamp(trackHeadRot * 0.6 + 4, -15, 15), lookX: clamp(trackLookX, 2, 12), lookY: trackLookY, brow: "normal", mouth: "smile", raised: "none", typing: false };
  }
}

const MOUTHS: Record<Mouth, string> = {
  neutral: "M286 232c8 4 20 4 28 0",
  smile: "M284 231c9 8 23 8 32 0",
  big: "M282 229c10 12 26 12 36 0 -6 6 -30 6 -36 0z",
  confused: "M286 234c6-5 16 3 28-2",
};

function BusinessmanBase({ state, mouseX, mouseY, blink, idleAction, reduced }: BusinessmanProps) {
  const pose = resolvePose(state, mouseX, mouseY, idleAction);
  const breathe = reduced ? {} : { scaleY: [1, 1.015, 1], y: [0, -2, 0] };

  return (
    <g>
      <defs>
        {/* Upgraded Gradients */}
        <linearGradient id="bm-skin" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#fcd5ce" />
          <stop offset="100%" stopColor="#eba394" />
        </linearGradient>
        <linearGradient id="bm-suit" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="55%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="bm-hair" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#3b291d" />
          <stop offset="100%" stopColor="#1a120c" />
        </linearGradient>
        <linearGradient id="bm-chair" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
        <linearGradient id="bm-shirt" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f1f5f9" />
        </linearGradient>
        <linearGradient id="bm-tie" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#991b1b" />
        </linearGradient>
        <linearGradient id="bm-badge" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <filter id="bm-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="8" stdDeviation="9" floodColor="#0f172a" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Floor Shadow */}
      <ellipse cx={300} cy={472} rx={170} ry={26} fill="#0f172a" opacity={0.15} />

      {/* Chair */}
      <g filter="url(#bm-shadow)">
        <path d="M198 274 C198 236 224 214 300 214 C376 214 402 236 402 274 L390 480 L210 480 Z" fill="url(#bm-chair)" />
        <path d="M222 278 C222 252 246 238 300 238 C354 238 378 252 378 278 L370 462 L230 462 Z" fill="#cbd5e1" opacity={0.6} />
        <path d="M236 276 C258 266 342 266 364 276" stroke="#ffffff" strokeWidth={5} strokeLinecap="round" opacity={0.7} />
        <line x1={300} y1={246} x2={300} y2={450} stroke="#94a3b8" strokeWidth={3} opacity={0.5} />
      </g>

      {/* Body */}
      <motion.g
        style={{ transformBox: "view-box", transformOrigin: "300px 470px" }}
        animate={breathe}
        transition={reduced ? { duration: 0 } : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Arms */}
        <path d="M238 332 C218 382 220 426 246 460" stroke="url(#bm-suit)" strokeWidth={30} strokeLinecap="round" fill="none" />
        <path d="M362 332 C382 382 380 426 354 460" stroke="url(#bm-suit)" strokeWidth={30} strokeLinecap="round" fill="none" />
        <path d="M246 456 C264 444 282 442 296 456" stroke="#0f172a" strokeWidth={18} strokeLinecap="round" fill="none" opacity={0.95} />
        <path d="M354 456 C336 444 318 442 304 456" stroke="#0f172a" strokeWidth={18} strokeLinecap="round" fill="none" opacity={0.95} />
        <ellipse cx={285} cy={458} rx={16} ry={10} fill="url(#bm-skin)" />
        <ellipse cx={315} cy={458} rx={16} ry={10} fill="url(#bm-skin)" />

        {/* Torso */}
        <g filter="url(#bm-shadow)">
          <path d="M300 306 C246 306 212 332 208 476 L392 476 C388 332 354 306 300 306 Z" fill="url(#bm-suit)" />
          <path d="M234 360 C256 330 276 318 300 318 C324 318 344 330 366 360 L354 476 L246 476 Z" fill="#0f172a" opacity={0.4} />
          
          {/* Shirt */}
          <path d="M274 312 L300 375 L326 312 Z" fill="url(#bm-shirt)" />
          
          {/* Tie (New Detail) */}
          <path d="M296 322 L304 322 L300 334 Z" fill="#7f1d1d" /> {/* Knot */}
          <path d="M298 334 L302 334 L308 395 L300 405 L292 395 Z" fill="url(#bm-tie)" /> {/* Body of Tie */}
          
          {/* Lapels (Cleaner cuts) */}
          <path d="M266 310 L300 375 L300 395 L242 326 Z" fill="#1e293b" />
          <path d="M334 310 L300 375 L300 395 L358 326 Z" fill="#1e293b" />
          
          {/* Badge */}
          <line x1={342} y1={346} x2={358} y2={384} stroke="#cbd5e1" strokeWidth={2} opacity={0.9} />
          <rect x={345} y={380} width={34} height={26} rx={5} fill="#f8fafc" stroke="#94a3b8" strokeWidth={1.5} />
          <circle cx={354} cy={393} r={5} fill="url(#bm-badge)" />
          <line x1={363} y1={389} x2={374} y2={389} stroke="#0ea5e9" strokeWidth={2} strokeLinecap="round" />
          <line x1={363} y1={397} x2={372} y2={397} stroke="#94a3b8" strokeWidth={2} strokeLinecap="round" />
        </g>

        {/* Neck */}
        <path d="M283 276 h34 v25 c-6 7 -28 7 -34 0 z" fill="url(#bm-skin)" />
        <path d="M284 288 c8 6 24 6 32 0 v13 c-6 7 -26 7 -32 0 z" fill="#b47863" opacity={0.5} /> {/* Improved neck shadow */}

        {/* Head */}
        <motion.g
          style={{ transformBox: "view-box", transformOrigin: "300px 268px" }}
          animate={{ rotate: pose.headRot * 0.38, x: pose.headRot * 1.15 }}
          transition={{ type: "spring", stiffness: 120, damping: 15 }}
        >
          {/* Ears */}
          <ellipse cx={239} cy={205} rx={11} ry={16} fill="url(#bm-skin)" />
          <ellipse cx={361} cy={205} rx={11} ry={16} fill="url(#bm-skin)" />
          <path d="M236 203 C243 198 246 208 240 214" stroke="#d6937f" strokeWidth={1.8} strokeLinecap="round" fill="none" opacity={0.8} />
          <path d="M364 203 C357 198 354 208 360 214" stroke="#d6937f" strokeWidth={1.8} strokeLinecap="round" fill="none" opacity={0.8} />

          {/* Face Base */}
          <path d="M241 194 C241 143 263 119 300 119 C337 119 359 143 359 194 C359 243 334 270 300 270 C266 270 241 243 241 194 Z" fill="url(#bm-skin)" />
          
          {/* Chin/Jaw Shading */}
          <path d="M257 214 C252 198 255 176 264 161" stroke="#ffffff" strokeWidth={9} strokeLinecap="round" opacity={0.15} />
          <path d="M262 244 C276 263 324 263 338 244 C331 260 269 260 262 244 Z" fill="#d6937f" opacity={0.4} />
          
          {/* Cheeks (Subdued slightly) */}
          <ellipse cx={270} cy={215} rx={10} ry={5} fill="#ef4444" opacity={0.12} />
          <ellipse cx={330} cy={215} rx={10} ry={5} fill="#ef4444" opacity={0.12} />

          {/* Hair (Sharpened) */}
          <path d="M235 190 C230 153 241 122 267 108 C286 98 316 97 340 110 C361 122 371 151 366 193 C360 171 349 154 331 148 C342 162 345 178 343 193 C329 168 308 154 289 154 C270 154 252 170 244 198 C240 196 237 193 235 190 Z" fill="url(#bm-hair)" />
          <path d="M242 169 C250 137 270 118 302 112 C331 107 350 123 359 148 C339 131 310 130 282 139 C262 146 250 158 242 169 Z" fill="#4a3627" opacity={0.6} />
          <path d="M300 108 C285 115 272 126 262 142" stroke="#1c130d" strokeWidth={4.5} strokeLinecap="round" opacity={0.5} />
          <path d="M315 111 C298 117 281 130 267 149" stroke="#5c3d2b" strokeWidth={4} strokeLinecap="round" opacity={0.6} />
          <path d="M331 120 C314 124 296 135 282 151" stroke="#1c130d" strokeWidth={3.5} strokeLinecap="round" opacity={0.4} />

          <BlinkingEyes blink={blink} lookX={pose.lookX} lookY={pose.lookY} brow={pose.brow} reduced={reduced} />

          {/* Glasses (Thick frames, real glass look) */}
          <g stroke="#334155" strokeWidth={3.5} fill="#bae6fd" fillOpacity={0.25}>
            <rect x={260} y={172} width={36} height={27} rx={7} />
            <rect x={304} y={172} width={36} height={27} rx={7} />
            <path d="M296 186 C299 183 301 183 304 186" fill="none" />
            <path d="M260 185 L244 181" fill="none" />
            <path d="M340 185 L356 181" fill="none" />
          </g>
          {/* Glass Glare */}
          <path d="M264 178 L274 178" stroke="#ffffff" strokeWidth={2.5} strokeLinecap="round" opacity={0.6} fill="none" />
          <path d="M308 178 L318 178" stroke="#ffffff" strokeWidth={2.5} strokeLinecap="round" opacity={0.6} fill="none" />

          {/* Nose */}
          <path d="M298 200 C294 214 292 221 300 225 C308 221 306 214 302 200" fill="none" stroke="#d6937f" strokeWidth={2.5} strokeLinecap="round" />
          
          {/* Mouth */}
          <path
            d={MOUTHS[pose.mouth]}
            fill={pose.mouth === "big" ? "#9f1239" : "none"}
            stroke="#7c2f39"
            strokeWidth={3}
            strokeLinecap="round"
          />
          {/* Teeth/Smile detail */}
          <path d="M283 235 C291 241 309 241 317 235" stroke="#ffffff" strokeWidth={2} strokeLinecap="round" opacity={pose.mouth === "smile" || pose.mouth === "big" ? 0.8 : 0} />
        </motion.g>
      </motion.g>

      {/* Interactive Elements (Thumb, Scratch, Coffee) */}
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