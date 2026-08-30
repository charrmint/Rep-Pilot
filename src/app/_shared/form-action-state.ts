export type FormActionStatus = "idle" | "success" | "error";

export interface FormActionState {
  status: FormActionStatus;
  message: string | null;
}

export const INITIAL_FORM_ACTION_STATE: FormActionState = {
  status: "idle",
  message: null,
};
