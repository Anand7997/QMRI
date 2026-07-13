# User Login — Interactive 3D Businessman Character

Date: 2026-07-13

## Goal

Replace the user login's left-panel mascot (`AnimatedCharacter`, a grey cat) with a
premium, state-driven, interactive "3D businessman" built **purely** with HTML/SVG +
Tailwind + Framer Motion. No Three.js, no Canvas. Admin login is untouched.

## Decisions

- **Fidelity**: premium *stylized* semi-3D character (layered SVG + gradient shading +
  parallax depth). Pure CSS/Framer cannot render a photoreal human; this is the realistic
  ceiling and carries every specified animation.
- **Stack**: keep React 18 + Tailwind v3 (already configured) + Framer Motion (present via
  `motion` v12; declared explicitly with `framer-motion`). No React 19 / Tailwind v4 /
  shadcn migration — not required by any feature and would break the MUI host + admin work.
- Reuse existing shadcn scaffolding from the admin task: `@/` alias, `src/components/ui/`,
  `src/lib/utils.ts` (`cn`).

## Component API (fixed by spec)

```ts
interface InteractiveLoginCharacterProps {
  state:
    | "idle" | "username-focus" | "typing" | "password-focus"
    | "password-typing" | "loading" | "success" | "error";
  mouseX?: number; // normalized 0..1 over the form panel
  mouseY?: number;
}
```

Button-hover behavior from the prose is folded into the idle→loading transition; the fixed
8-state union has no hover state and is not extended.

## Files (all `src/components/ui/`)

- `interactive-login-character.tsx` — orchestrator. Blink timer (3–6s), 15s idle-timeout
  micro-behavior cycle (coffee → look around → notebook → idle), maps `state` + mouse →
  pose, responsive wrapper (desktop 50% / tablet 40% / mobile stacked above form).
- `office-background.tsx` — window + city skyline, bookshelf, plants, soft blue light,
  success glow + floating particles.
- `desk.tsx` — wooden desk, laptop (screen glows on `loading`), coffee, notebook, pen
  holder, phone, keyboard, mouse, desk lamp (glows on `loading`/`success`).
- `businessman.tsx` — figure in leather chair: black suit, white shirt, black tie, modern
  hair. Head rotate (±15° via mouse; 30° away on `password-typing`), breathing, shoulder
  sway, arms typing, thumbs-up (`success`), scratch head (`error`), coffee drink (idle).
- `coffee.tsx` — mug + rising steam (reused on desk and during drink behavior).
- `blinking-eyes.tsx` — pupils track mouse, blink, look-away, eyebrow raise on password.

## State → animation map

| state            | face / body                                                        |
|------------------|--------------------------------------------------------------------|
| idle             | breathing, blink, eyes toward form; 15s cycle micro-behaviors       |
| username-focus   | slight turn to user, smile, glance laptop↔field                     |
| typing           | hands type, fingers animate, glance, occasional blink               |
| password-focus   | stop typing, look at password field, raised eyebrow, friendly       |
| password-typing  | head 30° away, eyes away, slight smile, hands keep typing            |
| loading          | look at laptop, quick typing, desk light glows, eyes move            |
| success          | big smile, look at user, thumbs up, blue glow + particles           |
| error            | confused, look at laptop, scratch head, back to form, encouraging   |

## Integration (`LoginPage.tsx`)

- User branch of `AuthVisualPanel` renders `<InteractiveLoginCharacter state=… mouseX/Y/>`
  instead of `<AnimatedCharacter/>`.
- Derive `state` from existing LoginPage state: `submitting`→`loading`;
  `feedback.severity` `error`→`error`, `success`→`success`; `activeField`
  identifier/userName/email/fullName (+`isTyping`)→`typing`/`username-focus`;
  password/signUpPassword (+`isTyping`)→`password-typing`/`password-focus`; else `idle`.
- Track normalized cursor over the form column → `mouseX/mouseY`.
- Keep MUI form + admin path unchanged.

## Perf / a11y

- Animate only `transform` / `opacity` (GPU); `will-change` hints; `React.memo` on
  sub-components; `prefers-reduced-motion` disables motion.
- Decorative figure `aria-hidden`; form remains the accessible control.

## Verification

- `npm run build` (tsc -b + vite) passes.
- `/login` desktop: businessman left, form right; states react (focus fields, type, submit).
- `/admin/login` unchanged; rest of MUI app unchanged.
