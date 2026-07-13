import type { LangKeys } from "@src/interfaces/locales";

export interface User {
  baseCurrency: string;
  email: string;
  id: string;
  language: LangKeys;
  name: string;
}
