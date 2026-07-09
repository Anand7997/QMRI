# qMRI Frontend Feature Modular Project Structure

## Architecture Goal

Build a feature-first React architecture that prevents page-level duplication by separating:

- app bootstrap and routing concerns
- reusable shell and UI concerns
- domain-specific feature concerns
- cross-cutting data, state, and utilities

This structure aligns with React + TypeScript + Material UI + React Hook Form + TanStack Query.

## Recommended Frontend Structure

```text
src
|
|-- app
|   |-- bootstrap
|   |-- routes
|   |-- providers
|   |-- guards
|   |-- config
|   |-- store
|   |-- theme
|
|-- layouts
|   |-- AppShellLayout
|   |-- AdminLayout
|   |-- UserLayout
|   |-- AuthLayout
|   |-- WorkspaceLayout
|   |-- components
|
|-- pages
|   |-- NotFoundPage
|   |-- UnauthorizedPage
|   |-- ErrorPage
|   |-- MaintenancePage
|
|-- features
|   |-- auth
|   |   |-- pages
|   |   |-- components
|   |   |-- hooks
|   |   |-- contexts
|   |   |-- api
|   |   |-- services
|   |   |-- utilities
|   |   |-- assets
|   |   |-- types
|   |
|   |-- dashboard
|   |   |-- pages
|   |   |-- components
|   |   |-- hooks
|   |   |-- contexts
|   |   |-- api
|   |   |-- services
|   |   |-- utilities
|   |   |-- assets
|   |   |-- types
|   |
|   |-- assessments
|   |-- assessment-workspace
|   |-- assessment-builder
|   |-- users
|   |-- roles
|   |-- question-bank
|   |-- assignments
|   |-- scoring
|   |-- recommendations
|   |-- reports
|   |-- analytics
|   |-- governance
|   |-- audit-logs
|   |-- profile
|   |-- notifications
|       |-- pages
|       |-- components
|       |-- hooks
|       |-- contexts
|       |-- api
|       |-- services
|       |-- utilities
|       |-- assets
|       |-- types
|
|-- shared
|   |-- components
|   |-- hooks
|   |-- contexts
|   |-- api
|   |-- services
|   |-- utilities
|   |-- assets
|   |-- constants
|   |-- types
|
|-- assets
|   |-- images
|   |-- icons
|   |-- fonts
|   |-- illustrations
|
|-- styles
|   |-- globals
|   |-- tokens
|   |-- mixins
|
|-- testing
|   |-- fixtures
|   |-- mocks
|   |-- integration
|   |-- e2e
```

## Why Each Top-Level Folder Exists

### app
Why it exists: Centralizes startup wiring so business features are not polluted with bootstrapping logic.

Contains:
- bootstrap: React app entry, root mounting, global initialization.
- routes: route tree and lazy loading boundaries.
- providers: app-wide providers for query client, theme, auth, notifications.
- guards: route guards for auth and permission checks.
- config: environment and runtime configuration mapping.
- store: app-level state wiring if global store is used.
- theme: Material UI theme wiring and overrides.

### layouts
Why it exists: Standardizes shell structure and prevents repeating top nav, side nav, breadcrumbs, and page framing.

Contains:
- AppShellLayout: default authenticated shell.
- AdminLayout: admin role shell and command pattern.
- UserLayout: user portal shell.
- AuthLayout: login and access pages shell.
- WorkspaceLayout: assessment execution split-pane shell.
- components: layout-only elements such as page header and command bar.

### pages
Why it exists: Holds route-level standalone pages that are not tied to a single domain feature.

Contains:
- NotFoundPage, UnauthorizedPage, ErrorPage, MaintenancePage.

### features
Why it exists: Core modular boundary for business domains. Each feature owns its UI, state, API, and local rules.

### shared
Why it exists: Houses reusable, cross-feature modules to eliminate duplication and enforce consistency.

### assets
Why it exists: Stores global static assets used across multiple features.

### styles
Why it exists: Keeps design tokens and global style primitives in one place for consistency and scale.

### testing
Why it exists: Organizes reusable test data, mocks, and high-level test suites outside feature runtime code.

## Why Each Standard Feature Subfolder Exists

Use the same internal folder template in every feature folder.

### pages
Why it exists: Route entry pages for that specific feature.

### components
Why it exists: Feature-specific presentational and container components that should not leak globally.

### hooks
Why it exists: Encapsulates feature stateful logic and orchestration.

### contexts
Why it exists: Feature-scoped context providers for data that is shared only inside that feature.

### api
Why it exists: HTTP request definitions and endpoint mapping for that feature.

### services
Why it exists: Orchestrates business workflows using api calls, transforms, and side effects.

### utilities
Why it exists: Pure helper functions for formatting, mapping, derivation, and validation tied to the feature.

### assets
Why it exists: Feature-local images, icons, and static files that should ship with the feature boundary.

### types
Why it exists: Feature-specific TypeScript contracts for DTOs, view models, and domain states.

## Feature Folders And Why Each Exists

### auth
Why it exists: Login, logout, token lifecycle, and session bootstrap flows.

### dashboard
Why it exists: KPI cards, summaries, and role-based landing analytics.

### assessments
Why it exists: Assessment list, details, instructions, and result history entry points.

### assessment-workspace
Why it exists: Dedicated assessment answering workflow with save/resume/review mechanics.

### assessment-builder
Why it exists: Admin authoring for hierarchy, weights, questions, and validation before publish.

### users
Why it exists: User administration and account lifecycle management.

### roles
Why it exists: Role and permission governance.

### question-bank
Why it exists: Reusable question governance and scale management.

### assignments
Why it exists: Assignment campaigns, allocation, and assignment tracking.

### scoring
Why it exists: Score views, maturity breakdowns, and score model interactions.

### recommendations
Why it exists: Recommendation rules and generated recommendation experiences.

### reports
Why it exists: Report generation, listing, metadata, and download actions.

### analytics
Why it exists: Comparative analytics, trend views, and maturity reporting.

### governance
Why it exists: Settings, lookup management, logo and file policy administration.

### audit-logs
Why it exists: Compliance and traceability workflows with search and event inspection.

### profile
Why it exists: User profile, preferences, and account settings.

### notifications
Why it exists: Notification center and user-facing alerts state.

## Duplication Prevention Rules

- New business UI must be created under a feature folder, not directly under pages.
- Shared UI primitives belong in shared/components and must be reused by all features.
- HTTP calls must be defined in feature api folders and consumed via feature services.
- Feature hooks are the only place for complex page orchestration logic.
- Contexts should be feature-scoped first; move to shared only when reused by at least two features.
- Utilities must remain pure and reusable; side effects belong in services.
- Assets should be feature-local unless reused across multiple modules.

## Index Barrel Strategy

Use index barrels at feature root and shared root for clean imports.

```text
features/<feature>/index.ts
shared/index.ts
layouts/index.ts
```

Why it exists: Keeps import paths stable during refactors and improves module discoverability.
