import { TextField } from "@mui/material";
import type { TextFieldProps } from "@mui/material";
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { FieldWrapper } from "./FieldWrapper";

export interface AppInputProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  required?: boolean;
  helperText?: string;
  textFieldProps?: Omit<
    TextFieldProps,
    "name" | "label" | "required" | "helperText" | "value" | "onChange"
  >;
}

export function AppInput<T extends FieldValues>({
  control,
  name,
  label,
  required = false,
  helperText,
  textFieldProps,
}: AppInputProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <FieldWrapper
          label={label}
          required={required}
          helperText={helperText}
          errorText={fieldState.error?.message}
        >
          <TextField
            {...field}
            value={field.value ?? ""}
            fullWidth
            size="small"
            error={Boolean(fieldState.error)}
            {...textFieldProps}
          />
        </FieldWrapper>
      )}
    />
  );
}
