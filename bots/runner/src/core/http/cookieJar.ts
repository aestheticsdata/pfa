/**
 * The smallest cookie jar that does the job: one bot, one app, name → value. Attributes (path,
 * expiry, secure) are ignored — a bot only ever talks to its own app's API, and the app's session
 * expiry is enforced server-side anyway (an expired cookie gets a 401, and the bot signs in again).
 */
export class CookieJar {
  private readonly cookies = new Map<string, string>();

  store(setCookieHeaders: string[]): void {
    for (const header of setCookieHeaders) {
      const [pair] = header.split(";");
      const eq = pair?.indexOf("=") ?? -1;
      if (!pair || eq <= 0) {
        continue;
      }
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      if (value === "") {
        this.cookies.delete(name);
      } else {
        this.cookies.set(name, value);
      }
    }
  }

  header(): string | undefined {
    if (this.cookies.size === 0) {
      return undefined;
    }
    return [...this.cookies].map(([name, value]) => `${name}=${value}`).join("; ");
  }

  clear(): void {
    this.cookies.clear();
  }
}
