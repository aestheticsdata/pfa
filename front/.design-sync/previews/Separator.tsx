import { CardSectionHeader, GlowCard, MoneyAmount, Overline, Separator } from "pfa-next";

export const Default = () => (
  <div className="w-full max-w-sm">
    <div className="pb-3">
      <p className="text-sm font-medium text-ink">Dépenses fixes</p>
      <p className="text-xs text-ink-3">Prélevées le 5 de chaque mois</p>
    </div>
    <Separator />
    <div className="pt-3">
      <p className="text-sm font-medium text-ink">Reste à vivre</p>
      <p className="text-xs text-ink-3">Recalculé à chaque dépense</p>
    </div>
  </div>
);

export const Horizontal = () => (
  <div className="flex w-full max-w-sm flex-col gap-3">
    <div className="flex items-center justify-between text-sm">
      <span className="text-ink-2">Loyer</span>
      <MoneyAmount value={780} className="num text-ink" />
    </div>
    <Separator />
    <div className="flex items-center justify-between text-sm">
      <span className="text-ink-2">Abonnement Netflix</span>
      <MoneyAmount value={13.49} className="num text-ink" />
    </div>
    <Separator />
    <div className="flex items-center justify-between text-sm">
      <span className="text-ink-2">Mutuelle</span>
      <MoneyAmount value={41.35} className="num text-ink" />
    </div>
  </div>
);

export const Vertical = () => (
  <div className="flex h-5 items-center gap-3 text-xs text-ink-3">
    <span className="num">24 dépenses</span>
    <Separator orientation="vertical" />
    <span className="num">1 240,50 €</span>
    <Separator orientation="vertical" />
    <span>mai 2026</span>
  </div>
);

/** `bg-line-soft` is the dense-list rule: many rows, so the divider must recede. */
export const SoftLine = () => {
  const rows = [
    { label: "Courses", date: "14 mai", amount: 78.2 },
    { label: "Pharmacie", date: "12 mai", amount: 23.9 },
    { label: "Uber", date: "13 mai", amount: 16.4 },
    { label: "Boulangerie", date: "11 mai", amount: 8.6 },
    { label: "Essence", date: "10 mai", amount: 62.3 },
  ];
  return (
    <div className="w-full max-w-sm">
      <Overline className="mb-2 block">Dernières dépenses</Overline>
      {rows.map((r, i) => (
        <div key={r.label}>
          {i > 0 && <Separator className="bg-line-soft" />}
          <div className="flex items-center justify-between py-1.5 text-sm">
            <span className="text-ink-2">{r.label}</span>
            <div className="flex items-center gap-3">
              <span className="num text-2xs text-ink-4">{r.date}</span>
              <MoneyAmount value={r.amount} className="num text-ink" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const InCard = () => (
  <GlowCard
    as="section"
    className="w-full max-w-sm p-5"
  >
    <CardSectionHeader
      title="Alimentation"
      meta="mai 2026"
    />
    <div className="mt-4 flex items-center justify-between">
      <div className="flex flex-col gap-1">
        <Overline>Dépensé</Overline>
        <MoneyAmount value={412.8} className="num text-sm text-ink" />
      </div>
      <Separator
        orientation="vertical"
        className="h-10"
      />
      <div className="flex flex-col gap-1">
        <Overline>Plafond</Overline>
        <MoneyAmount value={500} className="num text-sm text-ink" />
      </div>
      <Separator
        orientation="vertical"
        className="h-10"
      />
      <div className="flex flex-col gap-1">
        <Overline>Restant</Overline>
        <span className="num text-sm text-accent-strong">87,20 €</span>
      </div>
    </div>
    <Separator className="my-4" />
    <p className="text-xs text-ink-3">12 dépenses · dernière le 14 mai 2026</p>
  </GlowCard>
);
