# qMRI Reusable Component Library Blueprint

This library blueprint is designed for the React + TypeScript + Material UI stack defined in [plan.md](../plan.md).

## Objective

Prevent UI duplication across Admin and User portals by centralizing shared UI behavior in reusable components.

## Covered Components

- Buttons: AppButton
- Cards: AppCard
- Tables: AppTable
- Forms: AppForm
- Inputs: AppInput
- Dropdowns: AppDropdown
- Dialogs: AppDialog
- Side Navigation: SideNavigation
- Top Navigation: TopNavigation
- Charts: AppChart
- Progress Bars: AppProgressBar
- Notification: AppNotificationProvider + useAppNotification
- Loader: Loader
- Breadcrumb: BreadcrumbNav
- Pagination: PaginationControl
- Data Grid: DataGridTable

## Suggested Dependencies

- react
- @mui/material
- @mui/icons-material
- @mui/x-data-grid
- react-hook-form
- recharts
- notistack

## Folder Structure

```text
src
|-- components
|   |-- button
|   |-- card
|   |-- table
|   |-- forms
|   |-- dialog
|   |-- navigation
|   |-- charts
|   |-- progress
|   |-- feedback
|   |-- data
|-- theme
|-- types
|-- index.ts
```

## Architecture Rules

1. Every shared pattern must be implemented once in this library.
2. Page code composes library components rather than re-implementing UI primitives.
3. All components expose typed props and predictable loading/empty/error states.
4. Styling uses centralized tokens from theme/tokens.ts.
5. Forms integrate with React Hook Form through typed wrappers.

## Example Import

```ts
import {
  AppButton,
  AppCard,
  AppForm,
  AppInput,
  AppDropdown,
  DataGridTable,
} from "./src";
```
