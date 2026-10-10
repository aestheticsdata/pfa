import type { MESSAGE_KIND } from "@components/auth/messageKind";
import type { InputHTMLAttributes, ReactNode } from "react";

export type MessageKind = (typeof MESSAGE_KIND)[keyof typeof MESSAGE_KIND];

export interface AuthCardProps {
  children: ReactNode;
  testId?: string;
}

export interface AuthTitleProps {
  title: string;
  /** Shown inline after the title, on the same fixed-height row: the card never changes height. */
  message?: string | null;
  kind?: MessageKind;
}

export interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  error?: string;
  hint?: string;
}

export interface MessageBoxProps {
  kind: MessageKind;
  children: ReactNode;
}

export interface AuthSubmitProps {
  children: ReactNode;
  disabled?: boolean;
}
