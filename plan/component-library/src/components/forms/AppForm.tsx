import type { ReactNode } from "react";
import { Box } from "@mui/material";
import {
  FormProvider,
  type FieldValues,
  type SubmitHandler,
  type UseFormReturn,
} from "react-hook-form";

export interface AppFormProps<T extends FieldValues> {
  id?: string;
  methods: UseFormReturn<T>;
  onSubmit: (values: T) => void | Promise<void>;
  children: ReactNode;
}

export function AppForm<T extends FieldValues>({
  id,
  methods,
  onSubmit,
  children,
}: AppFormProps<T>) {
  const handleSubmit: SubmitHandler<T> = async (values) => {
    await onSubmit(values);
  };

  return (
    <FormProvider {...methods}>
      <Box component="form" id={id} noValidate onSubmit={methods.handleSubmit(handleSubmit)}>
        {children}
      </Box>
    </FormProvider>
  );
}
