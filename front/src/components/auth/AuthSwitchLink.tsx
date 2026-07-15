import Link from "next/link";

interface AuthSwitchLinkProps {
  /** Question preceding the link, e.g. "Pas encore de compte ?". */
  prompt: string;
  href: string;
  label: string;
}

/**
 * Footer rule of the auth card, sending the user to the opposite screen
 * (login ⇄ signup).
 *
 * The oklch link colour is a deliberate one-off rather than a missed token —
 * see `authInputClass` for why the auth screen keeps its own teal-shifted
 * accent family instead of the app's `--accent-strong`.
 */
const AuthSwitchLink = ({ prompt, href, label }: AuthSwitchLinkProps) => (
  <div className="mt-5 flex justify-center gap-1.5 border-t border-white/[0.07] pt-4.5 text-xs text-ink-3">
    {prompt}{" "}
    <Link
      href={href}
      className="font-medium text-[oklch(0.82_0.12_165)] hover:underline"
    >
      {label}
    </Link>
  </div>
);

export { AuthSwitchLink };
