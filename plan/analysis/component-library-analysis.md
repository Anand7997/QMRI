# Senior Frontend Architecture Analysis

Source analyzed: [plan.md](../../plan.md)

## Key Findings

1. The product is enterprise workflow software, not a quiz UI.
2. UI architecture explicitly requires persistent app shell, command bars, data grids, and deep breadcrumb navigation.
3. Tech stack constraints are React + TypeScript + Material UI + React Hook Form + TanStack Query.
4. Core UX behaviors required across screens: search, filter, sort, pagination, status states, confirmations, and audit-friendly actions.
5. The same UI patterns repeat across Admin and User portals, making a shared component layer mandatory.

## Architecture Decision

Create a reusable library layer at shared/components with thin, typed wrappers over Material UI and focused domain-ready APIs.

## Non-Duplication Strategy

- Centralize all repeated primitives (buttons, forms, table shells, dialogs, navigation, feedback).
- Move common field rendering to shared wrappers (label, helper, validation, required marker).
- Move page shell behaviors (header, command slots, breadcrumbs, navigation) to reusable layout components.
- Use one chart adapter with typed variants instead of per-screen chart implementations.
- Use one data grid and one table shell API for list pages.

## Component Categories Mapped To Plan Needs

- Action: AppButton
- Container: AppCard
- Data list: AppTable, DataGridTable, PaginationControl
- Data entry: AppForm, AppInput, AppDropdown
- Workflow safety: AppDialog
- Shell/navigation: SideNavigation, TopNavigation, BreadcrumbNav
- Insights: AppChart
- Feedback: AppProgressBar, NotificationProvider, Loader

## API Design Principles

- Keep component props small and explicit.
- Prefer controlled components with escape hatches.
- Use typed callbacks for row and action handlers.
- Always support loading and disabled states.
- Expose test IDs only when needed.
- Keep domain labels outside components to support localization.

## Accessibility Baseline

- Visible labels for all form controls.
- Keyboard focus and tab order preserved.
- aria-label for icon-only actions.
- Status communicated with text and color.
- Charts accompanied by legends and textual labels.

## Recommended Next Integration Step

Adopt the new library in the App Shell, Admin Dashboard tables, and Assessment Workspace first, since those screens contain the highest repeated UI patterns.
