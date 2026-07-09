import type { ReactNode } from "react";
import {
  AppBar,
  Box,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import { Menu as MenuIcon, Search as SearchIcon } from "@mui/icons-material";

export interface TopNavigationProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  actions?: ReactNode;
  userSlot?: ReactNode;
}

export function TopNavigation({
  title,
  subtitle,
  onMenuClick,
  searchValue,
  searchPlaceholder = "Search",
  onSearchChange,
  actions,
  userSlot,
}: TopNavigationProps) {
  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Toolbar sx={{ minHeight: 68, gap: 2 }}>
        {onMenuClick ? (
          <IconButton edge="start" onClick={onMenuClick} aria-label="Open navigation menu">
            <MenuIcon />
          </IconButton>
        ) : null}

        <Stack spacing={0.25} minWidth={220}>
          <Typography variant="h6" noWrap>
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="body2" color="text.secondary" noWrap>
              {subtitle}
            </Typography>
          ) : null}
        </Stack>

        <Box flex={1} display="flex" justifyContent="center">
          {onSearchChange ? (
            <TextField
              value={searchValue ?? ""}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              size="small"
              sx={{ width: "min(540px, 100%)" }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          ) : null}
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          {actions}
          {userSlot}
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
