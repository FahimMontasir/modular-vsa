"use client";

import type { ComponentProps, ReactNode } from "react";

import { Field, FieldLabel } from "../field";
import { NativeSelect } from "../native-select";
import { FieldFeedback } from "./field-feedback";
import { useFieldContext } from "./form-context";

type NativeSelectFieldProps = Omit<
  ComponentProps<typeof NativeSelect>,
  "name" | "value" | "defaultValue" | "onBlur" | "onChange"
> & {
  label: ReactNode;
  description?: ReactNode;
  error?: string;
  children: ReactNode;
};

export function NativeSelectField({
  label,
  description,
  error,
  children,
  id,
  ...props
}: NativeSelectFieldProps) {
  const field = useFieldContext<string>();
  const invalid = Boolean(error) || (field.state.meta.isTouched && !field.state.meta.isValid);
  const controlId = id ?? field.name;

  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={controlId}>{label}</FieldLabel>
      <NativeSelect
        id={controlId}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
        aria-invalid={invalid}
        {...props}
      >
        {children}
      </NativeSelect>
      <FieldFeedback description={description} error={error} />
    </Field>
  );
}
