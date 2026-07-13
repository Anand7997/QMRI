# Login Page Character: Realistic Redesign + Peek-Right Typing Behavior

Date: 2026-07-11
Status: Approved

## Goal

Replace the current cartoon-boy SVG illustration in `AnimatedCharacter.tsx` (used on
the non-admin `LoginPage.tsx` visual panel) with a semi-realistic vector illustration
of a man seated at a desk. Add a "peeking" behavior: whenever the user is typing in
any field, the character's head/eyes snap away from mouse-following and lock onto
the login form on the right side of the page, reverting to idle mouse-follow once
typing stops.

## Context

- File: `frontend/src/features/auth/components/AnimatedCharacter.tsx` (currently
  untracked/new — no prior committed version to diff against).
- Rendered by `AuthVisualPanel` inside
  `frontend/src/features/auth/pages/LoginPage.tsx`, only for `audience === "user"`
  (admin audience renders `AdminConsoleIllustration` instead — untouched).
- Layout: `AuthVisualPanel` (character illustration) is the **left** grid column;
  the sign-in/sign-up form is the **right** grid column. "Peeking right" means the
  character looks toward its own right edge, i.e. toward the form.
- Current props/contract, unchanged: `activeField`, `typingLength`, `showPassword`,
  `isTyping` (all already threaded from `LoginPage.tsx` state, including the 900ms
  typing-idle timer via `markTyping()`).
- Current implementation: pure inline SVG + CSS transitions, no canvas/WebGL, no
  extra dependencies. `ui-ux-pro-max` skill's `style` domain data confirms a true 3D
  WebGL/Three.js character route is poor-performance/not-accessible and is
  explicitly ruled out for this login-page use case.
- Chosen visual reference (per user's answer during brainstorming): semi-realistic
  flat illustration style (Storyset/Humaaans-like) — natural adult human
  proportions, flat-shaded skin/hair/clothing with soft gradient shadows for depth,
  minimal outline detail. Not photoreal, not the current big-eyed cartoon style.

## Non-goals

- No new dependency (no Three.js, no external illustration library/asset import).
- No change to `AdminConsoleIllustration` or the admin sign-in visual.
- No change to `AnimatedCharacter`'s prop contract or to `LoginPage.tsx`'s state
  logic (`isTyping`, `markTyping`, `activeField` are reused as-is).
- No change to the password-shield show/hide trigger condition
  (`isPassword && !showPassword`), only its redrawn visual to match the new style.
- No literal photorealism / raster asset — stays fully vector/SVG so it keeps
  scaling crisply and needs no image loading/CLS handling.

## Visual redesign

Redraw the SVG markup inside `AnimatedCharacter.tsx` as a semi-realistic seated man:

- Natural adult proportions (not the current oversized-head/big-eyes cartoon
  ratio): standard head-to-shoulder-width ratio, slimmer neck, realistic hand/arm
  shapes.
- Skin/hair: flat base color with a soft one-direction gradient (2-3 stops) for
  shading instead of the current radial "toy" skin gradient; hair as a solid
  shape with a subtle highlight, not a glossy gradient.
- Clothing: keep the blue sweater/hoodie silhouette (existing brand-blue
  gradient), redrawn with realistic fabric fold lines (a few flat shading paths)
  instead of a flat blob shape.
- Desk/monitor scene composition stays the same layout (desk bar, monitor with
  code-like lines, keyboard dots) — only the character figure is redrawn, so
  existing focus/typing indicator elements on the desk (keyboard dot fill,
  monitor glow) are reused unchanged.
- Palette stays inside existing brand tokens already used in this file (blues:
  `#3B82F6`/`#2563EB`/`#1D4ED8`, skin tones warmed to a natural flat tone,
  neutrals `#E2E8F0`/`#F8FAFC`), no new arbitrary hex families introduced.
- Password-shield overlay graphic redrawn in the same simplified/flat style
  (currently a padlock-in-rounded-square) so it matches the new character's line
  weight.

## Peek-right typing behavior

- Add `peeking = isTyping` (derived, no new prop — `isTyping` already flows in).
- **Eyes:** when `peeking`, pupil offset is a fixed pair of constants (looking
  right and very slightly up, e.g. toward the desk monitor edge/toward the form),
  ignoring live mouse position entirely. When not `peeking`, current mouse-follow
  math (`pupilX`/`pupilY` derived from `mouse.x`/`mouse.y` and `focus`/`isPassword`)
  is unchanged.
- **Head:** when `peeking`, `headRotate` takes a larger fixed magnitude (bigger
  than today's `focus ? 8 : -5`) feeding the existing
  `translateX(headRotate*1.5) rotate(headRotate*0.25deg)` transform, so the head
  leans/turns further right than any current idle/focus state produces. When not
  `peeking`, current `focus`-based value is unchanged.
- Existing CSS transitions (`0.18s` eyes, `0.4s` head, both already
  cubic-bezier-eased) handle the snap-in/snap-out animation — no new transition
  timing needed.
- Behavior applies regardless of which field is focused (identifier, password,
  fullName, userName, email, signUpPassword) — it's driven purely by `isTyping`,
  not by `activeField`. The password-shield overlay (separately gated by
  `isPassword && !showPassword`) can be visible at the same time as peeking; the
  head still turns right underneath/alongside the shield graphic.
- Blink interval logic (`useEffect` random blink timer) is unchanged.

## Testing / verification

- Manual check via dev server at the non-admin login route (`/login` or
  equivalent `RoutePaths.login`): confirm illustration renders (no console
  errors), reads as a realistic seated man rather than the previous cartoon boy.
- Type in each of the six fields across sign-in and sign-up tabs; confirm head/
  eyes snap right within the field's typing burst and revert to idle mouse-follow
  ~900ms after the last keystroke.
- Toggle the password field's show/hide icon; confirm shield still
  appears/disappears correctly and the new head-turn still functions while it's
  visible.
- Confirm `prefers-reduced-motion` still disables all animation (existing
  media-query block in the `sx` is untouched).
- `npm run build` / `tsc` in `frontend/` — no type errors (prop contract
  unchanged).
