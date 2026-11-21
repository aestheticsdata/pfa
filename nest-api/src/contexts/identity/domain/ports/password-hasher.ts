/** Hashes and checks passwords (PFA-279); bcrypt is today's adapter. */
export abstract class PasswordHasher {
  abstract hash(password: string): Promise<string>;
  abstract matches(password: string, hash: string): Promise<boolean>;
}
