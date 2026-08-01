"use client";

import { createFormHook } from "@tanstack/react-form";

import { fieldContext, formContext } from "./form-parts/form-context";
import { NativeSelectField } from "./form-parts/native-select-field";
import { SubmitButton } from "./form-parts/submit-button";
import { SwitchField } from "./form-parts/switch-field";
import { TextField } from "./form-parts/text-field";
import { TextareaField } from "./form-parts/textarea-field";

const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldComponents: {
    TextField,
    TextareaField,
    NativeSelectField,
    SwitchField,
  },
  formComponents: {
    SubmitButton,
  },
  fieldContext,
  formContext,
});

export { useAppForm, withFieldGroup, withForm };
