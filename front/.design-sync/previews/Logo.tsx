import { Button, GlowCard, Logo, MoneyAmount, Overline } from "pfa-next";

export const Default = () => <Logo />;

export const Glow = () => <Logo glow size={72} />;

export const Sizes = () => (
  <div className="flex items-end gap-6">
    <Logo size={20} />
    <Logo size={26} />
    <Logo size={40} />
    <Logo size={64} />
  </div>
);

export const InAppHeader = () => (
  <GlowCard className="max-w-md p-4">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <Logo size={26} />
        <span className="text-base font-semibold tracking-snug text-ink">pfa</span>
      </div>
      <Button variant="ghost" size="sm">
        Mai 2026
      </Button>
    </div>
  </GlowCard>
);

export const LoginHero = () => (
  <GlowCard className="max-w-xs p-8">
    <div className="flex flex-col items-center text-center">
      <Logo glow size={72} />
      <Overline className="mt-5">Suivi des dépenses</Overline>
      <div className="mt-2 num text-display font-medium leading-none tracking-tight text-accent-strong">
        <MoneyAmount value={1240.5} />
      </div>
      <p className="mt-3 text-xs text-ink-3">Alimentation, Transport, Loyer — tout au même endroit.</p>
    </div>
  </GlowCard>
);
