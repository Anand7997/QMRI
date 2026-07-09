import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
} from "@mui/material";
import { NavLink } from "react-router-dom";
import { PORTAL_SIDEBAR_WIDTH, type PortalNavItem } from "./types";
import { QmriLogo } from "shared/components";

interface PortalSidebarProps {
  brandTitle: string;
  items: PortalNavItem[];
  mobileOpen: boolean;
  onClose: () => void;
}

function SidebarContent({
  brandTitle,
  items,
  onNavigate,
}: {
  brandTitle: string;
  items: PortalNavItem[];
  onNavigate: () => void;
}) {
  return (
    <Box role="navigation" aria-label="Primary" sx={{ height: "100%" }}>
      <Toolbar sx={{ px: 2.25 }}>
        <QmriLogo label={brandTitle} size="sm" />
      </Toolbar>
      <List sx={{ px: 1.5 }}>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <ListItemButton
              key={item.id}
              component={NavLink}
              to={item.path}
              end
              onClick={onNavigate}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                color: "text.secondary",
                "&.active": {
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  "& .MuiListItemIcon-root": { color: "inherit" },
                },
                "&.active:hover": { bgcolor: "primary.dark" },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
}

export function PortalSidebar({ brandTitle, items, mobileOpen, onClose }: PortalSidebarProps) {
  return (
    <Box
      component="nav"
      sx={{ width: { md: PORTAL_SIDEBAR_WIDTH }, flexShrink: { md: 0 } }}
      aria-label="Portal navigation"
    >
      {/* Mobile: temporary drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { width: PORTAL_SIDEBAR_WIDTH, boxSizing: "border-box" },
        }}
      >
        <SidebarContent brandTitle={brandTitle} items={items} onNavigate={onClose} />
      </Drawer>

      {/* Desktop: permanent drawer */}
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            width: PORTAL_SIDEBAR_WIDTH,
            boxSizing: "border-box",
            borderRight: "1px solid",
            borderColor: "divider",
          },
        }}
      >
        <SidebarContent brandTitle={brandTitle} items={items} onNavigate={() => undefined} />
      </Drawer>
    </Box>
  );
}


