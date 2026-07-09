import type { ReactNode } from "react";
import {
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface FormDrawerProps {
  open: boolean;
  title: string;
  submitLabel?: string;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: () => void;
  children: ReactNode;
  width?: number;
}

export function FormDrawer({
  open,
  title,
  submitLabel = "Save",
  submitting = false,
  onClose,
  onSubmit,
  children,
  width = 480,
}: FormDrawerProps) {
  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", sm: width } } }}>
      <Stack sx={{ height: "100%" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, py: 2 }}>
          <Typography variant="h2">{title}</Typography>
          <IconButton aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
        <Divider />
        <Box sx={{ px: 3, py: 3, flexGrow: 1, overflowY: "auto" }}>{children}</Box>
        <Divider />
        <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="contained" onClick={onSubmit} disabled={submitting}>
            {submitLabel}
          </Button>
        </Stack>
      </Stack>
    </Drawer>
  );
}
