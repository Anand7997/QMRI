import type { ReactNode } from "react";

export type StatusTone = "neutral" | "info" | "success" | "warning" | "error";

export interface NavItem {
  id: string;
  label: string;
  path?: string;
  icon?: ReactNode;
  badgeCount?: number;
  disabled?: boolean;
  children?: NavItem[];
  requiredPermissions?: string[];
}

export interface BreadcrumbItem {
  id: string;
  label: string;
  path?: string;
}

export type CellAlign = "left" | "center" | "right";

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  width?: number | string;
  align?: CellAlign;
  render?: (row: T) => ReactNode;
}

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface ChartSeries {
  key: string;
  label: string;
  color?: string;
}
