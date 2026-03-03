export interface AuthUser {
  id: string;
  name: string;
  email: string;
  baseCurrency: string;
  language: string | null;
}

export interface AuthResponse {
  user: AuthUser;
  csrfToken: string;
}
