# Admin Dashboard: Block Grid Redesign

Date: 2026-07-10
Status: Approved

## Goal

Strip the admin `DashboardPage` down to two things: the existing `RecentAssessments`
table, and a grid of clickable navigation blocks that mirror the admin sidebar
(`frontend/src/layouts/admin/navItems.ts`), styled as 3D tilt-on-hover cards. Remove
the hero banner, KPI stat row, maturity radar/donut charts, Exam Takers highlight
card, and top recommendations from this page.

## Context

- Admin dashboard lives at `frontend/src/features/dashboard/pages/DashboardPage.tsx`.
- Admin sidebar items are defined in `frontend/src/layouts/admin/navItems.ts`:
  Dashboard, Authentication, Assessment, Exam Takers, Question Bank, Structure,
  Reports, Settings.
- Stack is MUI + `motion/react` (framer-motion), `sx` props for styling. No
  Tailwind, no `lucide-react`, no shadcn `cn` utility anywhere in the frontend.
- A reference design was supplied (Tailwind/shadcn "Card3D" component: mouse-tilt
  3D card with gradient background, icon, title, description, hover glow). It must
  be **ported** to this project's stack, not added verbatim — no new Tailwind/
  lucide-react/cn dependency.
- `RecentAssessments.tsx` (table with assigned-by filter) stays functionally
  unchanged; it just becomes the top block on a simpler page.

## Non-goals

- No changes to `RecentAssessments.tsx` internals, `assessmentData.ts`, or backend.
- No removal of `MaturityRadar`, `BandDonut`, `TopRecommendations`, `StatCard`
  component files — only their usage on `DashboardPage` is removed. (Confirm during
  implementation that nothing else imports them before considering file deletion;
  if something else does, leave as-is.)
- No decorative rotating-SVG background ornaments from the reference design — not
  worth the complexity for a functional admin page. A subtle per-card corner accent
  is kept; the full-page ambient background animation is dropped.
- No generic `size`/`variant`/`loading`/`disabled` prop matrix on the new card —
  YAGNI. This page only ever needs one clickable, non-loading variant.

## New component: `Card3DBlock`

File: `frontend/src/features/dashboard/components/Card3DBlock.tsx`

Port of the reference "Card3D" tilt behavior using this codebase's conventions
(compare `StatCard.tsx`'s `motion.create(Card)` pattern):

- Props: `title: string`, `description: string`, `icon: ReactNode`,
  `gradient: string` (CSS gradient string), `onClick?: () => void`.
- Mouse-move handler computes tilt angle from cursor position relative to card
  bounds; `animate`/`whileHover` drives `rotateX`/`rotateY` + a slight lift
  (translateZ / y), spring transition (matches reference's stiffness/damping
  feel).
- Hover glow: a soft radial/linear highlight overlay that fades in, following
  existing hover-affordance patterns in the dashboard (e.g. `StatCard`'s
  `whileHover={{ y: -5 }}` + shadow change), not a literal copy of the reference's
  layered mouse-tracking gradient sheen — simplified to one clean highlight layer.
- Small corner accent (single subtle icon-shaped or geometric outline, low opacity)
  in one corner for visual texture — no second corner ornament, no animated
  rotation loop running at rest (only responds to hover/tap).
- Keyboard/click affordance: `role="button"`, `tabIndex={0}`, click and Enter/Space
  trigger `onClick`.

## Block data

Colocated in `Card3DBlock.tsx` or a small sibling data file — 7 entries, one per
non-Dashboard admin nav item, each with a distinct dark gradient (slate, blue,
purple, emerald, amber, rose, cyan) so the set reads as intentional:

| id | title | description | icon | route |
|---|---|---|---|---|
| authentication | Authentication | Manage user accounts, roles, and access permissions. | `AdminPanelSettingsOutlinedIcon` | `RoutePaths.authentication` |
| assessment | Assessment | Create, assign, and track QA maturity assessments. | `AssignmentOutlinedIcon` | `RoutePaths.assessments` |
| exam-takers | Exam Takers | See who hasn't started, who's in progress, and who has finished. | `GroupsOutlinedIcon` | `RoutePaths.examTakers` |
| question-bank | Question Bank | Build and organize the question library used across assessments. | `QuizOutlinedIcon` | `RoutePaths.questionBank` |
| structure | Structure | Configure maturity categories, dimensions, and scoring structure. | `AccountTreeOutlinedIcon` | `RoutePaths.structure` |
| reports | Reports | Review maturity trends and generate assessment reports. | `AssessmentOutlinedIcon` | `RoutePaths.reports` |
| settings | Settings | Manage account, organization, and system preferences. | `SettingsOutlinedIcon` | `RoutePaths.settings` |

Gradient hex values are decorative-only for this grid and are defined locally in
the dashboard feature, not added to the shared `app/theme/tokens/palette.ts`.

## `DashboardPage.tsx` layout

1. `RecentAssessments` (existing, unchanged) rendered full-width, first on the
   page — no hero banner above it.
2. Below it, a responsive CSS grid of the 7 `Card3DBlock`s: 1 column on `xs`, 2 on
   `sm`, 3 on `lg`+ (matches existing breakpoint conventions used elsewhere on
   this page, e.g. the KPI row's `gridTemplateColumns`).
3. Each block's `onClick` calls `navigate(route)` via `useNavigate` (same pattern
   already used in `DashboardPage.tsx`).
4. Removed from the page: hero header block, KPI `StatCard` row, the standalone
   "Exam Takers" highlight `Card`, the charts grid (`MaturityRadar`/`BandDonut`),
   and `TopRecommendations`. Their imports are removed from `DashboardPage.tsx`.
5. `dashboard.recentAssessments` (from `useAssessmentDashboardData`) is the only
   piece of `assessmentData.ts` output still consumed on this page; other fields
   (`assessmentCount`, `inProgressCount`, `overallScore`, `averageCompletion`,
   `categoryScores`, `bandDistribution`, `topRecommendations`) become unused by
   this page but the hook itself is not changed (may be used elsewhere or kept for
   future use — out of scope to touch `assessmentData.ts`).

## Testing / verification

- `npm run build` / `tsc` in `frontend/` to confirm no type errors from removed
  imports.
- Manual check via dev server: dashboard loads, Recent Assessments table still
  filters/renders rows, all 7 blocks tilt on hover and navigate to the correct
  route on click, responsive at mobile/tablet/desktop widths.
