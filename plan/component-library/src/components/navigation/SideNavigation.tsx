import { useState, type ReactNode } from "react";
import {
  Badge,
  Box,
  Collapse,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import type { NavItem } from "../../types/ui";

export interface SideNavigationProps {
  items: NavItem[];
  activePath?: string;
  onNavigate: (path: string) => void;
  width?: number;
  logo?: ReactNode;
  footer?: ReactNode;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function hasActiveDescendant(item: NavItem, activePath?: string): boolean {
  if (!item.children || item.children.length === 0) {
    return false;
  }

  return item.children.some(
    (child) => child.path === activePath || hasActiveDescendant(child, activePath),
  );
}

export function SideNavigation({
  items,
  activePath,
  onNavigate,
  width = 276,
  logo,
  footer,
  mobileOpen = false,
  onMobileClose,
}: SideNavigationProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  const toggleExpanded = (id: string) => {
    setExpandedMap((previous) => ({
      ...previous,
      [id]: !previous[id],
    }));
  };

  const renderNavItems = (navItems: NavItem[], level = 0) => {
    return navItems.map((item) => {
      const hasChildren = Boolean(item.children?.length);
      const descendantActive = hasActiveDescendant(item, activePath);
      const selected = item.path === activePath || descendantActive;
      const expanded = expandedMap[item.id] ?? descendantActive;

      return (
        <Box key={item.id}>
          <ListItemButton
            disabled={item.disabled}
            selected={selected}
            onClick={() => {
              if (hasChildren) {
                toggleExpanded(item.id);
                return;
              }

              if (item.path) {
                onNavigate(item.path);
                if (isMobile) {
                  onMobileClose?.();
                }
              }
            }}
            sx={{
              pl: 2 + level * 2,
              py: 0.75,
              borderRadius: 1,
              mx: 1,
              my: 0.25,
            }}
          >
            {item.icon ? <ListItemIcon sx={{ minWidth: 34 }}>{item.icon}</ListItemIcon> : null}
            <ListItemText
              primary={
                item.badgeCount && item.badgeCount > 0 ? (
                  <Badge color="primary" badgeContent={item.badgeCount} max={99}>
                    <Box pr={2}>{item.label}</Box>
                  </Badge>
                ) : (
                  item.label
                )
              }
            />
            {hasChildren ? expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" /> : null}
          </ListItemButton>

          {hasChildren ? (
            <Collapse in={expanded} timeout="auto" unmountOnExit>
              <List disablePadding>{renderNavItems(item.children ?? [], level + 1)}</List>
            </Collapse>
          ) : null}
        </Box>
      );
    });
  };

  const drawerContent = (
    <Box display="flex" flexDirection="column" height="100%">
      <Toolbar sx={{ px: 2 }}>
        {logo ?? (
          <Typography variant="h6" noWrap>
            qMRI Platform
          </Typography>
        )}
      </Toolbar>
      <Divider />

      <Box flex={1} overflow="auto" py={1}>
        <List disablePadding>{renderNavItems(items)}</List>
      </Box>

      {footer ? (
        <>
          <Divider />
          <Box p={2}>{footer}</Box>
        </>
      ) : null}
    </Box>
  );

  return (
    <Drawer
      variant={isMobile ? "temporary" : "permanent"}
      open={isMobile ? mobileOpen : true}
      onClose={onMobileClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        width,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width,
          boxSizing: "border-box",
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
