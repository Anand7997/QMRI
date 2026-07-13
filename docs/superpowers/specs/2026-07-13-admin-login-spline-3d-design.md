# Admin Login — Spline 3D Scene Integration

Date: 2026-07-13

## Goal

Replace the admin login's right-hand visual panel (`AdminConsoleIllustration`) with an
interactive Spline 3D scene, using the shadcn-style component supplied by the requester.
Admin login only. User login is untouched.

## Stack reality (as found)

- App is **MUI + Emotion**, not shadcn/ui. `LoginPage.tsx` is fully MUI.
- **Tailwind installed but inactive**: no `tailwind.config`, no `@tailwind` directives,
  empty `postcss.config.cjs`.
- Path aliases are bare (`shared/`, `features/`, ...) via `tsconfig.app.json` + `vite.config.ts`.
  No `@/` alias.
- No `components.json`, no `src/components/ui`, no `cn` util.
- Present: `lucide-react`, `motion` (framer-motion v12), `clsx`, `tailwind-merge`.
- Missing: `@splinetool/runtime`, `@splinetool/react-spline`.

The supplied component assumes shadcn + Tailwind + `@/`. Integration must supply those.

## Decisions

1. **Placement**: replace admin right panel `AdminConsoleIllustration` with the Spline card.
   Admin-only. User login and the MUI form stay as-is.
2. **Tailwind**: configure it properly (config + postcss + directives + spotlight animation).
   Preflight stays on per request; if MUI visuals drift, flip `corePlugins.preflight = false`
   (the component needs no preflight, only utility classes).
3. **3D scene**: use demo remote URL `https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode`.

## Work items

### 1. Activate Tailwind (app-wide)
- `frontend/tailwind.config.ts`: content `./index.html`, `./src/**/*.{ts,tsx}`;
  `theme.extend.keyframes.spotlight` + `theme.extend.animation.spotlight` for `animate-spotlight`.
- `frontend/postcss.config.cjs`: `{ plugins: { tailwindcss: {}, autoprefixer: {} } }`.
- `src/styles/globals.css`: prepend `@tailwind base; @tailwind components; @tailwind utilities;`;
  add `.loader` spinner keyframes for the Spline Suspense fallback.

### 2. shadcn conventions
- `@/*` -> `./src/*` in both `tsconfig.app.json` `paths` and `vite.config.ts` `resolve.alias`.
- `src/lib/utils.ts`: `cn(...)` (clsx + tailwind-merge).
- Create `src/components/ui/` (shadcn default import root for the pasted files).

### 3. Component files (into `src/components/ui/`)
- `card.tsx` (shadcn, verbatim).
- `spotlight.tsx` (aceternity static-SVG variant; matches the demo's `fill="white"` usage).
- `splite.tsx` (`SplineScene`, lazy `@splinetool/react-spline`).
- ibelick spotlight is not used (demo uses aceternity variant).

### 4. Dependencies
- `npm i @splinetool/runtime @splinetool/react-spline`.
- No framer-motion install: aceternity spotlight is pure SVG.

### 5. Wire into admin login
- In `LoginPage.tsx`, `AuthVisualPanel` admin branch, replace `<AdminConsoleIllustration/>`
  with the Spline card block (demo split-card layout, QMRI admin copy).
- Keep the MUI form column unchanged.

## Responsive / perf
- Right panel is `display: {xs:"none", md:"flex"}` — 3D renders on md+ only; no mobile hit.
- Spline is `lazy()` + `<Suspense>` with a `.loader` fallback.
- `prefers-reduced-motion` already handled at the panel level.

## Verification
- `npm run build` (tsc -b + vite build) passes.
- Admin login `/admin/login` renders the 3D scene in the right panel on desktop.
- User login `/login` unchanged; rest of the MUI app visually unchanged (preflight check).
