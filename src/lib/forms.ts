// src/lib/forms.ts
//
// Estado padrão retornado pelas server actions usadas com useActionState.

export type FormState = {
  error?: string;
  message?: string;
};

export const EMPTY_FORM_STATE: FormState = {};
