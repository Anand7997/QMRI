# Admin Dashboard Block Grid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the admin `DashboardPage`'s hero/KPI/charts/recommendations sections with a `RecentAssessments` table plus a grid of 7 clickable, mouse-tilt "Card3D" blocks mirroring the admin sidebar nav items.

**Architecture:** One new presentational component (`Card3DBlock`) ported from a Tailwind/shadcn reference design to this codebase's MUI + `motion/react` conventions (see `StatCard.tsx` for the `motion.create(Card)` pattern). `DashboardPage.tsx` is simplified to render `RecentAssessments` followed by a responsive CSS grid of 7 `Card3DBlock` instances, each navigating to its route on click.

**Tech Stack:** React + TypeScript, MUI (`@mui/material`, `@mui/icons-material`), `motion/react` (framer-motion), React Router (`useNavigate`). No Tailwind, no `lucide-react`, no shadcn `cn` utility — do not introduce them.

## Global Constraints

- No test framework exists in `frontend/` (no vitest/jest/@testing-library configured, no `*.test.*`/`*.spec.*` files anywhere in `src`). Do not add one as a side effect of this work. Verification is via `tsc`/build success plus manual browser check through the dev server — not automated tests.
- Do not modify `RecentAssessments.tsx`, `assessmentData.ts`, or any backend code.
- Do not delete `MaturityRadar.tsx`, `BandDonut.tsx`, `TopRecommendations.tsx`, or `StatCard.tsx` — only remove their usage from `DashboardPage.tsx`. If a task finds one of these has no other importer, leave the file in place anyway (out of scope; confirmed unused is not the same as safe-to-delete without broader sign-off).
- Follow existing import alias style (`shared/constants/routePaths`, `app/theme/tokens/palette`, relative `../components/X` within the `dashboard` feature) — see `DashboardPage.tsx`'s current imports.
- Gradient hex values for the 7 blocks are decorative-only and stay local to the `dashboard` feature — do not add them to `app/theme/tokens/palette.ts`.
- Exact route constants (from `frontend/src/shared/constants/routePaths.ts`): `RoutePaths.authentication`, `RoutePaths.assessments`, `RoutePaths.examTakers`, `RoutePaths.questionBank`, `RoutePaths.structure`, `RoutePaths.reports`, `RoutePaths.settings`.

---

### Task 1: Create `Card3DBlock` component with block data

**Files:**
- Create: `frontend/src/features/dashboard/components/Card3DBlock.tsx`

**Interfaces:**
- Produces: `export function Card3DBlock(props: Card3DBlockProps): JSX.Element` where
  ```ts
  export interface Card3DBlockProps {
    title: string;
    description: string;
    icon: ReactNode;
    gradient: string;
    onClick?: () => void;
  }
  ```
- Produces: `export interface DashboardBlockDef { id: string; title: string; description: string; icon: ReactNode; gradient: string; route: string }`
- Produces: `export const dashboardBlocks: DashboardBlockDef[]` — the 7 entries below, in this order: authentication, assessment, exam-takers, question-bank, structure, reports, settings.

This is a pure presentational component with no test framework available in this
repo, so there is no automated test step — verification happens in Task 3 via
`tsc` and a manual browser check. Write the full implementation directly.

- [ ] **Step 1: Write `Card3DBlock.tsx`**

