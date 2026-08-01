"use client";

import type { ComponentProps, ReactNode } from "react";

import { Button } from "../button";
import { Spinner } from "../spinner";
import { useFormContext } from "./form-context";

type SubmitButtonProps = ComponentProps<typeof Button> & {
  pendingLabel?: ReactNode;
};

export function SubmitButton({ children, pendingLabel, disabled, ...props }: SubmitButtonProps) {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
      {([canSubmit, isSubmitting]) => (
        <Button type="submit" disabled={disabled || !canSubmit || isSubmitting} {...props}>
          {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
          {isSubmitting && pendingLabel ? pendingLabel : children}
        </Button>
      )}
    </form.Subscribe>
  );
}
