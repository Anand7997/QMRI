import type { ComponentType } from "react";
import type { SvgIconProps } from "@mui/material";

export interface PortalNavItem {
  id: string;
  label: string;
  path: string;
  icon: ComponentType<SvgIconProps>;
}

export interface PortalProfile {
  name: string;
  email: string;
  initial: string;
  profilePath: string;
  settingsPath: string;
}

export const PORTAL_SIDEBAR_WIDTH = 264;
