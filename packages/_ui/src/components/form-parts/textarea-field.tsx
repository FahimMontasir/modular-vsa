"use client";

import type { ComponentProps, ReactNode } from "react";

import { Field, FieldLabel } from "../field";
import { Textarea } from "../textarea";
import { FieldFeedback } from "./field-feedback";
import { useFieldContext } from "./form-context";

type TextareaFieldProps = Omit<
  ComponentProps<typeof Textarea>,
  "name" | "value" | "defaultValue" | "onBlur" | "onChange"
> & {
  label: ReactNode;
  description?: ReactNode;
  error?: string;
};

export function TextareaField({ label, description, error, id, ...props }: TextareaFieldProps) {
  const field = useFieldContext<string>();
  const invalid = Boolean(error) || (field.state.meta.isTouched && !field.state.meta.isValid);
  const controlId = id ?? field.name;

  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={controlId}>{label}</FieldLabel>
      <Textarea
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
