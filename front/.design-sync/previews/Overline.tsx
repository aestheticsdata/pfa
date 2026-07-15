import { GlowCard, MoneyAmount, Overline } from "pfa-next";

export const Default = () => <Overline>Reste à vivre</Overline>;

export const Brighter = () => <Overline className="text-ink-3">Achats exceptionnels</Overline>;

export const AsEyebrow = () => (
  <GlowCard className="max-w-xs p-5">
    <Overline>Plafond hebdomadaire</Overline>
    <div className="mt-2 num text-display font-medium leading-none tracking-tight text-accent-strong">
      <MoneyAmount value={412.8} />
    </div>
    <p className="mt-3 text-xs text-ink-3">13,76 € par jour jusqu'au 31 mai</p>
  </GlowCard>
);

export const AsColumnLabels = () => (
  <GlowCard className="max-w-lg p-5">
    <div className="grid grid-cols-3 gap-4">
      <div>
        <Overline>Alimentation</Overline>
        <div className="mt-1.5 num text-lg font-medium text-ink">
          <MoneyAmount value={286.4} />
        </div>
      </div>
      <div>
        <Overline>Transport</Overline>
        <div className="mt-1.5 num text-lg font-medium text-ink">
          <MoneyAmount value={41.35} />
        </div>
      </div>
      <div>
        <Overline>Loyer</Overline>
        <div className="mt-1.5 num text-lg font-medium text-ink">
          <MoneyAmount value={780} />
        </div>
      </div>
    </div>
  </GlowCard>
);

export const AsFootnote = () => (
  <GlowCard className="max-w-xs p-4">
    <span className="text-sm text-ink">Dépenses fixes</span>
    <div className="mt-2 num text-lg font-medium text-ink">
      <MoneyAmount value={1240.5} />
    </div>
    <Overline className="mt-2 block">72 % du budget mensuel</Overline>
  </GlowCard>
);