```tsx
import { useCallback, useState, type ReactNode } from "react";
import { Box, Card, Typography } from "@mui/material";
import { motion } from "motion/react";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { RoutePaths } from "shared/constants/routePaths";

const MotionCard = motion.create(Card);

export interface Card3DBlockProps {
  title: string;
  description: string;
  icon: ReactNode;
  gradient: string;
  onClick?: () => void;
}

interface MousePos {
  x: number;
  y: number;
}

export function Card3DBlock({ title, description, icon, gradient, onClick }: Card3DBlockProps) {
  const [mousePos, setMousePos] = useState<MousePos>({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const handleMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setMousePos({
      x: (x / rect.width - 0.5) * 20,
      y: (y / rect.height - 0.5) * -20,
    });
  }, []);

  const handleLeave = useCallback(() => {
    setHovered(false);
    setMousePos({ x: 0, y: 0 });
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!onClick) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onClick();
      }
    },
    [onClick]
  );

  return (
    <MotionCard
      role={onClick ? "button" : "article"}
      tabIndex={onClick ? 0 : -1}
      onMouseMove={handleMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleLeave}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      animate={{
        rotateX: mousePos.y,
        rotateY: mousePos.x,
        y: hovered ? -6 : 0,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 24, mass: 0.7 }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      sx={{
        position: "relative",
        overflow: "hidden",
        height: 200,
        p: 3,
        color: "#fff",
        background: gradient,
        cursor: onClick ? "pointer" : "default",
        transformStyle: "preserve-3d",
        boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
        "&:hover": { boxShadow: "0 18px 40px rgba(0,0,0,0.28)" },
      }}
      style={{ perspective: 1000 }}
    >
      {/* corner accent */}
      <Box
        sx={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 100,
          height: 100,
          borderRadius: "50%",
          bgcolor: "rgba(255,255,255,0.08)",
        }}
      />

      {/* hover glow */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 60%)",
        }}
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      <Box sx={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <Box sx={{ fontSize: 32, opacity: 0.9, display: "flex" }}>{icon}</Box>
        <Box>
          <Typography variant="h3" sx={{ color: "#fff", mb: 0.75 }}>
            {title}
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)" }}>
            {description}
          </Typography>
        </Box>
      </Box>
    </MotionCard>
  );
}

const GRADIENTS = {
  slate: "linear-gradient(135deg, #334155 0%, #0f172a 100%)",
  blue: "linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)",
  purple: "linear-gradient(135deg, #7e22ce 0%, #4c1d95 100%)",
  emerald: "linear-gradient(135deg, #059669 0%, #064e3b 100%)",
  amber: "linear-gradient(135deg, #b45309 0%, #78350f 100%)",
  rose: "linear-gradient(135deg, #be123c 0%, #881337 100%)",
  cyan: "linear-gradient(135deg, #0e7490 0%, #164e63 100%)",
} as const;

export interface DashboardBlockDef {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  gradient: string;
  route: string;
}

export const dashboardBlocks: DashboardBlockDef[] = [
  {
    id: "authentication",
    title: "Authentication",
    description: "Manage user accounts, roles, and access permissions.",
    icon: <AdminPanelSettingsOutlinedIcon fontSize="inherit" />,
    gradient: GRADIENTS.slate,
    route: RoutePaths.authentication,
  },
  {
    id: "assessment",
    title: "Assessment",
    description: "Create, assign, and track QA maturity assessments.",
    icon: <AssignmentOutlinedIcon fontSize="inherit" />,
    gradient: GRADIENTS.blue,
    route: RoutePaths.assessments,
  },
  {
    id: "exam-takers",
    title: "Exam Takers",
    description: "See who hasn't started, who's in progress, and who has finished.",
    icon: <GroupsOutlinedIcon fontSize="inherit" />,
    gradient: GRADIENTS.purple,
    route: RoutePaths.examTakers,
  },
  {
    id: "question-bank",
    title: "Question Bank",
    description: "Build and organize the question library used across assessments.",
    icon: <QuizOutlinedIcon fontSize="inherit" />,
    gradient: GRADIENTS.emerald,
    route: RoutePaths.questionBank,
  },
  {
    id: "structure",
    title: "Structure",
    description: "Configure maturity categories, dimensions, and scoring structure.",
    icon: <AccountTreeOutlinedIcon fontSize="inherit" />,
    gradient: GRADIENTS.amber,
    route: RoutePaths.structure,
  },
  {
    id: "reports",
    title: "Reports",
    description: "Review maturity trends and generate assessment reports.",
    icon: <AssessmentOutlinedIcon fontSize="inherit" />,
    gradient: GRADIENTS.rose,
    route: RoutePaths.reports,
  },
  {
    id: "settings",
    title: "Settings",
    description: "Manage account, organization, and system preferences.",
    icon: <SettingsOutlinedIcon fontSize="inherit" />,
    gradient: GRADIENTS.cyan,
    route: RoutePaths.settings,
  },
];
```

- [ ] **Step 2: Typecheck**

