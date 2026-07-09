import { forwardRef } from "react";
import type { ReactNode } from "react";
import { Button, CircularProgress, Stack } from "@mui/material";
import type { ButtonProps } from "@mui/material";

export interface AppButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
  startIconSlot?: ReactNode;
  endIconSlot?: ReactNode;
}

export const AppButton = forwardRef<HTMLButtonElement, AppButtonProps>(
  (
    {
      children,
      isLoading = false,
      loadingText,
      startIconSlot,
      endIconSlot,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <Button
        ref={ref}
        disabled={disabled || isLoading}
        startIcon={startIconSlot}
        endIcon={endIconSlot}
        {...props}
      >
        {isLoading ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={16} color="inherit" />
            <span>{loadingText ?? children}</span>
          </Stack>
        ) : (
          children
        )}
      </Button>
    );
  },
);

AppButton.displayName = "AppButton";
