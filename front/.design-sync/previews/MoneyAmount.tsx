import { MoneyAmount, Overline } from "pfa-next";

export const Default = () => <MoneyAmount value={1240.5} className="num text-2xl font-medium text-ink" />;

export const Sizes = () => (
  <div className="flex flex-col gap-2.5">
    <div>
      <Overline className="block">Reste à vivre</Overline>
      <div className="mt-1.5">
        <MoneyAmount
          value={412.8}
          className="num text-display font-medium leading-none tracking-tight text-ink"
          decimalClassName="text-2xl"
        />
      </div>
    </div>
    <MoneyAmount value={1240.5} className="num text-2xl font-medium text-ink" decimalClassName="text-base" />
    <MoneyAmount value={286.4} className="num text-lg font-medium text-ink-2" />
    <MoneyAmount value={41.35} className="num text-sm text-ink-3" />
    <MoneyAmount value={13.49} className="num text-2xs text-ink-4" />
  </div>
);

export const Colours = () => (
  <div className="flex flex-col gap-3">
    <div className="flex items-baseline justify-between gap-8">
      <span className="text-xs text-ink-3">Reste à vivre</span>
      <MoneyAmount value={412.8} className="num text-lg font-medium text-accent-strong" />
    </div>
    <div className="flex items-baseline justify-between gap-8">
      <span className="text-xs text-ink-3">Dépenses fixes</span>
      <MoneyAmount value={780} className="num text-lg font-medium text-ink" />
    </div>
    <div className="flex items-baseline justify-between gap-8">
      <span className="text-xs text-ink-3">Achats exceptionnels</span>
      <MoneyAmount value={318.9} className="num text-lg font-medium text-exc" />
    </div>
    <div className="flex items-baseline justify-between gap-8">
      <span className="text-xs text-ink-3">Dépassement du plafond</span>
      <MoneyAmount value={-36.4} className="num text-lg font-medium text-neg" />
    </div>
  </div>
);

export const OverBudget = () => (
  <div>
    <Overline className="block">Dépassement hebdomadaire</Overline>
    <div className="mt-2">
      <MoneyAmount
        value={-36.4}
        className="num text-display font-medium leading-none tracking-tight text-neg"
        decimalClassName="text-2xl"
      />
    </div>
    <p className="mt-3 text-xs text-neg">286,40 € dépensés sur un plafond de 250,00 €</p>
  </div>
);

export const CustomUnit = () => (
  <div className="flex flex-col gap-4">
    <div className="flex items-baseline justify-between gap-8">
      <span className="text-xs text-ink-3">Moyenne par jour</span>
      <MoneyAmount value={41.35} unit=" € / j" className="num text-lg font-medium text-ink" />
    </div>
    <div className="flex items-baseline justify-between gap-8">
      <span className="text-xs text-ink-3">Part de l'alimentation</span>
      <MoneyAmount value={18.4} unit=" %" className="num text-lg font-medium text-ink" />
    </div>
    <div className="flex items-baseline justify-between gap-8">
      <span className="text-xs text-ink-3">Projeté sur l'année</span>
      <MoneyAmount value={14886} unit=" € / an" className="num text-lg font-medium text-ink" />
    </div>
  </div>
);

export const InlineInText = () => (
  <p className="w-72 text-sm leading-relaxed text-ink-2">
    Vous avez dépensé <MoneyAmount value={1240.5} className="num font-medium text-ink" /> en mai 2026, soit{" "}
    <MoneyAmount value={156.3} className="num font-medium text-neg" /> de plus qu'en avril. Il vous reste{" "}
    <MoneyAmount value={412.8} className="num font-medium text-accent-strong" /> jusqu'au 31 mai.
  </p>
);