Run: `cd frontend && npx tsc --noEmit -p tsconfig.app.json`
Expected: no errors referencing `Card3DBlock.tsx`. (Pre-existing unrelated errors
elsewhere in the repo, if any, are not this task's concern — only confirm nothing
new comes from this file.)

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/dashboard/components/Card3DBlock.tsx
git commit -m "feat: add Card3DBlock nav component for admin dashboard"
```

---

### Task 2: Simplify `DashboardPage.tsx` to Recent Assessments + block grid

**Files:**
- Modify: `frontend/src/features/dashboard/pages/DashboardPage.tsx` (full rewrite of body; imports change)

**Interfaces:**
- Consumes: `Card3DBlock`, `Card3DBlockProps`, `dashboardBlocks`, `DashboardBlockDef` from `../components/Card3DBlock` (Task 1).
- Consumes: `RecentAssessments` from `../components/RecentAssessments` (unchanged existing export).
- Consumes: `useAssessmentDashboardData` from `../assessmentData` (unchanged existing export) — only `dashboard.recentAssessments`, `dashboard.isLoading`, `dashboard.isError` are used now.
- Consumes: `MotionReveal` from `../components/dashboardMotion` (unchanged existing export).

- [ ] **Step 1: Replace `DashboardPage.tsx` contents**

```tsx
import { Alert, Box, LinearProgress } from "@mui/material";
import { MotionConfig } from "motion/react";
import { useNavigate } from "react-router-dom";
import { RecentAssessments } from "../components/RecentAssessments";
import { Card3DBlock, dashboardBlocks } from "../components/Card3DBlock";
import { MotionReveal } from "../components/dashboardMotion";
import { useAssessmentDashboardData } from "../assessmentData";

export function DashboardPage() {
  const navigate = useNavigate();
  const dashboard = useAssessmentDashboardData();

  return (
    <MotionConfig reducedMotion="user">
      <Box>
        {dashboard.isLoading ? <LinearProgress sx={{ mb: 2, borderRadius: 999 }} /> : null}
        {dashboard.isError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            Unable to load assessment dashboard data.
          </Alert>
        ) : null}

        <MotionReveal>
          <RecentAssessments rows={dashboard.recentAssessments} />
        </MotionReveal>

        <Box
          sx={{
            display: "grid",
            gap: 2,
            mt: 2,
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
          }}
        >
          {dashboardBlocks.map((block) => (
            <Card3DBlock
              key={block.id}
              title={block.title}
              description={block.description}
              icon={block.icon}
              gradient={block.gradient}
              onClick={() => navigate(block.route)}
            />
          ))}
        </Box>
      </Box>
    </MotionConfig>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd frontend && npx tsc --noEmit -p tsconfig.app.json`
Expected: no errors. In particular, confirm no leftover unused imports (`AddIcon`,
`AssignmentTurnedInOutlinedIcon`, `PendingActionsOutlinedIcon`,
`SpeedOutlinedIcon`, `TaskAltOutlinedIcon`, `GroupsOutlinedIcon`, `alpha`,
`Button`, `Card`, `Stack`, `Typography`, `MaturityChip`, `brandTokens`,
`dataTokens`, `semanticTokens`, `MaturityRadar`, `BandDonut`, `TopRecommendations`,
`StatCard`, `MotionStagger`) trigger lint/type errors — this rewrite already
removes all of them.

- [ ] **Step 3: Confirm no other importer breaks**

Run: `cd frontend && grep -rn "StatCard\|MaturityRadar\|BandDonut\|TopRecommendations" src --include="*.tsx" --include="*.ts"`
Expected: matches only inside the component files themselves (their own
definitions), confirming removing their usage from `DashboardPage.tsx` doesn't
orphan a broken import elsewhere. If any other file imports them, that's fine —
they remain valid components, just unused by this page now.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/dashboard/pages/DashboardPage.tsx
git commit -m "feat: simplify admin dashboard to Recent Assessments + nav block grid"
```

---

### Task 3: Manual verification in browser

**Files:** none (verification only)

- [ ] **Step 1: Start the frontend dev server**

Run: `cd frontend && npm run dev`
Expected: Vite dev server starts without errors, prints local URL.

- [ ] **Step 2: Load the admin dashboard and check Recent Assessments**

Navigate to the dashboard route while logged in as admin. Confirm the
`RecentAssessments` table renders at the top with real/mock rows, the
"Assigned by" filter still works, and no hero banner/KPI cards/charts appear
above it.

- [ ] **Step 3: Check the 7 nav blocks**

Confirm 7 gradient cards render below the table in the order: Authentication,
Assessment, Exam Takers, Question Bank, Structure, Reports, Settings. Hover each
to confirm the tilt effect responds to cursor position and a glow appears.
Resize the window to mobile width (1 column) and tablet width (2 columns) to
confirm the responsive grid.

- [ ] **Step 4: Check navigation**

Click each block and confirm it navigates to the corresponding route
(`/authentication`, `/assessments`, `/exam-takers`, `/question-bank`,
`/structure`, `/reports`, `/settings`).

- [ ] **Step 5: Stop the dev server**

Stop the process started in Step 1 (Ctrl+C or equivalent) once verification is
complete.
