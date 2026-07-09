import type { ReactNode } from "react";
import { FormControl, FormHelperText, FormLabel, Stack } from "@mui/material";

export interface FieldWrapperProps {
  label: string;
  required?: boolean;
  helperText?: string;
  errorText?: string;
  children: ReactNode;
}

export function FieldWrapper({
  label,
  required = false,
  helperText,
  errorText,
  children,
}: FieldWrapperProps) {
  return (
    <FormControl fullWidth error={Boolean(errorText)}>
      <Stack spacing={0.75}>
        <FormLabel required={required}>{label}</FormLabel>
        {children}
        {errorText ? (
          <FormHelperText>{errorText}</FormHelperText>
        ) : helperText ? (
          <FormHelperText>{helperText}</FormHelperText>
        ) : null}
      </Stack>
    </FormControl>
  );
}
