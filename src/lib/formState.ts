export interface FormState {
  error?: string;
}

export const initialFormState: FormState = {};

/** Server actions bound to useFormState() all funnel thrown use-case errors
 * through this so the form can show an inline message (Section 8: "must show
 * inline validation errors, not a raw failed-submit state") instead of
 * crashing to the framework's default error boundary. */
export function toFormState(error: unknown): FormState {
  if (error instanceof Error) {
    return { error: error.message };
  }
  return { error: 'Something went wrong. Please try again.' };
}
