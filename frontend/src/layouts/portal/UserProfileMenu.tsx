import { useState } from "react";
import {
  Avatar,
  Box,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import { useNavigate } from "react-router-dom";
import { RoutePaths } from "shared/constants/routePaths";
import type { PortalProfile } from "./types";

interface UserProfileMenuProps {
  profile: PortalProfile;
}

export function UserProfileMenu({ profile }: UserProfileMenuProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();
  const close = () => setAnchorEl(null);

  return (
    <>
      <Tooltip title="Account">
        <IconButton
          aria-label="Open account menu"
          aria-controls={open ? "profile-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{ ml: 0.5 }}
        >
          <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: 14 }}>
            {profile.initial}
          </Avatar>
        </IconButton>
      </Tooltip>
      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { width: 220 } } }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" fontWeight={700} noWrap>
            {profile.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {profile.email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem
          onClick={() => {
            close();
            navigate(profile.profilePath);
          }}
        >
          <ListItemIcon>
            <PersonOutlineIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem
          onClick={() => {
            close();
            navigate(profile.settingsPath);
          }}
        >
          <ListItemIcon>
            <SettingsOutlinedIcon fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            close();
            navigate(RoutePaths.login);
          }}
        >
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </>
  );
}
