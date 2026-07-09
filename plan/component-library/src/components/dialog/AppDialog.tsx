import { useEffect, useState } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import { AppButton } from "../button/AppButton";

export interface AppDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: "primary" | "error" | "warning" | "success" | "info";
  isLoading?: boolean;
  requireReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  onClose: () => void;
  onConfirm: (reason?: string) => void | Promise<void>;
}

export function AppDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmColor = "primary",
  isLoading = false,
  requireReason = false,
  reasonLabel = "Reason",
  reasonPlaceholder,
  onClose,
  onConfirm,
}: AppDialogProps) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) {
      setReason("");
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={isLoading ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>

      <DialogContent>
        <Stack spacing={2} mt={0.5}>
          {description ? <DialogContentText>{description}</DialogContentText> : null}

          {requireReason ? (
            <TextField
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              label={reasonLabel}
              placeholder={reasonPlaceholder}
              minRows={3}
              multiline
              required
              fullWidth
            />
          ) : null}
        </Stack>
      </DialogContent>

      <DialogActions>
        <AppButton variant="outlined" onClick={onClose} disabled={isLoading}>
          {cancelLabel}
        </AppButton>

        <AppButton
          variant="contained"
          color={confirmColor}
          onClick={() => onConfirm(reason.trim() || undefined)}
          isLoading={isLoading}
          disabled={requireReason && reason.trim().length === 0}
        >
          {confirmLabel}
        </AppButton>
      </DialogActions>
    </Dialog>
  );
}
