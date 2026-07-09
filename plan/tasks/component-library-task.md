# Task: Reusable Component Library For qMRI

## Goal

Build a shared frontend component library so all qMRI pages reuse common UI primitives and avoid duplicate UI logic.

## Scope

- Buttons
- Cards
- Tables
- Forms
- Inputs
- Dropdowns
- Dialogs
- Side Navigation
- Top Navigation
- Charts
- Progress Bars
- Notification
- Loader
- Breadcrumb
- Pagination
- Data Grid

## Definition Of Done

- Every listed component exists in the shared library with typed props.
- Components support enterprise UX requirements from [plan.md](../../plan.md).
- Components are composable and can be reused across Admin and User portals.
- Shared styles are tokenized (colors, spacing, radius, elevation, typography).
- Forms and tables support validation, loading, empty, and error states.
- Navigation components support role-based visibility.
- No page-level UI duplication for common patterns.

## Work Breakdown

1. Foundation
- Define design tokens and semantic UI types.
- Define shared component API conventions.
- Build exports and folder architecture.

2. Core Interaction
- Build AppButton, AppDialog, NotificationProvider, Loader, AppProgressBar.

3. Data Entry
- Build AppForm, AppInput, AppDropdown with React Hook Form support.

4. Data Display
- Build AppCard, AppTable, PaginationControl, DataGridTable, AppChart.

5. Navigation
- Build SideNavigation, TopNavigation, BreadcrumbNav.

6. Integration Hardening
- Add usage examples in library README.
- Verify each component has loading, disabled, and empty behaviors where applicable.

## Risks

- Over-customizing Material UI wrappers can create unstable APIs.
- Chart wrapper can become too generic; keep a focused typed API.
- DataGrid licensing/features differ by package tier; keep abstraction thin.

## Rollout Strategy

1. Use new components in all new pages first.
2. Replace duplicated UI code incrementally by feature module.
3. Block direct raw MUI usage for patterns covered by shared components.
4. Add lint rules and code review checklist to enforce library adoption.
