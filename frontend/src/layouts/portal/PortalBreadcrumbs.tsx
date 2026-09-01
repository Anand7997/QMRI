import { Breadcrumbs, Link, Typography } from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { Link as RouterLink, useLocation } from "react-router-dom";
import type { PortalNavItem } from "./types";

interface PortalBreadcrumbsProps {
  items: PortalNavItem[];
  homePath: string;
}

export function PortalBreadcrumbs({ items, homePath }: PortalBreadcrumbsProps) {
  const { pathname } = useLocation();
  const current = items.find((item) => item.path === pathname)?.label
    ?? (pathname.endsWith("/agent-analysis") ? "QAscan Agent analysis" : undefined);

  return (
    <Breadcrumbs
      separator={<NavigateNextIcon fontSize="small" />}
      aria-label="breadcrumb"
      sx={{ fontSize: 14 }}
    >
      <Link component={RouterLink} to={homePath} underline="hover" color="inherit">
        Home
      </Link>
      {current && (
        <Typography color="text.primary" fontSize={14} fontWeight={600}>
          {current}
        </Typography>
      )}
    </Breadcrumbs>
  );
}
