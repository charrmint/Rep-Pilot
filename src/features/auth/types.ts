import type { ReactNode } from "react";

export interface PasswordAuthCredentials {
  email: string;
  password: string;
}

export interface SignUpResult {
  hasSession: boolean;
}

export type AuthMode = "sign_in" | "sign_up";

export interface PasswordResetInput {
  userId: string;
  password: string;
  confirmation: string;
}

export type PasswordResetResult =
  | { signedOut: boolean; error?: never }
  | { error: string; signedOut?: never };

export interface AuthPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export interface ResetPasswordFormProps {
  userId: string;
  email: string;
}

export interface AuthPageShellProps {
  title: string;
  description: string;
  children: ReactNode;
}
