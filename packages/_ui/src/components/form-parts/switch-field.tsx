"use client";

import type { ComponentProps, ReactNode } from "react";

import { Field, FieldLabel } from "../field";
import { Switch } from "../switch";
import { FieldFeedback } from "./field-feedback";
import { useFieldContext } from "./form-context";

type SwitchFieldProps = Omit<
  ComponentProps<typeof Switch>,
  "name" | "checked" | "defaultChecked" | "onCheckedChange"
> & {
  label: ReactNode;
  description?: ReactNode;
};

export function SwitchField({ label, description, id, ...props }: SwitchFieldProps) {
  const field = useFieldContext<boolean>();
  const invalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const controlId = id ?? field.name;

  return (
    <Field orientation="horizontal" data-invalid={invalid}>
      <Switch
        id={controlId}
        name={field.name}
        checked={field.state.value}
        onCheckedChange={(checked) => field.handleChange(checked)}
        aria-invalid={invalid}
        {...props}
      />
      <div className="flex flex-col gap-1">
        <FieldLabel htmlFor={controlId}>{label}</FieldLabel>
        <FieldFeedback description={description} />
      </div>
    </Field>
  );
}
