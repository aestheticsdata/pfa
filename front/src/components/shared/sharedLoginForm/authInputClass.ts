/**
 * Input skin for the auth forms, shared by the plain fields and `PasswordField`.
 *
 * The oklch literals are deliberate one-offs, not un-tokenized leftovers: the auth
 * screen runs a teal-shifted accent family (165 link, 175 focus, 185/150 halo,
 * 148→200 tab underline) that matches `AuthCard`'s gradient border and halo.
 * Routing focus through the app's `--accent-d` (hue 148) would clash with the
 * card's teal. The translucent fill is likewise load-bearing — it lets the glass
 * card show through, which an opaque `bg-bg` would kill.
 */
export const authInputClass =
  "w-full rounded-sm border border-line px-3.5 py-3 text-sm text-ink outline-none transition [background:oklch(0.12_0.008_250/0.75)] placeholder:text-ink-4 focus:border-[oklch(0.65_0.11_175)] focus:[background:oklch(0.13_0.008_250)] focus:shadow-[0_0_0_3px_oklch(0.65_0.11_175/0.15)] aria-invalid:border-neg";
