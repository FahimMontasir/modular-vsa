"use client";

import type { ComponentProps, ReactNode } from "react";

import { Field, FieldLabel } from "../field";
import { Input } from "../input";
import { FieldFeedback } from "./field-feedback";
import { useFieldContext } from "./form-context";

type TextFieldProps = Omit<
  ComponentProps<typeof Input>,
  "name" | "value" | "defaultValue" | "onBlur" | "onChange"
> & {
  label: ReactNode;
  description?: ReactNode;
  error?: string;
};

export function TextField({ label, description, error, id, ...props }: TextFieldProps) {
  const field = useFieldContext<string>();
  const invalid = Boolean(error) || (field.state.meta.isTouched && !field.state.meta.isValid);
  const controlId = id ?? field.name;

  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={controlId}>{label}</FieldLabel>
      <Input
        id={controlId}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
        aria-invalid={invalid}
        {...props}
      />
      <FieldFeedback description={description} error={error} />
    </Field>
  );
}
