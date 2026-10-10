import { AUTH_TEXT } from "@text/auth";

/**
 * Every auth screen (sign in, setup, sealed, recover): the bot-runner identity, never an app's —
 * and the `1991computer` wordmark bleeding off the bottom of the viewport behind the card.
 */
const AuthLayout = ({ children }: LayoutProps<"/">) => (
  <main className="theme-runner relative isolate grid min-h-dvh place-items-center content-center gap-3.5 overflow-hidden bg-bg p-gut text-text tablet:p-6">
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 -bottom-bleed z-0 flex select-none justify-center whitespace-nowrap font-mono text-backdrop font-semibold tracking-backdrop opacity-22"
    >
      <span className="text-gradient bg-(image:--brand-gradient-1991)">{AUTH_TEXT.backdrop.first}</span>
      <span className="text-gradient bg-(image:--brand-gradient-computer)">{AUTH_TEXT.backdrop.second}</span>
    </div>
    {children}
    <p className="relative z-1 m-0 whitespace-nowrap text-center font-mono text-tiny font-medium tracking-th text-dim">
      {AUTH_TEXT.credit.before}
      <b className="text-gradient bg-(image:--brand-gradient-credit) font-semibold">{AUTH_TEXT.credit.brand}</b>
      {AUTH_TEXT.credit.after}
    </p>
  </main>
);

export default AuthLayout;
