import { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";

type ActiveField = "identifier" | "password" | "fullName" | "userName" | "email" | "signUpPassword" | null;

interface AnimatedCharacterProps {
  activeField: ActiveField;
  typingLength: number;
  showPassword: boolean;
  isTyping: boolean;
}

/**
 * Login-page mascot: an original grey business cat (suit + tie) seated at a desk,
 * writing in a notebook. Eyes/head follow the cursor; while the user types the cat
 * peeks toward the sign-in form on the right, the notebook fills with ink, and a
 * privacy shield appears over password fields. Original design — not based on any
 * existing character.
 */
export function AnimatedCharacter({
  activeField,
  typingLength,
  showPassword,
  isTyping,
}: AnimatedCharacterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  const [blink, setBlink] = useState(false);

  const isPassword = activeField === "password" || activeField === "signUpPassword";
  const focus = isTyping || activeField !== null;
  const peeking = isTyping;
  const inkLines = Math.max(0, Math.min(6, Math.ceil((typingLength / 10) * 6)));

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const move = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      setMouse({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height });
    };
    el.addEventListener("mousemove", move);
    return () => el.removeEventListener("mousemove", move);
  }, []);

  useEffect(() => {
    const go = () => { setBlink(true); setTimeout(() => setBlink(false), 130); };
    const id = setInterval(go, 2200 + Math.random() * 3000);
    setTimeout(go, 200);
    return () => clearInterval(id);
  }, []);

  const mX = (mouse.x - 0.5) * 2;
  const mY = (mouse.y - 0.5) * 2;

  const pupilX = peeking ? 11 : mX * 4 + (focus ? 2 : -1.5);
  const pupilY = peeking ? -1.5 : mY * 2 + (isPassword ? 1 : 0);

  const baseHeadRotate = focus ? 8 : -5;
  const headRotate = peeking ? 24 : baseHeadRotate;

  const penLift = isPassword ? -8 : 0;

  return (
    <Box
      ref={containerRef}
      sx={{
        width: "100%",
        maxWidth: 500,
        mx: "auto",
        position: "relative",
        perspective: 1200,
        "@keyframes float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "@media (prefers-reduced-motion: reduce)": {
          "*": { animation: "none !important", transition: "none !important" },
        },
      }}
    >
      <Box
        sx={{
          animation: "float 4s ease-in-out infinite",
          transformStyle: "preserve-3d",
          transform: `rotateY(${(mouse.x - 0.5) * 10}deg) rotateX(${(mouse.y - 0.5) * -5}deg)`,
          transition: "transform 0.4s cubic-bezier(.2,.8,.2,1)",
        }}
      >
        <svg viewBox="0 0 600 480" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}>
          <defs>
            <linearGradient id="fur" x1="0.2" x2="0.8" y1="0" y2="1">
              <stop offset="0%" stopColor="#9CA7B5" />
              <stop offset="55%" stopColor="#78838F" />
              <stop offset="100%" stopColor="#5C6672" />
            </linearGradient>
            <linearGradient id="furShade" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#4B5560" stopOpacity="0" />
              <stop offset="100%" stopColor="#3E464F" stopOpacity="0.35" />
            </linearGradient>
            <linearGradient id="suit" x1="0.1" x2="0.9" y1="0" y2="1">
              <stop offset="0%" stopColor="#3C4657" />
              <stop offset="55%" stopColor="#333B49" />
              <stop offset="100%" stopColor="#2B3340" />
            </linearGradient>
            <linearGradient id="shirt" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>
            <linearGradient id="desk" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="40%" stopColor="#F8FAFC" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>
            <linearGradient id="deskShadow" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#0F172A" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#0F172A" stopOpacity="0.16" />
            </linearGradient>
            <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#C7D9F2" />
              <stop offset="100%" stopColor="#E8EEF9" />
            </linearGradient>
            <filter id="shadow">
              <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#0F172A" floodOpacity="0.12" />
            </filter>
            <filter id="glow">
              <feGaussianBlur stdDeviation="8" />
            </filter>
          </defs>

          <ellipse cx="300" cy="400" rx="200" ry="40" fill="#3B82F6" opacity="0.06" filter="url(#glow)" />

          {/* ─── Background scene (subtle office context) ─── */}
          <g opacity="0.55">
            {/* bookshelf, top-left */}
            <rect x="24" y="30" width="110" height="300" rx="4" fill="#E2E8F0" opacity="0.5" />
            {[64, 132, 200, 260].map((y) => (
              <rect key={y} x="30" y={y} width="98" height="4" rx="2" fill="#94A3B8" opacity="0.4" />
            ))}
            {[
              { x: 34, colors: ["#93C5FD", "#FCA5A5", "#86EFAC"] },
              { x: 76, colors: ["#FDE68A", "#C4B5FD", "#93C5FD"] },
            ].map((shelf) =>
              shelf.colors.map((c, i) => (
                <rect key={`${shelf.x}-${i}`} x={shelf.x + i * 12} y="70" width="9" height="58" rx="1.5" fill={c} opacity="0.55" />
              )),
            )}
            {/* window, top-right */}
            <rect x="428" y="14" width="150" height="130" rx="4" fill="url(#sky)" opacity="0.6" />
            <rect x="428" y="14" width="150" height="130" rx="4" stroke="#CBD5E1" strokeWidth="4" fill="none" />
            <line x1="503" y1="14" x2="503" y2="144" stroke="#CBD5E1" strokeWidth="3" />
            <line x1="428" y1="79" x2="578" y2="79" stroke="#CBD5E1" strokeWidth="3" />
            <rect x="440" y="90" width="18" height="52" fill="#94A3B8" opacity="0.35" />
            <rect x="466" y="60" width="14" height="82" fill="#94A3B8" opacity="0.3" />
            <rect x="536" y="100" width="20" height="42" fill="#94A3B8" opacity="0.35" />
            {/* desk lamp */}
            <ellipse cx="512" cy="300" rx="34" ry="20" fill="#FDE68A" opacity="0.35" filter="url(#glow)" />
            <rect x="508" y="330" width="8" height="34" rx="3" fill="#94A3B8" opacity="0.6" />
            <path d="M512 330c0-26 10-40 26-46" stroke="#94A3B8" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.6" />
            <path d="M524 278l30 12-8 16-30-10z" fill="#94A3B8" opacity="0.6" />
            {/* globe */}
            <circle cx="556" cy="356" r="15" fill="#BFDBFE" opacity="0.5" />
            <path d="M541 356c8-6 22-6 30 0M556 341v30" stroke="#3B82F6" strokeWidth="1.5" fill="none" opacity="0.4" />
            <rect x="550" y="371" width="12" height="4" rx="2" fill="#94A3B8" opacity="0.5" />
          </g>

          {/* ─── Desk (character sits on the front edge) ─── */}
          <rect x="40" y="404" width="520" height="76" rx="16" fill="url(#desk)" filter="url(#shadow)" />
          <rect x="40" y="404" width="520" height="5" rx="2.5" fill="#FFFFFF" opacity="0.85" />
          <rect x="40" y="470" width="520" height="10" rx="4" fill="url(#deskShadow)" />
          <rect x="454" y="418" width="92" height="14" rx="4" fill="#FFFFFF" opacity="0.9" />
          <text x="500" y="428" textAnchor="middle" fontSize="8" fontWeight="700" fill="#2563EB" fontFamily="sans-serif" opacity="0.75">
            SIGNED IN
          </text>

          {/* ─── Trailing leg (suit trouser + shoe) ─── */}
          <g filter="url(#shadow)">
            <path d="M282 402c-10 26-22 46-36 62" stroke="#2B3340" strokeWidth="24" strokeLinecap="round" fill="none" />
            <ellipse cx="240" cy="470" rx="17" ry="10" fill="#2A1C14" />
            <ellipse cx="240" cy="466" rx="17" ry="4" fill="#3E2A1E" opacity="0.6" />
          </g>

          {/* ─── Suit jacket body ─── */}
          <g filter="url(#shadow)">
            {/* shoulders */}
            <path d="M168 336c34-24 74-32 118-30" stroke="#333B49" strokeWidth="20" strokeLinecap="round" fill="none" opacity="0.85" />
            <path d="M432 336c-34-24-74-32-118-30" stroke="#333B49" strokeWidth="20" strokeLinecap="round" fill="none" opacity="0.85" />
            {/* jacket */}
            <path d="M158 332c-12 18-15 54-6 82h296c9-28 6-64-6-82" fill="url(#suit)" />
            {/* shirt V + collar */}
            <path d="M270 300 L300 342 L330 300 Z" fill="url(#shirt)" />
            <path d="M282 300l14 14-4-18z" fill="#FFFFFF" />
            <path d="M318 300l-14 14 4-18z" fill="#FFFFFF" />
            {/* lapels */}
            <path d="M266 300 L300 342 L300 356 L252 314 Z" fill="#2B3340" />
            <path d="M334 300 L300 342 L300 356 L348 314 Z" fill="#2B3340" />
            {/* tie */}
            <path d="M293 306h14l2 8-9 6-9-6z" fill="#5E1620" />
            <path d="M295 322h10l4 62-9 12-9-12z" fill="#7C1E2A" />
            <path d="M296 330h8" stroke="#5E1620" strokeWidth="2" opacity="0.5" />
            {/* pocket square */}
            <path d="M356 356l16-3-4 12z" fill="#FFFFFF" opacity="0.9" />
          </g>

          {/* ─── Leading leg (crossed, suit trouser + shoe) ─── */}
          <g filter="url(#shadow)">
            <path d="M322 404c22-16 40-32 54-50" stroke="#333B49" strokeWidth="25" strokeLinecap="round" fill="none" />
            <path d="M376 354c14 10 20 26 16 42" stroke="#333B49" strokeWidth="22" strokeLinecap="round" fill="none" />
            <rect x="390" y="390" width="48" height="16" rx="8" fill="#2A1C14" />
            <rect x="390" y="390" width="48" height="6" rx="3" fill="#3E2A1E" opacity="0.6" />
          </g>

          {/* ─── Neck fur ─── */}
          <path d="M272 268c4 18 4 32 0 44 9 8 18 10 28 10s19-2 28-10c-4-12-4-26 0-44" fill="url(#fur)" />
          <path d="M272 268c4 18 4 32 0 44 9 8 18 10 28 10s19-2 28-10c-4-12-4-26 0-44" fill="url(#furShade)" opacity="0.5" />

          {/* ─── Notebook resting on the raised knee ─── */}
          <g style={{ transform: `translateY(${penLift}px)`, transition: "transform 0.4s cubic-bezier(.2,.8,.2,1)" }}>
            <path d="M285 366l50 6v32l-50-4z" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
            <path d="M335 372l44-10v32l-44 8z" fill="#EEF2F7" stroke="#CBD5E1" strokeWidth="1.5" />
            <line x1="335" y1="372" x2="335" y2="404" stroke="#CBD5E1" strokeWidth="1.5" />
            {Array.from({ length: 6 }).map((_, i) => (
              <line
                key={i}
                x1="342"
                y1={378 + i * 4.5}
                x2={342 + Math.min(28, 6 + i * 3.6)}
                y2={377 + i * 4.5}
                stroke={i < inkLines ? "#2563EB" : "#CBD5E1"}
                strokeWidth="2"
                strokeLinecap="round"
                opacity={i < inkLines ? 0.85 : 0.4}
                style={{ transition: "stroke 0.15s ease, opacity 0.15s ease" }}
              />
            ))}
          </g>

          {/* ─── Arms (suit sleeves + paws) ─── */}
          <g style={{ transformOrigin: "186px 332px", transition: "transform 0.5s cubic-bezier(.34,1.56,.64,1)" }}>
            <path d="M182 334c28 18 50 32 70 46" stroke="#333B49" strokeWidth="17" strokeLinecap="round" fill="none" />
            <ellipse cx="266" cy="372" rx="7" ry="9" fill="#FFFFFF" opacity="0.95" />
            <ellipse cx="290" cy="386" rx="12" ry="10" fill="url(#fur)" />
          </g>
          <g style={{ transform: `translateY(${penLift}px)`, transition: "transform 0.4s cubic-bezier(.2,.8,.2,1)" }}>
            <path d="M418 334c-22 16-40 28-52 38" stroke="#333B49" strokeWidth="17" strokeLinecap="round" fill="none" />
            <ellipse cx="378" cy="366" rx="7" ry="9" fill="#FFFFFF" opacity="0.95" />
            <ellipse cx="362" cy="376" rx="12" ry="10" fill="url(#fur)" />
            <path d="M368 370l22-15" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M390 355l4-3" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" fill="none" />
          </g>

          {/* ─── HEAD (grey cat) ─── */}
          <g
            style={{
              transformOrigin: "300px 200px",
              transform: `translateX(${headRotate * 1.5}px) rotate(${headRotate * 0.25}deg)`,
              transition: "transform 0.4s cubic-bezier(.2,.8,.2,1)",
            }}
          >
            {/* ears */}
            <path d="M246 152 L252 96 L290 142 Z" fill="url(#fur)" />
            <path d="M354 152 L348 96 L310 142 Z" fill="url(#fur)" />
            <path d="M258 144 L262 112 L282 140 Z" fill="#E6A9B6" opacity="0.9" />
            <path d="M342 144 L338 112 L318 140 Z" fill="#E6A9B6" opacity="0.9" />

            {/* head */}
            <ellipse cx="300" cy="200" rx="76" ry="80" fill="url(#fur)" />
            <ellipse cx="300" cy="200" rx="76" ry="80" fill="url(#furShade)" opacity="0.4" />

            {/* forehead fur markings (original) */}
            <path d="M278 130c6 10 8 22 6 34M300 124c0 12 0 24-2 34M322 130c-6 10-8 22-6 34" stroke="#5C6672" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.4" />

            {/* muzzle */}
            <ellipse cx="300" cy="236" rx="44" ry="27" fill="#DCE3EC" />
            <ellipse cx="282" cy="238" rx="17" ry="13" fill="#E7ECF3" />
            <ellipse cx="318" cy="238" rx="17" ry="13" fill="#E7ECF3" />

            {/* eyebrows */}
            <path d="M260 176c11-6 25-6 35-1" stroke="#2B3138" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <path d="M305 175c11-5 25-5 35 1" stroke="#2B3138" strokeWidth="4.5" strokeLinecap="round" fill="none" />

            {/* eyes */}
            <g>
              <path d="M264 192c6-7 15-10 22-10s16 3 22 10c-6 6-15 9-22 9s-16-3-22-9z" fill="#FFFFFF" opacity={blink ? 0 : 0.98} style={{ transition: "opacity 0.1s" }} />
              <path d="M310 192c6-7 15-10 22-10s16 3 22 10c-6 6-15 9-22 9s-16-3-22-9z" fill="#FFFFFF" opacity={blink ? 0 : 0.98} style={{ transition: "opacity 0.1s" }} />
              <path d="M264 192c6-7 15-10 22-10s16 3 22 10" stroke="#2B3138" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />
              <path d="M310 192c6-7 15-10 22-10s16 3 22 10" stroke="#2B3138" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />

              <g style={{ transform: `translate(${pupilX}px, ${pupilY}px)`, transition: "transform 0.18s cubic-bezier(.2,.8,.2,1)", opacity: blink ? 0 : 1 }}>
                <circle cx="286" cy="192" r="9" fill="#CBA22C" />
                <circle cx="332" cy="192" r="9" fill="#CBA22C" />
                <circle cx="286" cy="192" r="9" fill="#8A6F1E" opacity="0.35" />
                <circle cx="332" cy="192" r="9" fill="#8A6F1E" opacity="0.35" />
                <ellipse cx="286" cy="192" rx="2.4" ry="6" fill="#171310" />
                <ellipse cx="332" cy="192" rx="2.4" ry="6" fill="#171310" />
                <circle cx="289" cy="188" r="1.8" fill="#FFFFFF" opacity="0.9" />
                <circle cx="335" cy="188" r="1.8" fill="#FFFFFF" opacity="0.9" />
              </g>
            </g>

            {/* nose */}
            <path d="M291 220h18l-9 11z" fill="#C77E8A" />
            <path d="M300 231v7" stroke="#2B3138" strokeWidth="2.5" strokeLinecap="round" />

            {/* mouth */}
            {focus ? (
              <>
                <path d="M300 238c-8 8-20 7-25-1" stroke="#2B3138" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <path d="M300 238c8 8 20 7 25-1" stroke="#2B3138" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              </>
            ) : (
              <>
                <path d="M300 238c-7 6-17 5-21-1" stroke="#2B3138" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <path d="M300 238c7 6 17 5 21-1" stroke="#2B3138" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              </>
            )}

            {/* whiskers */}
            <g stroke="#EEF2F6" strokeWidth="2" strokeLinecap="round" opacity="0.85">
              <path d="M276 232c-24-5-44-7-58-4" fill="none" />
              <path d="M276 240c-24 0-44 3-56 9" fill="none" />
              <path d="M324 232c24-5 44-7 58-4" fill="none" />
              <path d="M324 240c24 0 44 3 56 9" fill="none" />
            </g>
          </g>

          {/* ─── Password shield ─── */}
          <g
            style={{
              opacity: isPassword && !showPassword ? 1 : 0,
              transform: isPassword && !showPassword ? "scale(1) translateY(0)" : "scale(0.7) translateY(-16px)",
              transformOrigin: "160px 250px",
              transition: "opacity 0.3s ease, transform 0.4s cubic-bezier(.34,1.56,.64,1)",
            }}
          >
            <circle cx="160" cy="250" r="36" fill="#3B82F6" opacity={0.1} filter="url(#glow)" />
            <rect x="138" y="238" width="44" height="32" rx="9" fill="#FFFFFF" opacity={0.95} filter="url(#shadow)" />
            <path d="M148 238v-7c0-10 7-18 12-18s12 8 12 18v7" stroke="#3B82F6" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <circle cx="160" cy="254" r="5" fill="#3B82F6" opacity={0.15} />
            <path d="M157 254l3 3 6-6" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.7} />
          </g>

          {/* Focus indicator */}
          <circle
            cx={focus ? "560" : "440"}
            cy="200"
            r="28"
            fill="#3B82F6"
            opacity={focus ? 0.15 : 0.06}
            filter="url(#glow)"
            style={{ transition: "cx 0.5s ease, opacity 0.5s ease" }}
          />
        </svg>
      </Box>
    </Box>
  );
}
