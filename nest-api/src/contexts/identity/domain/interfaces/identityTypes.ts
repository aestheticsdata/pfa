/** An account as the identity context keeps it (PFA-279). The password is only ever a hash. */
export interface AccountState {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  baseCurrency: string;
  language: string | null;
  registerDate: Date;
  /** A bot of the synthetic-users runner: set at sign-up from the reserved domain, never later. */
  isSynthetic: boolean;
  disabledAt: Date | null;
}

/** What a sign-up asks for, before the password is hashed. */
export interface Registration {
  name: string;
  email: string;
  password: string;
  baseCurrency?: string;
  language?: string;
  registerDate?: string | Date;
}

/** The user as the session's owner sees it: never the hash. */
export interface Profile {
  id: string;
  name: string;
  email: string;
  baseCurrency: string;
  language: string | null;
}

/** The sign-in, sign-up and /me answers (the session itself travels as a cookie). */
export interface SignInResponse {
  user: Profile;
}

/** Who a guarded request belongs to: the only thing other contexts learn of a user. */
export interface SessionUser {
  id: string;
}

/** A bot account found through the synthetic filter. */
export interface SyntheticAccountRef {
  ID: string;
  email: string;
}

/** How many rows a purge removed, per table. */
export interface PurgeCounts {
  users: number;
  spendings: number;
  groups: number;
  recurrings: number;
  dashboards: number;
  exceptionals: number;
  categories: number;
}

/** A new account's identity and its password, already hashed. */
export interface NewAccount {
  id: string;
  passwordHash: string;
}

/** Who is trying to sign in or up, and from where. */
export interface SignInAttempt {
  email: string;
  ip: string | undefined;
  /** The bot runner's address: its daily run must never trip the throttle. */
  exempt: boolean;
}

export interface Credentials extends SignInAttempt {
  password: string;
}
