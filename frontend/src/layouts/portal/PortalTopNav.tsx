import { AppBar, Box, IconButton, Toolbar } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { PORTAL_SIDEBAR_WIDTH, type PortalNavItem, type PortalProfile } from "./types";
import { PortalBreadcrumbs } from "./PortalBreadcrumbs";
import { NotificationMenu } from "./NotificationMenu";
import { UserProfileMenu } from "./UserProfileMenu";

interface PortalTopNavProps {
  items: PortalNavItem[];
  homePath: string;
  profile: PortalProfile;
  onMenuClick: () => void;
}

export function PortalTopNav({ items, homePath, profile, onMenuClick }: PortalTopNavProps) {
  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        width: { md: `calc(100% - ${PORTAL_SIDEBAR_WIDTH}px)` },
        ml: { md: `${PORTAL_SIDEBAR_WIDTH}px` },
        borderBottom: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Toolbar sx={{ gap: 1 }}>
        <IconButton
          aria-label="Open navigation menu"
          edge="start"
          onClick={onMenuClick}
          sx={{ display: { md: "none" } }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <PortalBreadcrumbs items={items} homePath={homePath} />
        </Box>

        <NotificationMenu />
        <UserProfileMenu profile={profile} />
      </Toolbar>
    </AppBar>
  );
}
