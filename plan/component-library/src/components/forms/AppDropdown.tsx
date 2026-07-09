import {
  Checkbox,
  ListItemText,
  MenuItem,
  Select,
  type SelectProps,
} from "@mui/material";
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import type { SelectOption } from "../../types/ui";
import { FieldWrapper } from "./FieldWrapper";

export interface AppDropdownProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  options: SelectOption[];
  required?: boolean;
  helperText?: string;
  multiple?: boolean;
  selectProps?: Omit<
    SelectProps,
    "name" | "multiple" | "value" | "onChange" | "displayEmpty"
  >;
  placeholder?: string;
}

export function AppDropdown<T extends FieldValues>({
  control,
  name,
  label,
  options,
  required = false,
  helperText,
  multiple = false,
  selectProps,
  placeholder = "Select",
}: AppDropdownProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const value = multiple
          ? Array.isArray(field.value)
            ? field.value
            : []
          : field.value ?? "";

        return (
          <FieldWrapper
            label={label}
            required={required}
            helperText={helperText}
            errorText={fieldState.error?.message}
          >
            <Select
              {...field}
              value={value}
              multiple={multiple}
              displayEmpty
              size="small"
              fullWidth
              error={Boolean(fieldState.error)}
              renderValue={(selected) => {
                if (multiple) {
                  const selectedArray = Array.isArray(selected) ? selected : [];
                  if (selectedArray.length === 0) {
                    return placeholder;
                  }

                  return options
                    .filter((option) => selectedArray.includes(option.value))
                    .map((option) => option.label)
                    .join(", ");
                }

                if (selected === "" || selected === undefined || selected === null) {
                  return placeholder;
                }

                return options.find((option) => option.value === selected)?.label ?? String(selected);
              }}
              {...selectProps}
            >
              {!multiple && (
                <MenuItem value="">
                  <em>{placeholder}</em>
                </MenuItem>
              )}

              {options.map((option) => (
                <MenuItem key={String(option.value)} value={option.value} disabled={option.disabled}>
                  {multiple && <Checkbox checked={Array.isArray(value) && value.includes(option.value)} />}
                  <ListItemText primary={option.label} />
                </MenuItem>
              ))}
            </Select>
          </FieldWrapper>
        );
      }}
    />
  );
}
