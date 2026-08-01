"use client";

import type { ReactNode } from "react";

import { FieldDescription, FieldError } from "../field";
import { useFieldContext } from "./form-context";

function errorMessage(error: unknown) {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    const message = error.message;
    return typeof message === "string" ? message : undefined;
  }
  return undefined;
}

export function FieldFeedback({ description, error }: { description?: ReactNode; error?: string }) {
  const field = useFieldContext<unknown>();
  const errors = field.state.meta.errors
    .map((value) => errorMessage(value))
    .filter((message): message is string => Boolean(message));

  return (
    <>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      {error || (field.state.meta.isTouched && errors.length) ? (
        <FieldError errors={(error ? [error] : errors).map((message) => ({ message }))} />
      ) : null}
    </>
  );
}
