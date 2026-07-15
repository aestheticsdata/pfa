import { CardSectionHeader, GlowCard, MeterBar, MoneyAmount, Overline, StatTile } from "pfa-next";

export const Default = () => (
  <GlowCard className="max-w-md p-5">
    <CardSectionHeader title="Dépenses fixes" meta="12 prélèvements" />
    <div className="mt-4 flex items-baseline justify-between">
      <MoneyAmount value={1240.5} className="num text-2xl font-medium text-ink" />
      <span className="text-xs text-ink-3">soit 14 886,00 € / an</span>
    </div>
    <MeterBar value={72} height={6} className="mt-4" />
    <p className="mt-2 text-2xs tracking-caps text-ink-4">72 % DU BUDGET MENSUEL</p>
  </GlowCard>
);

export const AsSection = () => (
  <GlowCard as="section" className="max-w-md p-5">
    <Overline>Reste à vivre</Overline>
    <div className="mt-2 num text-display font-medium leading-none tracking-tight text-accent-strong">
      <MoneyAmount value={412.8} />
    </div>
    <p className="mt-3 text-xs text-ink-3">13,76 € par jour jusqu'au 31 mai</p>
  </GlowCard>
);

export const Hover = () => (
  <GlowCard hover className="max-w-xs p-4">
    <div className="flex items-center gap-2">
      <span className="size-2.5 rounded-full" style={{ background: "oklch(0.80 0.09 150)" }} />
      <span className="text-sm text-ink">Alimentation</span>
    </div>
    <div className="mt-3 num text-lg font-medium text-ink">
      <MoneyAmount value={286.4} />
    </div>
    <p className="mt-1 text-2xs text-ink-4">18 % des dépenses · 24 fois</p>
  </GlowCard>
);

export const StatGrid = () => (
  <GlowCard className="max-w-lg p-5">
    <div className="grid grid-cols-3 gap-4">
      <StatTile label="Total" value={<MoneyAmount value={1240.5} />} sub="ce mois" />
      <StatTile label="Moyenne / jour" value={<MoneyAmount value={41.35} />} sub="sur 30 jours" />
      <StatTile label="Plus grosse" value={<MoneyAmount value={780} />} sub="Loyer · 5 mai" />
    </div>
  </GlowCard>
);
