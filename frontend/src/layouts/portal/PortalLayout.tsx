import { useState } from "react";
import { Box, Toolbar } from "@mui/material";
import { Outlet } from "react-router-dom";
import { PortalSidebar } from "./PortalSidebar";
import { PortalTopNav } from "./PortalTopNav";
import { PortalFooter } from "./PortalFooter";
import type { PortalNavItem, PortalProfile } from "./types";

interface PortalLayoutProps {
  brandTitle: string;
  items: PortalNavItem[];
  homePath: string;
  profile: PortalProfile;
}

export function PortalLayout({ brandTitle, items, homePath, profile }: PortalLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <PortalTopNav
        items={items}
        homePath={homePath}
        profile={profile}
        onMenuClick={() => setMobileOpen(true)}
      />
      <PortalSidebar
        brandTitle={brandTitle}
        items={items}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <Box component="main" sx={{ flexGrow: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Spacer offsetting the fixed AppBar */}
        <Toolbar />
        <Box sx={{ flexGrow: 1, p: 3 }}>
          <Outlet />
        </Box>
        <PortalFooter />
      </Box>
    </Box>
  );
}
